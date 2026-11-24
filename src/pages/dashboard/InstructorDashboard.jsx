import { useEffect, useState } from "react";
import { getInstructorDashboard } from "../../api/instructor/instructor.api";
import useTranslation from "../../hooks/useTranslation";

const isValidDashboard = (dashboard) =>
  dashboard &&
  ["totalCourses", "publishedCourses", "totalStudents"].every((key) =>
    dashboard[key] != null && Number.isFinite(Number(dashboard[key])),
  ) &&
  Array.isArray(dashboard.courseStats) &&
  dashboard.courseStats.every(
    (course) =>
      course?.courseId != null &&
      typeof course.title === "string" &&
      course.enrolledStudents != null &&
      Number.isFinite(Number(course.enrolledStudents)),
  );

export default function InstructorDashboard() {
  const { t, currentLang } = useTranslation();
  const [retryKey, setRetryKey] = useState(0);
  const [result, setResult] = useState({
    key: null,
    dashboard: null,
    error: false,
  });
  const loading = result.key !== retryKey;
  const dashboard = loading || result.error ? null : result.dashboard;

  useEffect(() => {
    const controller = new AbortController();

    getInstructorDashboard({ signal: controller.signal })
      .then((response) => {
        if (controller.signal.aborted) return;
        if (!isValidDashboard(response)) {
          throw new Error();
        }
        setResult({ key: retryKey, dashboard: response, error: false });
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setResult({ key: retryKey, dashboard: null, error: true });
      });

    return () => controller.abort();
  }, [retryKey]);

  return (
    <main className="min-h-screen bg-bg-main py-16 text-text-main md:py-24">
      <div className="container mx-auto max-w-7xl space-y-8 px-4 sm:px-6">
        <h1 className="text-2xl font-black">{t.nav.instructorDashboard}</h1>

        {loading ? (
          <p className="py-12 text-center text-text-muted" role="status">
            {t.dashboard.loading}
          </p>
        ) : result.error ? (
          <div className="space-y-3 py-12 text-center" role="alert">
            <p>{t.dashboard.instructorLoadError}</p>
            <button
              type="button"
              onClick={() => setRetryKey((value) => value + 1)}
              className="font-bold text-primary hover:underline"
            >
              {t.dashboard.retry}
            </button>
          </div>
        ) : (
          <>
            <section className="grid gap-4 sm:grid-cols-3" aria-label={t.dashboard.overview}>
              {[
                [t.dashboard.totalCourses, dashboard.totalCourses],
                [t.dashboard.publishedCourses, dashboard.publishedCourses],
                [t.dashboard.totalStudents, dashboard.totalStudents],
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
            </section>

            <section className="space-y-4">
              <h2 className="text-lg font-bold">{t.dashboard.courseSummary}</h2>
              {dashboard.courseStats.length === 0 ? (
                <p className="py-8 text-center text-text-muted">
                  {t.dashboard.noInstructorCourses}
                </p>
              ) : (
                <div className="divide-y divide-primary/10 rounded-2xl border border-primary/10 bg-bg-surface">
                  {dashboard.courseStats.map((course) => (
                    <article
                      key={course.courseId}
                      className="flex flex-wrap items-center justify-between gap-3 p-4"
                    >
                      <h3 className="min-w-0 break-words font-semibold">
                        {course.title}
                      </h3>
                      <p className="text-sm text-text-muted">
                        {Number(course.enrolledStudents).toLocaleString(currentLang)}{" "}
                        {t.dashboard.totalStudents.toLowerCase()}
                      </p>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
