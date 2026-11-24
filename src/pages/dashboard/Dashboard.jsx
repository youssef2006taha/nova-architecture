import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FiDownload,
  FiGrid,
  FiPackage,
  FiAward,
} from "react-icons/fi";
import useTranslation from "../../hooks/useTranslation";
import {
  getCertificatePdf,
  getStudentDashboard,
} from "../../api/student/student.api";
import { getOrders } from "../../api/cart/cart.api";

export default function Dashboard() {
  const { t, currentLang } = useTranslation();
  const { user } = useSelector((state) => state.auth);
  const location = useLocation();
  const navigate = useNavigate();
  const certificateDownloadController = useRef(null);
  const dashboardPath = location.pathname.replace(/\/+$/, "");
  const activeTab = dashboardPath.endsWith("/orders")
    ? "orders"
    : dashboardPath.endsWith("/downloads")
      ? "downloads"
      : "courses";
  const [retryKey, setRetryKey] = useState(0);
  const [dashboardResult, setDashboardResult] = useState({
    key: null,
    dashboard: null,
    error: false,
  });
  const dashboard = dashboardResult.key === retryKey
    ? dashboardResult.dashboard
    : null;
  const loading = dashboardResult.key !== retryKey;
  const loadError =
    dashboardResult.key === retryKey && dashboardResult.error;
  const [downloadingCode, setDownloadingCode] = useState(null);
  const [downloadError, setDownloadError] = useState(false);
  const [ordersRetryKey, setOrdersRetryKey] = useState(0);
  const [ordersResult, setOrdersResult] = useState({
    key: null,
    orders: [],
    error: false,
  });
  const orders = ordersResult.key === ordersRetryKey
    ? ordersResult.orders
    : [];
  const ordersLoaded =
    ordersResult.key === ordersRetryKey && !ordersResult.error;
  const ordersLoading =
    activeTab === "orders" && ordersResult.key !== ordersRetryKey;
  const ordersError =
    ordersResult.key === ordersRetryKey && ordersResult.error;

  useEffect(() => {
    if (activeTab === "orders" || dashboardResult.key === retryKey) {
      return undefined;
    }

    const controller = new AbortController();
    let responseShape = null;

    getStudentDashboard({ signal: controller.signal })
      .then((response) => {
        if (controller.signal.aborted) return;
        const enrolledCourses = response?.enrolledCourses ?? response?.courses;
        const certificates = Array.isArray(response?.certificates)
          ? response.certificates
          : [];
        const certificateCount =
          response?.certificatesEarned ?? certificates.length;
        const normalizedDashboard = {
          ...response,
          enrolledCourses,
          certificates,
          certificateCount,
        };

        responseShape = {
          keys:
            response && typeof response === "object"
              ? Object.keys(response)
              : [],
          enrolledCourses: Array.isArray(enrolledCourses)
            ? `array(${enrolledCourses.length})`
            : typeof enrolledCourses,
          certificates: Array.isArray(certificates)
            ? `array(${certificates.length})`
            : typeof response?.certificates,
          certificateCountType: typeof certificateCount,
          recentActivity: Array.isArray(response?.recentActivity)
            ? `array(${response.recentActivity.length})`
            : typeof response?.recentActivity,
        };
        if (
          !response ||
          !Array.isArray(enrolledCourses) ||
          !Array.isArray(certificates) ||
          !Number.isInteger(Number(certificateCount)) ||
          Number(certificateCount) < 0 ||
          (response.totalEnrolledCourses != null &&
            (!Number.isInteger(Number(response.totalEnrolledCourses)) ||
              Number(response.totalEnrolledCourses) < 0)) ||
          !Array.isArray(response.recentActivity) ||
          enrolledCourses.some(
            (course) =>
              course?.courseId == null ||
              typeof course.courseTitle !== "string" ||
              course.progressPercentage == null ||
              !Number.isFinite(Number(course.progressPercentage)),
          ) ||
          certificates.some(
            (certificate) =>
              certificate?.id == null ||
              typeof certificate.courseTitle !== "string" ||
              typeof certificate.verificationCode !== "string",
          ) ||
          response.recentActivity.some(
            (activity) =>
              typeof activity?.type !== "string" ||
              typeof activity.courseTitle !== "string" ||
              (activity.timestamp != null &&
                (typeof activity.timestamp !== "string" ||
                  !Number.isFinite(Date.parse(activity.timestamp)))),
          )
        ) {
          throw new Error();
        }
        setDashboardResult({
          key: retryKey,
          dashboard: normalizedDashboard,
          error: false,
        });
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        if (import.meta.env.DEV) {
          const responseData = error?.response?.data;
          const responseMessage = [
            responseData?.message,
            responseData?.error,
            responseData?.title,
          ].find(
            (message) =>
              typeof message === "string" && message.trim().length > 0,
          );
          const responseErrors = Array.isArray(responseData?.errors)
            ? responseData.errors.filter(
                (message) => typeof message === "string",
              )
            : [];
          console.error("Failed to load the learning dashboard.", {
            status: error?.response?.status,
            responseShape,
            hasServerMessage: Boolean(responseMessage || responseErrors.length),
          });
        }
        setDashboardResult({
          key: retryKey,
          dashboard: null,
          error: true,
        });
      });

    return () => controller.abort();
  }, [activeTab, dashboardResult.key, retryKey]);

  useEffect(() => {
    if (activeTab !== "orders" || ordersLoaded) return undefined;

    const controller = new AbortController();
    getOrders({ signal: controller.signal })
      .then((response) => {
        if (
          controller.signal.aborted ||
          !Array.isArray(response) ||
          response.some((order) => {
            const total =
              order?.totalAfterCoupon ?? order?.totalBeforeDiscount;
            return (
              typeof order?.id !== "string" ||
              !order.id ||
              typeof order.status !== "string" ||
              total == null ||
              (typeof total === "string" && !total.trim()) ||
              !Number.isFinite(Number(total)) ||
              (order.paidAt != null &&
                (typeof order.paidAt !== "string" ||
                  !Number.isFinite(Date.parse(order.paidAt))))
            );
          })
        ) {
          throw new Error();
        }
        setOrdersResult({
          key: ordersRetryKey,
          orders: response,
          error: false,
        });
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setOrdersResult({
          key: ordersRetryKey,
          orders: [],
          error: true,
        });
      });

    return () => controller.abort();
  }, [activeTab, ordersLoaded, ordersRetryKey]);

  useEffect(
    () => () => certificateDownloadController.current?.abort(),
    [],
  );

  const handleDownloadCertificate = async (certificate) => {
    if (certificateDownloadController.current) return;
    const controller = new AbortController();
    certificateDownloadController.current = controller;
    setDownloadError(false);
    try {
      setDownloadingCode(certificate.verificationCode);
      const file = await getCertificatePdf(certificate.verificationCode, {
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;
      const url = URL.createObjectURL(file);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Certificate_${certificate.verificationCode}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      if (!controller.signal.aborted) setDownloadError(true);
    } finally {
      if (!controller.signal.aborted) {
        setDownloadingCode(null);
        certificateDownloadController.current = null;
      }
    }
  };

  const enrolledCourses = dashboard?.enrolledCourses;
  const certificates = dashboard?.certificates;
  const recentActivity = dashboard?.recentActivity;
  const orderStatusLabels = new Map([
    ["Paid", t.dashboard.orderStatusPaid],
    ["PendingVerification", t.dashboard.orderStatusPendingVerification],
  ]);

  return (
    <div className="py-16 md:py-24 bg-bg-main text-text-main min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 max-w-7xl space-y-10">
        <div className="p-8 rounded-3xl bg-bg-surface border border-primary/10 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-lg">
          <div className="flex items-center gap-4 text-center sm:text-start">
            <div className="w-16 h-16 rounded-full bg-primary/20 text-primary border border-primary/30 flex items-center justify-center font-black text-2xl">
              {user?.fullName?.charAt(0) || user?.email?.charAt(0) || "U"}
            </div>
            <div>
              <h1 className="text-2xl font-black uppercase">
                {t.dashboard.welcome}, {user?.fullName || t.dashboard.student}
              </h1>
              <p className="text-xs text-text-muted">{user?.email}</p>
            </div>
          </div>

          {activeTab !== "orders" && dashboard && !loading && !loadError && (
            <div className="flex flex-wrap items-center justify-center gap-3 text-center sm:gap-6">
              <div className="p-3 px-5 rounded-2xl bg-bg-secondary border border-primary/10">
                <span className="text-xl font-black text-primary block">
                  {Number(
                    dashboard.totalEnrolledCourses ?? enrolledCourses.length,
                  ).toLocaleString(currentLang)}
                </span>
                <span className="text-[11px] uppercase tracking-wider text-text-muted">
                  {t.dashboard.enrolledCourses}
                </span>
              </div>
              <div className="p-3 px-5 rounded-2xl bg-bg-secondary border border-primary/10">
                <span className="text-xl font-black text-primary block">
                  {Number(dashboard.certificateCount).toLocaleString(currentLang)}
                </span>
                <span className="text-[11px] uppercase tracking-wider text-text-muted">
                  {t.dashboard.certificates}
                </span>
              </div>
            </div>
          )}
        </div>

        <nav
          aria-label={t.dashboard.studentNavigation}
          className="flex flex-wrap border-b border-primary/10 gap-4 sm:gap-8"
        >
          {[
            { id: "courses", path: "/dashboard/student", label: t.dashboard.enrolledCourses, icon: <FiGrid /> },
            { id: "downloads", path: "/dashboard/downloads", label: t.nav.myDownloads, icon: <FiDownload /> },
            { id: "orders", path: "/dashboard/orders", label: t.nav.myOrders, icon: <FiPackage /> },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                if (dashboardPath !== tab.path) navigate(tab.path);
              }}
              aria-current={activeTab === tab.id ? "page" : undefined}
              className={`flex shrink-0 items-center gap-2 whitespace-nowrap pb-4 text-sm font-bold uppercase tracking-wider border-b-2 transition-all ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-text-muted hover:text-text-main"
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        {activeTab !== "orders" && loading && (
          <div
            className="py-12 text-center text-text-muted"
            role="status"
          >
            {t.dashboard.loading}
          </div>
        )}

        {activeTab !== "orders" && !loading && (loadError || !dashboard) && (
          <div
            className="py-12 flex flex-col items-center justify-center gap-4 text-text-main"
            role="alert"
          >
            <p>{t.dashboard.loadError}</p>
            <button
              type="button"
              onClick={() => setRetryKey((value) => value + 1)}
              className="text-sm font-bold text-primary hover:underline"
            >
              {t.dashboard.retry}
            </button>
          </div>
        )}

        {activeTab === "courses" && dashboard && !loading && !loadError && (
          <div className="space-y-10">
            {enrolledCourses.length === 0 ? (
              <p className="py-12 text-center text-text-muted">
                {t.dashboard.emptyCourses}
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {enrolledCourses.map((course) => {
                  const progress = Math.min(
                    100,
                    Math.max(0, Number(course.progressPercentage) || 0),
                  );
                  return (
                    <article
                      key={course.courseId}
                      className="rounded-3xl bg-bg-surface border border-primary/10 p-6 space-y-4 shadow-md"
                    >
                      <h3
                        id={`course-title-${course.courseId}`}
                        className="break-words font-bold text-base line-clamp-2"
                      >
                        {course.courseTitle}
                      </h3>
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs text-text-muted">
                          <span id={`course-progress-label-${course.courseId}`}>
                            {t.dashboard.progress}
                          </span>
                          <span
                            id={`course-progress-value-${course.courseId}`}
                            className="font-bold text-primary"
                          >
                            {progress}%
                          </span>
                        </div>
                        <div
                          className="w-full h-2 rounded-full bg-primary/10 overflow-hidden"
                          role="progressbar"
                          aria-labelledby={`course-title-${course.courseId} course-progress-label-${course.courseId} course-progress-value-${course.courseId}`}
                          aria-valuenow={progress}
                          aria-valuemin={0}
                          aria-valuemax={100}
                        >
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            <section className="space-y-4">
              <h2 className="text-xl font-bold">{t.dashboard.recentActivity}</h2>
              {recentActivity.length === 0 ? (
                <p className="text-sm text-text-muted">{t.dashboard.noActivity}</p>
              ) : (
                <div className="space-y-3">
                  {recentActivity.map((activity, index) => (
                    <article
                      key={`${activity.timestamp}-${index}`}
                      className="p-4 rounded-2xl bg-bg-surface border border-primary/10"
                    >
                      <p className="font-semibold text-sm">
                        {activity.lessonTitle || activity.type}
                      </p>
                      <p className="text-xs text-text-muted">
                        {activity.courseTitle}
                        {activity.timestamp &&
                        ` · ${new Date(activity.timestamp).toLocaleString(currentLang)}`}
                      </p>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {activeTab === "downloads" &&
          dashboard &&
          !loading &&
          !loadError && (
          <section className="space-y-4">
            <h2 className="text-xl font-bold">{t.dashboard.certificates}</h2>
            {downloadError && (
              <p className="text-sm text-red-500" role="alert">
                {t.dashboard.downloadError}
              </p>
            )}
            {certificates.length === 0 ? (
              <p className="py-12 text-center text-text-muted">
                {dashboard.certificateCount > 0
                  ? t.dashboard.certificateListUnavailable
                  : t.dashboard.emptyCertificates}
              </p>
            ) : (
              certificates.map((certificate) => (
                <article
                  key={certificate.id}
                  className="p-5 rounded-2xl bg-bg-surface border border-primary/10 flex flex-col sm:flex-row items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <FiAward className="w-5 h-5 text-primary" />
                    <div>
                      <h3 className="font-bold text-sm">
                        {certificate.courseTitle}
                      </h3>
                      <p className="text-xs text-text-muted">
                        {certificate.verificationCode}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={downloadingCode !== null}
                    aria-busy={downloadingCode === certificate.verificationCode}
                    onClick={() => handleDownloadCertificate(certificate)}
                    className="px-5 py-2.5 rounded-xl bg-primary/10 hover:bg-primary text-primary hover:text-primary-inverse font-bold text-xs flex items-center gap-2 transition-all disabled:opacity-50"
                  >
                    <FiDownload className="w-4 h-4" />
                    <span>
                      {downloadingCode === certificate.verificationCode
                        ? t.dashboard.downloadingCertificate
                        : t.dashboard.downloadCertificate}
                    </span>
                  </button>
                </article>
              ))
            )}
          </section>
          )}

        {activeTab === "orders" && (
          <div className="space-y-4">
            {ordersLoading ? (
              <p className="py-12 text-center text-text-muted" role="status">
                {t.dashboard.ordersLoading}
              </p>
            ) : ordersError ? (
              <div className="py-12 text-center space-y-3" role="alert">
                <p>{t.dashboard.ordersError}</p>
                <button
                  type="button"
                  onClick={() => setOrdersRetryKey((value) => value + 1)}
                  className="text-sm font-bold text-primary hover:underline"
                >
                  {t.dashboard.retry}
                </button>
              </div>
            ) : orders.length === 0 ? (
              <p className="py-12 text-center text-text-muted">
                {t.dashboard.emptyOrders}
              </p>
            ) : (
              orders.map((order) => (
                <article
                  key={order.id}
                  className="flex flex-col gap-3 rounded-2xl border border-primary/10 bg-bg-surface p-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="break-all font-bold text-sm">{order.id}</span>
                      <span className="break-all text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                        {orderStatusLabels.get(order.status) || order.status}
                      </span>
                    </div>
                    {order.paidAt && (
                      <time
                        dateTime={order.paidAt}
                        className="text-xs text-text-muted"
                      >
                        {new Date(order.paidAt).toLocaleDateString(currentLang)}
                      </time>
                    )}
                  </div>
                  <span className="font-black text-sm text-primary">
                    {Number(
                      order.totalAfterCoupon ?? order.totalBeforeDiscount,
                    ).toLocaleString(currentLang, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </article>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
