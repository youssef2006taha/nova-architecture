import { useEffect, useState } from "react";
import { getAdminStatistics } from "../../../api/admin/admin.api";
import useTranslation from "../../../hooks/useTranslation";
import { getAdminErrorMessage } from "./adminDashboardUtils";

const statisticKeys = [
  "totalRevenue",
  "totalPaidOrders",
  "totalRegisteredUsers",
  "totalPendingCourses",
];

export default function AdminOverview() {
  const { t, currentLang } = useTranslation();
  const [retryKey, setRetryKey] = useState(0);
  const [result, setResult] = useState({
    key: null,
    statistics: null,
    error: null,
  });
  const loading = result.key !== retryKey;

  useEffect(() => {
    const controller = new AbortController();
    getAdminStatistics({ signal: controller.signal })
      .then((statistics) => {
        if (controller.signal.aborted) return;
        if (
          !statistics ||
          statisticKeys.some(
            (key) =>
              statistics[key] == null ||
              (typeof statistics[key] === "string" &&
                !statistics[key].trim()) ||
              !Number.isFinite(Number(statistics[key])),
          )
        ) {
          setResult({
            key: retryKey,
            statistics: null,
            error: { type: "invalid" },
          });
          return;
        }
        setResult({ key: retryKey, statistics, error: null });
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        setResult({
          key: retryKey,
          statistics: null,
          error: { type: "load", status: error?.response?.status },
        });
      });

    return () => controller.abort();
  }, [retryKey]);

  const statistics = loading || result.error ? null : result.statistics;
  const errorMessage =
    result.error?.type === "invalid"
      ? t.dashboard.adminInvalidStatistics
      : getAdminErrorMessage(
          { response: { status: result.error?.status } },
          t.dashboard.adminLoadError,
          t.dashboard,
        );

  return (
    <section className="space-y-5">
      <h2 className="text-lg font-bold">{t.dashboard.overview}</h2>
      {loading ? (
        <p className="py-10 text-center text-text-muted" role="status">
          {t.dashboard.adminLoading}
        </p>
      ) : result.error ? (
        <div className="space-y-3 py-10 text-center" role="alert">
          <p>{errorMessage}</p>
          <button
            type="button"
            onClick={() => setRetryKey((value) => value + 1)}
            className="font-bold text-primary hover:underline"
          >
            {t.dashboard.retry}
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            [t.dashboard.totalRevenue, statistics.totalRevenue],
            [t.dashboard.totalPaidOrders, statistics.totalPaidOrders],
            [t.dashboard.totalRegisteredUsers, statistics.totalRegisteredUsers],
            [t.dashboard.totalPendingCourses, statistics.totalPendingCourses],
          ].map(([label, value]) => (
            <article
              key={label}
              className="rounded-2xl border border-primary/10 bg-bg-surface p-5"
            >
              <p className="text-sm text-text-muted">{label}</p>
              <p className="mt-2 text-2xl font-black text-primary">
                {Number(value).toLocaleString(currentLang)}
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
