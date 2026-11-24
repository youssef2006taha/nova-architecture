import { Link } from "react-router-dom";
import useTranslation from "../../hooks/useTranslation";
import useHomeCms from "../../hooks/useHomeCms";

export default function About() {
  const { t, currentLang } = useTranslation();
  const { homeContent, homeLoading, homeError, retryHomeContent } = useHomeCms();
  const statistics = homeContent?.statistics;

  const metrics = statistics
    ? [
        [t.home.totalStudents, statistics.totalStudents],
        [t.home.totalCourses, statistics.totalCourses],
        [t.home.totalEnrollments, statistics.totalEnrollments],
        [t.home.totalInstructors, statistics.totalInstructors],
      ]
    : [];

  return (
    <div className="py-16 md:py-24 bg-bg-main text-text-main min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 max-w-5xl space-y-16">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="text-xs font-bold uppercase tracking-widest text-primary">
            {t.about.eyebrow}
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight">
            {t.about.title}
          </h1>
          <p className="text-base sm:text-lg text-text-muted leading-relaxed">
            {t.about.description}
          </p>
        </div>

        {homeLoading && (
          <p className="text-center text-text-muted" role="status">
            {t.home.contentLoading}
          </p>
        )}

        {homeError && (
          <div className="text-center space-y-3" role="alert">
            <p>{t.home.contentUnavailable}</p>
            <button
              type="button"
              onClick={retryHomeContent}
              className="text-sm font-bold text-primary hover:underline"
            >
              {t.courses.retry}
            </button>
          </div>
        )}

        {homeContent && (
          <>
            <section className="space-y-8">
              <h2 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-wide text-center">
                {t.home.statisticsTitle}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {metrics.map(([label, value]) => (
                  <div
                    key={label}
                    className="p-6 rounded-3xl bg-bg-surface border border-primary/10 text-center space-y-2"
                  >
                    <div className="text-3xl sm:text-4xl font-black text-primary">
                      {new Intl.NumberFormat(
                        currentLang === "ar" ? "ar" : "en",
                      ).format(Number(value))}
                    </div>
                    <div className="text-xs font-bold uppercase tracking-wider text-text-muted">
                      {label}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-8">
              <h2 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-wide text-center">
                {t.home.categoriesTitle}
              </h2>
              {homeContent.featuredCategories.length === 0 ? (
                <p className="text-center text-text-muted">
                  {t.home.noCategories}
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {homeContent.featuredCategories.map((category) => (
                    <Link
                      key={category.id}
                      to={`/courses?categoryId=${encodeURIComponent(category.id)}`}
                      className="rounded-3xl bg-bg-surface border border-primary/10 p-6 font-bold hover:border-primary/40 transition-colors"
                    >
                      {category.name}
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div
            className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5 text-sm text-amber-700"
            role="status"
          >
            <p>{t.home.scenesUnavailable}</p>
            <Link to="/3d-scenes" className="mt-2 inline-block font-bold underline">
              {t.nav.scenes}
            </Link>
          </div>
          <div
            className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5 text-sm text-amber-700"
            role="status"
          >
            <p>{t.furniture.catalogUnavailable}</p>
            <Link to="/furniture" className="mt-2 inline-block font-bold underline">
              {t.nav.furniture}
            </Link>
          </div>
          <div
            className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5 text-sm text-amber-700"
            role="status"
          >
            <p>{t.projectRequests.onlineUnavailable}</p>
            <Link
              to="/project-requests"
              className="mt-2 inline-block font-bold underline"
            >
              {t.nav.projectRequests}
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
