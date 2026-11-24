import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { FiLayers, FiRotateCcw, FiSearch } from "react-icons/fi";
import useTranslation from "../../hooks/useTranslation";
import CourseCard from "../../components/courses/CourseCard";
import {
  getCategories,
  getCourses,
  getSoftwareTags,
} from "../../api/courses/courses.api";

const PAGE_SIZE = 12;

export default function CoursesList() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get("categoryId");
  const selectedCategory = categoryParam || "all";

  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [softwareTags, setSoftwareTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [courseError, setCourseError] = useState(false);
  const [metadataError, setMetadataError] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [retryKey, setRetryKey] = useState(0);

  const [search, setSearch] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const beginCourseReload = () => {
    setLoading(true);
    setCourseError(false);
  };

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    Promise.allSettled([
      getCategories({ signal: controller.signal }),
      getSoftwareTags({ signal: controller.signal }),
    ]).then(([categoriesResult, tagsResult]) => {
      if (!active) return;

      const categoriesLoaded =
        categoriesResult.status === "fulfilled" &&
        Array.isArray(categoriesResult.value);
      const tagsLoaded =
        tagsResult.status === "fulfilled" && Array.isArray(tagsResult.value);

      setCategories(categoriesLoaded ? categoriesResult.value : []);
      setSoftwareTags(tagsLoaded ? tagsResult.value : []);
      setMetadataError(!categoriesLoaded || !tagsLoaded);
    });

    return () => {
      active = false;
      controller.abort();
    };
  }, [retryKey]);

  useEffect(() => {
    const controller = new AbortController();
    let timer;

    timer = setTimeout(async () => {
      try {
        const response = await getCourses(
          {
            Search: search.trim() || undefined,
            CategoryId:
              selectedCategory === "all" ? undefined : selectedCategory,
            Level: selectedLevel === "all" ? undefined : selectedLevel,
            SortBy: sortBy,
            Page: page,
            PageSize: PAGE_SIZE,
          },
          { signal: controller.signal },
        );

        if (
          !response ||
          !Array.isArray(response.items) ||
          response.items.some(
            (course) =>
              course?.id == null ||
              typeof course.title !== "string" ||
              !Number.isFinite(Number(course.price)),
          ) ||
          !Number.isFinite(Number(response.totalCount))
        ) {
          throw new Error("The course response did not match the API contract.");
        }

        setCourses(response.items);
        setTotalCount(Number(response.totalCount));
      } catch {
        if (controller.signal.aborted) return;
        setCourses([]);
        setTotalCount(0);
        setCourseError(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [
    page,
    retryKey,
    search,
    selectedCategory,
    selectedLevel,
    sortBy,
  ]);

  const filteredCourses = courses;

  const hasActiveFilters =
    search.trim() !== "" ||
    selectedCategory !== "all" ||
    selectedLevel !== "all" ||
    sortBy !== "newest";

  const resetFilters = () => {
    beginCourseReload();
    setSearch("");
    setSearchParams({}, { replace: true });
    setSelectedLevel("all");
    setSortBy("newest");
    setPage(1);
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div className="py-16 md:py-24 bg-bg-main text-text-main min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 max-w-7xl space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="text-xs font-bold uppercase tracking-widest text-primary">
            {t.courses.eyebrow}
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight">
            {t.courses.title}
          </h1>
          <p className="text-base sm:text-lg text-text-muted">
            {t.courses.subtitle}
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-bg-surface border border-primary/10 shadow-xl space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            <div className="relative sm:col-span-2 lg:col-span-2">
              <FiSearch className="absolute top-1/2 -translate-y-1/2 start-4 text-text-muted w-4 h-4" />
              <label htmlFor="courses-search" className="sr-only">
                {t.courses.searchLabel}
              </label>
              <input
                id="courses-search"
                type="text"
                value={search}
                onChange={(event) => {
                  beginCourseReload();
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder={t.courses.searchPlaceholder}
                className="w-full h-11 ps-11 pe-4 rounded-xl bg-bg-secondary border border-primary/15 text-xs text-text-main focus:border-primary/50 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="courses-category-filter" className="sr-only">
                {t.courses.categoryFilter}
              </label>
              <select
                id="courses-category-filter"
                value={selectedCategory}
                onChange={(event) => {
                  beginCourseReload();
                  const categoryId = event.target.value;
                  const nextParams = new URLSearchParams(searchParams);
                  if (categoryId === "all") {
                    nextParams.delete("categoryId");
                  } else {
                    nextParams.set("categoryId", categoryId);
                  }
                  setSearchParams(nextParams, { replace: true });
                  setPage(1);
                }}
                className="w-full h-11 px-3.5 rounded-xl bg-bg-secondary border border-primary/15 text-xs text-text-main focus:border-primary/50 focus:outline-none cursor-pointer"
              >
                <option value="all">{t.courses.allCategories}</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="courses-software-filter" className="sr-only">
                {t.courses.softwareFilterLabel}
              </label>
              <select
                id="courses-software-filter"
                value="all"
                disabled
                aria-describedby="software-filter-unavailable"
                className="w-full h-11 px-3.5 rounded-xl bg-bg-secondary border border-primary/15 text-xs text-text-main opacity-60 cursor-not-allowed"
              >
                <option value="all">{t.courses.allSoftware}</option>
                {softwareTags.map((tag) => (
                  <option key={tag.id} value={tag.name}>
                    {tag.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="courses-level-filter" className="sr-only">
                {t.courses.levelFilter}
              </label>
              <select
                id="courses-level-filter"
                value={selectedLevel}
                onChange={(event) => {
                  beginCourseReload();
                  setSelectedLevel(event.target.value);
                  setPage(1);
                }}
                className="w-full h-11 px-3.5 rounded-xl bg-bg-secondary border border-primary/15 text-xs text-text-main focus:border-primary/50 focus:outline-none cursor-pointer"
              >
                <option value="all">{t.courses.allLevels}</option>
                <option value="Beginner">{t.courses.beginner}</option>
                <option value="Intermediate">{t.courses.intermediate}</option>
                <option value="Advanced">{t.courses.advanced}</option>
              </select>
            </div>
          </div>

          <p id="software-filter-unavailable" className="text-xs text-text-muted">
            {t.courses.softwareFilterUnavailable}
          </p>

          {metadataError && (
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-amber-600">
              <span>{t.courses.filtersUnavailable}</span>
              <button
                type="button"
                onClick={() => {
                  beginCourseReload();
                  setRetryKey((value) => value + 1);
                }}
                className="font-bold underline"
              >
                {t.courses.retry}
              </button>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-primary/10 text-xs text-text-muted">
            <span className="font-bold text-text-main">
              {totalCount} {t.courses.coursesFound}
            </span>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <label htmlFor="courses-sort">{t.courses.sortBy}</label>
                <select
                  id="courses-sort"
                  value={sortBy}
                  onChange={(event) => {
                    beginCourseReload();
                    setSortBy(event.target.value);
                    setPage(1);
                  }}
                  className="h-8 px-2.5 rounded-lg bg-bg-secondary border border-primary/15 text-xs font-semibold text-text-main focus:outline-none cursor-pointer"
                >
                  <option value="newest">{t.courses.newest}</option>
                  <option value="rating">{t.courses.highestRated}</option>
                  <option value="price">{t.courses.priceLowToHigh}</option>
                </select>
              </div>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold transition-colors"
                >
                  <FiRotateCcw className="w-3.5 h-3.5" />
                  <span>{t.courses.resetFilters}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center text-text-muted" role="status">
            {t.courses.loadingCourses}
          </div>
        ) : courseError ? (
          <div className="py-20 text-center space-y-4" role="alert">
            <h3 className="text-xl font-bold">{t.courses.courseLoadError}</h3>
            <button
              type="button"
              onClick={() => {
                beginCourseReload();
                setRetryKey((value) => value + 1);
              }}
              className="text-sm font-bold text-primary hover:underline"
            >
              {t.courses.retry}
            </button>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="py-20 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <FiLayers className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold">{t.courses.noCourses}</h3>
            <p className="text-sm text-text-muted max-w-md mx-auto">
              {t.courses.noCoursesDescription}
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="text-xs font-bold text-primary hover:underline"
              >
                {t.courses.resetFilters}
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredCourses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4">
                <button
                  type="button"
                  disabled={page <= 1 || loading}
                  onClick={() => {
                    beginCourseReload();
                    setPage((value) => Math.max(1, value - 1));
                  }}
                  className="rounded-xl border border-primary/15 px-4 py-2 text-sm disabled:opacity-40"
                >
                  {t.courses.previousPage}
                </button>
                <span className="text-sm text-text-muted">
                  {t.courses.page} {page} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages || loading}
                  onClick={() => {
                    beginCourseReload();
                    setPage((value) => Math.min(totalPages, value + 1));
                  }}
                  className="rounded-xl border border-primary/15 px-4 py-2 text-sm disabled:opacity-40"
                >
                  {t.courses.nextPage}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
