import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  FiStar,
  FiClock,
  FiUsers,
  FiCheckCircle,
  FiPlay,
  FiShoppingBag,
  FiArrowLeft,
  FiArrowRight,
  FiShield,
  FiAward,
} from "react-icons/fi";
import useTranslation from "../../hooks/useTranslation";
import PrimaryButton from "../../components/ui/PrimaryButton";
import {
  getCourseBySlug,
  getCourseReviews,
  getInstructorById,
  getLessonPreview,
} from "../../api/courses/courses.api";
import {
  addCourseToCart,
  toggleCart,
} from "../../features/cart/cartSlice";
import { showToast } from "../../features/ui/toast/toastSlice";

export default function CourseDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t, dir, currentLang } = useTranslation();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { mutationLoading } = useSelector((state) => state.cart);

  const [courseResult, setCourseResult] = useState({
    key: null,
    course: null,
    error: null,
  });
  const [retryKey, setRetryKey] = useState(0);
  const courseRequestKey = `${slug}:${retryKey}`;
  const course = courseResult.key === courseRequestKey
    ? courseResult.course
    : null;
  const loadError = courseResult.key === courseRequestKey
    ? courseResult.error
    : null;
  const loading = courseResult.key !== courseRequestKey;

  const [instructorResult, setInstructorResult] = useState({
    key: null,
    instructor: null,
    error: false,
  });
  const [instructorRetryKey, setInstructorRetryKey] = useState(0);
  const instructorRequestKey = course?.instructorId
    ? `${course.instructorId}:${instructorRetryKey}`
    : null;
  const instructor =
    instructorResult.key === instructorRequestKey
      ? instructorResult.instructor
      : null;
  const instructorLoading = Boolean(
    instructorRequestKey && instructorResult.key !== instructorRequestKey,
  );
  const instructorError =
    instructorResult.key === instructorRequestKey &&
    instructorResult.error;

  const [reviewPaging, setReviewPaging] = useState({
    courseId: null,
    page: 1,
  });
  const reviewsPage =
    reviewPaging.courseId === course?.id ? reviewPaging.page : 1;
  const [reviewsRetryKey, setReviewsRetryKey] = useState(0);
  const reviewsRequestKey = course?.id
    ? `${course.id}:${reviewsPage}:${reviewsRetryKey}`
    : null;
  const [reviewsResult, setReviewsResult] = useState({
    key: null,
    items: [],
    totalCount: 0,
    error: false,
  });
  const reviews =
    reviewsResult.key === reviewsRequestKey ? reviewsResult.items : [];
  const reviewsTotalCount =
    reviewsResult.key === reviewsRequestKey ? reviewsResult.totalCount : 0;
  const reviewsLoading = Boolean(
    reviewsRequestKey && reviewsResult.key !== reviewsRequestKey,
  );
  const reviewsError =
    reviewsResult.key === reviewsRequestKey && reviewsResult.error;

  const [previewSelection, setPreviewSelection] = useState({
    courseKey: null,
    lessonId: null,
  });
  const [previewRetryKey, setPreviewRetryKey] = useState(0);
  const previewLessonId =
    previewSelection.courseKey === courseRequestKey
      ? previewSelection.lessonId
      : null;
  const previewRequestKey =
    course?.slug && previewLessonId
      ? `${course.slug}:${previewLessonId}:${previewRetryKey}`
      : null;
  const [previewResult, setPreviewResult] = useState({
    key: null,
    preview: null,
    error: false,
  });
  const preview =
    previewResult.key === previewRequestKey ? previewResult.preview : null;
  const previewLoading = Boolean(
    previewRequestKey && previewResult.key !== previewRequestKey,
  );
  const previewError =
    previewResult.key === previewRequestKey && previewResult.error;

  useEffect(() => {
    const controller = new AbortController();

    getCourseBySlug(slug, { signal: controller.signal })
      .then((response) => {
        if (!response || !response.id) {
          setCourseResult({
            key: courseRequestKey,
            course: null,
            error: "notFound",
          });
          return;
        }
        setCourseResult({
          key: courseRequestKey,
          course: response,
          error: null,
        });
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        setCourseResult({
          key: courseRequestKey,
          course: null,
          error: error?.response?.status === 404 ? "notFound" : "request",
        });
      });

    return () => controller.abort();
  }, [courseRequestKey, slug]);

  useEffect(() => {
    if (!instructorRequestKey || !course) return undefined;

    const controller = new AbortController();
    getInstructorById(course.instructorId, { signal: controller.signal })
      .then((response) =>
        setInstructorResult({
          key: instructorRequestKey,
          instructor: response || null,
          error: false,
        }),
      )
      .catch(() => {
        if (!controller.signal.aborted) {
          setInstructorResult({
            key: instructorRequestKey,
            instructor: null,
            error: true,
          });
        }
      });

    return () => controller.abort();
  }, [course, instructorRequestKey]);

  useEffect(() => {
    if (!reviewsRequestKey || !course) return undefined;
    const controller = new AbortController();
    getCourseReviews(
      course.id,
      { page: reviewsPage, pageSize: 5 },
      { signal: controller.signal },
    )
      .then((response) => {
        if (
          !response ||
          !Array.isArray(response.items) ||
          !Number.isFinite(Number(response.totalCount))
        ) {
          throw new Error("The review response did not match the API contract.");
        }
        setReviewsResult({
          key: reviewsRequestKey,
          items: response.items,
          totalCount: Number(response.totalCount),
          error: false,
        });
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setReviewsResult({
          key: reviewsRequestKey,
          items: [],
          totalCount: 0,
          error: true,
        });
      });
    return () => controller.abort();
  }, [course, reviewsRequestKey, reviewsPage]);

  useEffect(() => {
    if (!previewRequestKey || !course) return undefined;
    const controller = new AbortController();
    getLessonPreview(course.slug, previewLessonId, {
      signal: controller.signal,
    })
      .then((response) => {
        if (typeof response?.videoUrl !== "string" || !response.videoUrl) {
          throw new Error("The preview response did not include a video URL.");
        }
        setPreviewResult({
          key: previewRequestKey,
          preview: response,
          error: false,
        });
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setPreviewResult({
            key: previewRequestKey,
            preview: null,
            error: true,
          });
        }
      });
    return () => controller.abort();
  }, [course, previewLessonId, previewRequestKey]);

  if (loading) {
    return (
      <div className="min-h-screen py-24 flex items-center justify-center text-text-muted" role="status">
        <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!course || loadError) {
    return (
      <div
        className="min-h-screen py-24 flex flex-col items-center justify-center gap-4 text-center text-text-main"
        role={loadError ? "alert" : undefined}
      >
        <p>{loadError === "notFound" ? t.courses.courseNotFound : t.courses.courseLoadError}</p>
        {loadError !== "notFound" && (
          <button
            type="button"
            onClick={() => setRetryKey((value) => value + 1)}
            className="text-sm font-bold text-primary hover:underline"
          >
            {t.courses.retry}
          </button>
        )}
        <button
          type="button"
          onClick={() => navigate("/courses")}
          className="text-sm font-bold text-primary hover:underline"
        >
          {t.nav.courses}
        </button>
      </div>
    );
  }

  const checkAuth = () => {
    if (!isAuthenticated) {
      dispatch(
        showToast({
          message:
            currentLang === "ar"
              ? "يرجى تسجيل الدخول أولاً لتتمكن من اختيار وشراء الكورس."
              : "Please sign in first to purchase or select this course.",
          severity: "error",
        })
      );
      navigate("/login", { state: { from: `/courses/${course.slug || course.id}` } });
      return false;
    }
    return true;
  };

  const handleAddToCart = async () => {
    if (!checkAuth()) return;
    try {
      await dispatch(addCourseToCart(course.id)).unwrap();
      dispatch(
        showToast({
          message: `${course.title} ${t.courses.addedToCart}`,
          severity: "success",
        })
      );
      dispatch(toggleCart());
    } catch (error) {
      dispatch(
        showToast({
          message: typeof error === "string" ? error : t.cart.requestError,
          severity: "error",
        }),
      );
    }
  };

  const handleBuyNow = async () => {
    if (!checkAuth()) return;
    try {
      await dispatch(addCourseToCart(course.id)).unwrap();
      navigate("/checkout");
    } catch (error) {
      dispatch(
        showToast({
          message: typeof error === "string" ? error : t.cart.requestError,
          severity: "error",
        }),
      );
    }
  };

  const ArrowIcon = dir === "rtl" ? FiArrowRight : FiArrowLeft;
  const hours =
    course.totalDurationMinutes == null
      ? null
      : Math.round(course.totalDurationMinutes / 60);
  const reviewPages = Math.ceil(reviewsTotalCount / 5);

  return (
    <div className="py-12 md:py-20 bg-bg-main text-text-main min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 max-w-7xl space-y-12">
        {/* Back Link */}
        <div>
          <button
            onClick={() => navigate("/courses")}
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-text-muted hover:text-primary transition-colors"
          >
            <ArrowIcon className="w-4 h-4" />
            <span>{t.nav.courses}</span>
          </button>
        </div>

        {/* Hero Banner Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left Details Column */}
          <div className="lg:col-span-8 space-y-8">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                {course.categoryName && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                    {course.categoryName}
                  </span>
                )}
                {course.level && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-bg-surface border border-primary/15 text-text-muted">
                    {course.level}
                  </span>
                )}
                {course.averageRating != null && (
                  <div className="flex items-center gap-1.5 text-amber-500 font-bold text-sm">
                    <FiStar className="w-4 h-4 fill-amber-500" />
                    <span>{course.averageRating}</span>
                    {course.totalReviews != null && (
                      <span className="text-text-muted text-xs">
                        ({course.totalReviews} {t.courses.reviews})
                      </span>
                    )}
                  </div>
                )}
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight leading-tight">
                {course.title}
              </h1>

              {(course.subtitle || course.description) && (
                <p className="text-base sm:text-lg text-text-muted leading-relaxed">
                  {course.subtitle || course.description}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-6 pt-2 text-xs sm:text-sm text-text-muted">
                {course.enrolledStudentsCount != null && (
                  <div className="flex items-center gap-2">
                    <FiUsers className="w-4 h-4 text-primary" />
                    <span>{course.enrolledStudentsCount} {t.courses.students}</span>
                  </div>
                )}
                {hours != null && (
                  <div className="flex items-center gap-2">
                    <FiClock className="w-4 h-4 text-primary" />
                    <span>{hours} {t.courses.hours}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Video Player / Preview */}
            <div className="relative rounded-3xl overflow-hidden aspect-16/9 bg-black border border-primary/20 shadow-2xl">
              {previewLoading ? (
                <p className="h-full flex items-center justify-center text-white" role="status">
                  {t.courses.loadingPreview}
                </p>
              ) : previewError ? (
                <div className="h-full flex flex-col items-center justify-center gap-3 p-4 text-center text-white" role="alert">
                  <p>{t.courses.previewError}</p>
                  <button
                    type="button"
                    onClick={() => setPreviewRetryKey((value) => value + 1)}
                    className="font-bold underline"
                  >
                    {t.courses.retry}
                  </button>
                </div>
              ) : preview ? (
                <video
                  key={preview.videoUrl}
                  src={preview.videoUrl}
                  controls
                  poster={course.thumbnailUrl}
                  className="w-full h-full object-cover"
                />
              ) : (
                <p className="h-full flex items-center justify-center p-4 text-center text-white">
                  {t.courses.selectPreviewLesson}
                </p>
              )}
            </div>

            {/* What you'll learn */}
            {course.learningPoints && course.learningPoints.length > 0 && (
              <div className="p-8 rounded-3xl bg-bg-surface border border-primary/10 space-y-6">
                <h3 className="text-xl font-bold uppercase tracking-wider">
                  {t.courses.whatYouLearn}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {course.learningPoints.map((point, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <FiCheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm text-text-muted leading-relaxed">
                        {point}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(course.instructorName || instructor || instructorLoading || instructorError) && (
              <section className="p-8 rounded-3xl bg-bg-surface border border-primary/10 space-y-3">
                <h3 className="text-xl font-bold uppercase tracking-wider">
                  {t.courses.instructor}
                </h3>
                {instructorLoading ? (
                  <p role="status" className="text-sm text-text-muted">
                    {t.courses.loadingInstructor}
                  </p>
                ) : instructorError ? (
                  <div role="alert" className="text-sm text-text-muted">
                    <p>{t.courses.instructorUnavailable}</p>
                    <button
                      type="button"
                      onClick={() => setInstructorRetryKey((value) => value + 1)}
                      className="mt-2 font-bold text-primary underline"
                    >
                      {t.courses.retry}
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-4">
                      {instructor?.avatarUrl && (
                        <img
                          src={instructor.avatarUrl}
                          alt=""
                          className="w-14 h-14 rounded-full object-cover"
                        />
                      )}
                      <p className="font-bold">
                        {instructor?.fullName || course.instructorName}
                      </p>
                    </div>
                    {(instructor?.bio || course.instructorBio) && (
                      <p className="text-sm text-text-muted leading-relaxed">
                        {instructor?.bio || course.instructorBio}
                      </p>
                    )}
                  </>
                )}
              </section>
            )}

            {/* Curriculum Sections */}
            {course.sections && course.sections.length > 0 && (
              <div className="space-y-6">
                <h3 className="text-2xl font-bold uppercase tracking-wider">
                  {t.courses.curriculum}
                </h3>
                <div className="space-y-4">
                  {course.sections.map((sec) => (
                    <div
                      key={sec.id}
                      className="rounded-2xl bg-bg-surface border border-primary/10 overflow-hidden"
                    >
                      <div className="px-6 py-4 bg-bg-secondary/50 font-bold text-sm">
                        {sec.title}
                      </div>
                      <div className="divide-y divide-primary/5">
                        {sec.lessons?.map((les) => (
                          <div
                            key={les.id}
                            className="px-6 py-3.5 flex items-center justify-between text-xs sm:text-sm hover:bg-primary/5 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <FiPlay className="w-3.5 h-3.5 text-primary" />
                              <span className="font-medium">{les.title}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              {les.isPreview && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setPreviewSelection({
                                      courseKey: courseRequestKey,
                                      lessonId: les.id,
                                    })
                                  }
                                  className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary"
                                >
                                  {t.courses.previewLesson}
                                </button>
                              )}
                              <span className="text-text-muted text-xs">
                                {les.durationMinutes}m
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <section className="space-y-5">
              <h3 className="text-2xl font-bold uppercase tracking-wider">
                {t.courses.reviews}
              </h3>
              {reviewsLoading ? (
                <p className="text-sm text-text-muted" role="status">
                  {t.courses.loadingReviews}
                </p>
              ) : reviewsError ? (
                <div className="text-sm text-text-muted" role="alert">
                  <p>{t.courses.reviewsUnavailable}</p>
                  <button
                    type="button"
                    onClick={() => setReviewsRetryKey((value) => value + 1)}
                    className="mt-2 font-bold text-primary underline"
                  >
                    {t.courses.retry}
                  </button>
                </div>
              ) : reviews.length === 0 ? (
                <p className="text-sm text-text-muted">{t.courses.noReviews}</p>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <article
                      key={review.id}
                      className="p-6 rounded-2xl bg-bg-surface border border-primary/10 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <h4 className="font-bold">{review.studentName}</h4>
                        <span className="text-amber-500 font-bold">
                          {review.rating} / 5
                        </span>
                      </div>
                      <p className="text-sm text-text-muted">{review.comment}</p>
                      {review.createdAt && (
                        <time className="block text-xs text-text-muted">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </time>
                      )}
                    </article>
                  ))}
                </div>
              )}
              {reviewPages > 1 && !reviewsError && (
                <div className="flex items-center justify-center gap-4">
                  <button
                    type="button"
                    disabled={reviewsPage <= 1 || reviewsLoading}
                    onClick={() =>
                      setReviewPaging({
                        courseId: course.id,
                        page: Math.max(1, reviewsPage - 1),
                      })
                    }
                    className="rounded-xl border border-primary/15 px-4 py-2 text-sm disabled:opacity-40"
                  >
                    {t.courses.previousPage}
                  </button>
                  <span className="text-sm text-text-muted">
                    {t.courses.page} {reviewsPage} / {reviewPages}
                  </span>
                  <button
                    type="button"
                    disabled={reviewsPage >= reviewPages || reviewsLoading}
                    onClick={() =>
                      setReviewPaging({
                        courseId: course.id,
                        page: Math.min(reviewPages, reviewsPage + 1),
                      })
                    }
                    className="rounded-xl border border-primary/15 px-4 py-2 text-sm disabled:opacity-40"
                  >
                    {t.courses.nextPage}
                  </button>
                </div>
              )}
            </section>
          </div>

          {/* Right Sticky Purchase Sidebar */}
          <div className="lg:col-span-4 sticky top-28 space-y-6">
            <div className="p-8 rounded-3xl bg-bg-surface border border-primary/20 shadow-xl space-y-6">
              <div>
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-black text-text-main">
                    ${Number(course.discountPrice ?? course.price).toFixed(2)}
                  </span>
                  {course.discountPrice != null && (
                    <span className="text-base text-text-muted line-through">
                      ${Number(course.price).toFixed(2)}
                    </span>
                  )}
                </div>
                {course.discountPrice != null && (
                  <p className="text-xs text-green-500 font-bold mt-1">
                    {t.courses.savings}: $
                    {(Number(course.price) - Number(course.discountPrice)).toFixed(2)}
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <PrimaryButton
                  onClick={handleAddToCart}
                  appearance="primary"
                  fullWidth
                  disabled={mutationLoading}
                  className="!py-3.5 !text-sm font-bold"
                  endIcon={<FiShoppingBag className="w-4 h-4" />}
                >
                  {t.courses.addToCart}
                </PrimaryButton>

                <button
                  onClick={handleBuyNow}
                  disabled={mutationLoading}
                  className="w-full py-3.5 rounded-xl font-bold text-sm border border-primary/20 hover:border-primary/50 bg-bg-secondary text-text-main transition-colors"
                >
                  {t.courses.buyNow}
                </button>
              </div>

              <div className="pt-6 border-t border-primary/10 space-y-3 text-xs text-text-muted">
                <div className="flex items-center gap-3">
                  <FiCheckCircle className="w-4 h-4 text-primary" />
                  <span>{t.courses.fullLifetimeAccess}</span>
                </div>
                <div className="flex items-center gap-3">
                  <FiAward className="w-4 h-4 text-primary" />
                  <span>{t.courses.certificateOfCompletion}</span>
                </div>
                <div className="flex items-center gap-3">
                  <FiShield className="w-4 h-4 text-primary" />
                  <span>{t.courses.moneyBack}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
