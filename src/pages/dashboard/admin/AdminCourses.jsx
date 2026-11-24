import { useEffect, useRef, useState } from "react";
import {
  getPendingAdminCourses,
  updateAdminCourseApproval,
} from "../../../api/admin/admin.api";
import useTranslation from "../../../hooks/useTranslation";
import AdminRejectionForm from "./AdminRejectionForm";
import AdminCourseCreateForm from "./AdminCourseCreateForm";
import { getAdminErrorMessage } from "./adminDashboardUtils";

export default function AdminCourses() {
  const { t } = useTranslation();
  const mountedRef = useRef(true);
  const [retryKey, setRetryKey] = useState(0);
  const [result, setResult] = useState({ key: null, courses: [], error: null });
  const [busyCourseId, setBusyCourseId] = useState(null);
  const [rejectingCourseId, setRejectingCourseId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const loading = result.key !== retryKey;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    getPendingAdminCourses({ signal: controller.signal })
      .then((courses) => {
        if (controller.signal.aborted) return;
        if (
          !Array.isArray(courses) ||
          courses.some(
            (course) => course?.id == null || typeof course.title !== "string",
          )
        ) {
          setResult({
            key: retryKey,
            courses: [],
            error: { type: "invalid" },
          });
          return;
        }
        setResult({ key: retryKey, courses, error: null });
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        setResult({
          key: retryKey,
          courses: [],
          error: { type: "load", status: error?.response?.status },
        });
      });

    return () => controller.abort();
  }, [retryKey]);

  const refresh = () => setRetryKey((value) => value + 1);

  const handleApproval = async (courseId, approve) => {
    if (!approve && !rejectionReason.trim()) {
      setActionError(t.dashboard.adminReasonRequired);
      setActionSuccess("");
      return;
    }
    setBusyCourseId(courseId);
    setActionError("");
    setActionSuccess("");
    try {
      await updateAdminCourseApproval(courseId, {
        approve,
        rejectionReason: approve ? null : rejectionReason.trim(),
      });
      if (!mountedRef.current) return;
      setRejectingCourseId(null);
      setRejectionReason("");
      setActionSuccess(
        approve
          ? t.dashboard.courseApprovalSuccess
          : t.dashboard.courseRejectionSuccess,
      );
      refresh();
    } catch (error) {
      if (mountedRef.current) {
        setActionError(
          getAdminErrorMessage(
            error,
            t.dashboard.adminActionError,
            t.dashboard,
          ),
        );
      }
    } finally {
      if (mountedRef.current) setBusyCourseId(null);
    }
  };

  const loadError =
    result.error?.type === "invalid"
      ? t.dashboard.adminInvalidCourses
      : getAdminErrorMessage(
          { response: { status: result.error?.status } },
          t.dashboard.adminLoadError,
          t.dashboard,
        );

  return (
    <section className="space-y-5">
      <h2 className="text-lg font-bold">{t.dashboard.adminCourses}</h2>
      <AdminCourseCreateForm />
      {actionError && (
        <p className="text-sm text-red-500" role="alert">{actionError}</p>
      )}
      {actionSuccess && (
        <p className="text-sm text-emerald-600 dark:text-emerald-400" role="status">
          {actionSuccess}
        </p>
      )}
      {loading ? (
        <p className="py-10 text-center text-text-muted" role="status">
          {t.dashboard.adminLoading}
        </p>
      ) : result.error ? (
        <div className="space-y-3 py-10 text-center" role="alert">
          <p>{loadError}</p>
          <button type="button" onClick={refresh} className="font-bold text-primary hover:underline">
            {t.dashboard.retry}
          </button>
        </div>
      ) : result.courses.length === 0 ? (
        <p className="py-10 text-center text-text-muted">
          {t.dashboard.noPendingCourses}
        </p>
      ) : (
        <div className="space-y-4">
          {result.courses.map((course) => (
            <article
              key={course.id}
              className="space-y-4 rounded-2xl border border-primary/10 bg-bg-surface p-5"
            >
              <h3 className="font-bold">{course.title}</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busyCourseId === course.id}
                  onClick={() => handleApproval(course.id, true)}
                  className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-inverse disabled:opacity-50"
                >
                  {t.dashboard.approveCourse}
                </button>
                <button
                  type="button"
                  disabled={busyCourseId === course.id}
                  onClick={() => {
                    setRejectingCourseId(
                      rejectingCourseId === course.id ? null : course.id,
                    );
                    setRejectionReason("");
                    setActionError("");
                    setActionSuccess("");
                  }}
                  className="rounded-xl border border-red-500/30 px-4 py-2 text-sm font-bold text-red-500 disabled:opacity-50"
                >
                  {t.dashboard.rejectCourse}
                </button>
              </div>
              {rejectingCourseId === course.id && (
                <AdminRejectionForm
                  value={rejectionReason}
                  onChange={setRejectionReason}
                  onSubmit={() => handleApproval(course.id, false)}
                  disabled={busyCourseId === course.id}
                  reasonLabel={t.dashboard.rejectionReason}
                  confirmLabel={t.dashboard.confirmRejection}
                />
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
