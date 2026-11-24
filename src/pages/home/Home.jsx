import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import {
  FiArrowRight,
  FiArrowLeft,
  FiLayers,
  FiMail,
} from "react-icons/fi";
import useTranslation from "../../hooks/useTranslation";
import PrimaryButton from "../../components/ui/PrimaryButton";
import CourseCard from "../../components/courses/CourseCard";
import { subscribeNewsletter } from "../../api/cms/cms.api";
import { showToast } from "../../features/ui/toast/toastSlice";
import useHomeCms from "../../hooks/useHomeCms";

export default function Home() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t, dir, currentLang } = useTranslation();
  const { homeContent, homeLoading, homeError, retryHomeContent } = useHomeCms();
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterLoading, setNewsletterLoading] = useState(false);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    try {
      setNewsletterLoading(true);
      const response = await subscribeNewsletter(newsletterEmail.trim());
      if (response?.succeeded !== true) {
        throw new Error(response?.message || "Newsletter subscription failed.");
      }
      dispatch(
        showToast({
          message: t.home.subscribedSuccess,
          severity: "success",
        })
      );
      setNewsletterEmail("");
    } catch {
      dispatch(
        showToast({
          message: t.home.subscribeError,
          severity: "error",
        })
      );
    } finally {
      setNewsletterLoading(false);
    }
  };

  const ArrowIcon = dir === "rtl" ? FiArrowLeft : FiArrowRight;
  const heroTitle =
    currentLang === "ar"
      ? `${t.home.heroTitle1} ${t.home.heroTitle2}`
      : homeContent?.hero.mainTitle;
  const heroSubtitle =
    currentLang === "ar" ? t.home.heroSubtitle : homeContent?.hero.subtitle;
  const heroCtaText =
    currentLang === "ar"
      ? t.home.exploreCourses
      : homeContent?.hero.primaryCtaText || t.home.exploreCourses;
  const heroCtaPath =
    typeof homeContent?.hero.primaryCtaLink === "string" &&
    homeContent.hero.primaryCtaLink.startsWith("/") &&
    !homeContent.hero.primaryCtaLink.startsWith("//")
      ? homeContent.hero.primaryCtaLink
      : "/courses";
  const statistics = homeContent?.statistics;

  return (
    <div className="relative overflow-hidden bg-bg-main text-text-main">
      {/* ================= HERO SECTION ================= */}
      <section className="relative min-h-[85vh] flex items-center justify-center py-20 px-4 sm:px-6 overflow-hidden border-b border-primary/10">
        {/* Ambient Glow Orbs */}
        <div className="absolute top-1/4 -start-24 w-96 h-96 bg-primary/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 -end-24 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

        <div className="container mx-auto max-w-5xl text-center relative z-10 space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary tracking-widest uppercase">
            <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
            <span>{t.home.heroBadge}</span>
          </div>

          {heroTitle ? (
            <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black uppercase tracking-tight leading-[1.08] text-balance">
              <span className="bg-linear-to-r from-primary via-purple-400 to-pink-500 bg-clip-text text-transparent">
                {heroTitle}
              </span>
            </h1>
          ) : null}

          {homeLoading && (
            <p className="text-base text-text-muted" role="status">
              {t.home.contentLoading}
            </p>
          )}

          {homeError && (
            <div className="space-y-3" role="alert">
              <p className="text-base text-text-muted">
                {t.home.contentUnavailable}
              </p>
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
              <p className="text-base sm:text-xl md:text-2xl text-text-muted max-w-3xl mx-auto font-normal leading-relaxed">
                {heroSubtitle}
              </p>

              <div className="flex justify-center pt-4">
                <PrimaryButton
                  onClick={() => navigate(heroCtaPath)}
                  appearance="primary"
                  className="w-full sm:w-auto !py-3.5 !px-8 !text-sm font-bold"
                  endIcon={<ArrowIcon className="w-4 h-4" />}
                >
                  {heroCtaText}
                </PrimaryButton>
              </div>
            </>
          )}
        </div>
      </section>

      {/* ================= API CATEGORIES SECTION ================= */}
      <section className="py-28 px-4 sm:px-6 bg-bg-secondary/40 border-b border-primary/10">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-wider">
              {t.home.categoriesTitle}
            </h2>
            <p className="text-base sm:text-lg text-text-muted font-medium">
              {t.courses.subtitle}
            </p>
          </div>

          {homeLoading && (
            <p className="text-center text-text-muted" role="status">
              {t.home.contentLoading}
            </p>
          )}

          {homeContent?.featuredCategories.length === 0 && (
            <p className="text-center text-text-muted">
              {t.home.noCategories}
            </p>
          )}

          {homeContent?.featuredCategories.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {homeContent.featuredCategories.map((category) => (
                <Link
                  key={category.id}
                  to={`/courses?categoryId=${encodeURIComponent(category.id)}`}
                  className="group bg-bg-surface border border-primary/10 rounded-3xl p-8 flex flex-col gap-5 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 hover:-translate-y-1.5"
                >
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    <FiLayers className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-black uppercase tracking-wide group-hover:text-primary transition-colors">
                    {category.name}
                  </h3>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ================= FEATURED COURSES SECTION ================= */}
      <section className="py-28 px-4 sm:px-6">
        <div className="container mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-widest text-primary">
                {t.home.featuredCoursesEyebrow}
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-wider">
                {t.home.featuredCourses}
              </h2>
              <p className="text-sm sm:text-base text-text-muted max-w-xl">
                {t.home.featuredCoursesSub}
              </p>
            </div>
            <Link
              to="/courses"
              className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline underline-offset-4"
            >
              <span>{t.courses.title}</span>
              <ArrowIcon className="w-4 h-4" />
            </Link>
          </div>

          {homeLoading ? (
            <p className="py-12 text-center text-text-muted" role="status">
              {t.home.contentLoading}
            </p>
          ) : homeError ? (
            <div className="py-12 text-center space-y-3" role="alert">
              <p>{t.home.contentUnavailable}</p>
              <button
                type="button"
                onClick={retryHomeContent}
                className="text-sm font-bold text-primary hover:underline"
              >
                {t.courses.retry}
              </button>
            </div>
          ) : homeContent.featuredCourses.length === 0 ? (
            <p className="py-12 text-center text-text-muted">
              {t.courses.noCourses}
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {homeContent.featuredCourses.slice(0, 3).map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          )}
        </div>
      </section>

      {statistics && (
        <section className="py-16 px-4 sm:px-6 border-y border-primary/10">
          <div className="container mx-auto max-w-7xl space-y-8">
            <h2 className="text-center text-2xl sm:text-3xl font-black uppercase tracking-wide">
              {t.home.statisticsTitle}
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                [t.home.totalStudents, statistics.totalStudents],
                [t.home.totalCourses, statistics.totalCourses],
                [t.home.totalEnrollments, statistics.totalEnrollments],
                [t.home.totalInstructors, statistics.totalInstructors],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-2xl border border-primary/10 bg-bg-surface p-6 text-center"
                >
                  <p className="text-2xl sm:text-3xl font-black text-primary">
                    {new Intl.NumberFormat(
                      currentLang === "ar" ? "ar" : "en",
                    ).format(Number(value))}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-text-muted">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-12 bg-bg-secondary/30 border-y border-primary/10">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6">
          <div
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5 text-sm text-amber-700"
            role="status"
          >
            <span>{t.home.scenesUnavailable}</span>
            <Link
              to="/3d-scenes"
              className="font-bold underline underline-offset-4"
            >
              {t.scenes.title}
            </Link>
          </div>
        </div>
      </section>

      {/* ================= PROJECT REQUESTS STATUS ================= */}
      <section className="py-24 px-4 sm:px-6">
        <div className="container mx-auto max-w-5xl">
          <div className="relative rounded-3xl overflow-hidden bg-linear-to-r from-primary/20 via-purple-900/30 to-pink-900/20 border border-primary/30 p-8 sm:p-14 text-center space-y-6 shadow-2xl">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-text-main">
              {t.projectRequests.title}
            </h2>
            <p className="text-base sm:text-lg text-text-muted max-w-2xl mx-auto leading-relaxed">
              {t.home.projectRequestsUnavailable}
            </p>
          </div>
        </div>
      </section>

      {/* ================= NEWSLETTER SECTION ================= */}
      <section className="py-20 px-4 sm:px-6 bg-bg-secondary/40 border-t border-primary/10">
        <div className="container mx-auto max-w-3xl text-center space-y-6">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mx-auto">
            <FiMail className="w-7 h-7" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-wide">
            {t.home.newsletterTitle}
          </h2>
          <p className="text-sm sm:text-base text-text-muted max-w-xl mx-auto">
            {t.home.newsletterDesc}
          </p>

          <form
            onSubmit={handleSubscribe}
            className="flex flex-col sm:flex-row items-center gap-3 max-w-md mx-auto pt-2"
          >
            <label htmlFor="newsletter-email" className="sr-only">
              {t.home.newsletterEmailLabel}
            </label>
            <input
              id="newsletter-email"
              type="email"
              required
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
              placeholder={t.home.newsletterEmailPlaceholder}
              className="w-full h-12 px-4 rounded-xl bg-bg-surface border border-primary/15 text-sm text-text-main focus:border-primary/50 focus:outline-none"
            />
            <PrimaryButton
              type="submit"
              loading={newsletterLoading}
              appearance="primary"
              className="w-full sm:w-auto !h-12 !px-6 font-bold whitespace-nowrap"
            >
              {t.home.subscribe}
            </PrimaryButton>
          </form>
        </div>
      </section>
    </div>
  );
}
