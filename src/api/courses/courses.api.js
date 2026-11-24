import api from "../axios";

export const getCategories = (config = {}) =>
  api.get("/api/categories", { ...config, skipAuth: true });

export const getSoftwareTags = (config = {}) =>
  api.get("/api/software-tags", { ...config, skipAuth: true });

export const getCourses = (params = {}, config = {}) => {
  const query = new URLSearchParams();
  if (params.Search) query.append("Search", params.Search);
  if (params.CategoryId) query.append("CategoryId", params.CategoryId);
  if (params.Level) query.append("Level", params.Level);
  if (params.MinPrice != null) query.append("MinPrice", params.MinPrice);
  if (params.MaxPrice != null) query.append("MaxPrice", params.MaxPrice);
  if (params.SortBy) query.append("SortBy", params.SortBy);
  if (params.Page) query.append("Page", params.Page);
  if (params.PageSize) query.append("PageSize", params.PageSize);

  const qs = query.toString();
  return api.get(`/api/courses${qs ? `?${qs}` : ""}`, {
    ...config,
    skipAuth: true,
  });
};

export const getCourseBySlug = (slug, config = {}) =>
  api.get(`/api/courses/${encodeURIComponent(slug)}`, {
    ...config,
    skipAuth: true,
  });

export const getCourseReviews = (courseId, params = {}, config = {}) => {
  const query = new URLSearchParams(params).toString();
  return api.get(`/api/courses/${courseId}/reviews${query ? `?${query}` : ""}`, {
    ...config,
    skipAuth: true,
  });
};

export const getLessonPreview = (slug, lessonId, config = {}) =>
  api.get(
    `/api/courses/${encodeURIComponent(slug)}/preview/${encodeURIComponent(lessonId)}`,
    { ...config, skipAuth: true },
  );

export const getInstructors = (config = {}) =>
  api.get("/api/instructors", { ...config, skipAuth: true });

export const getInstructorById = (id, config = {}) =>
  api.get(`/api/instructors/${encodeURIComponent(id)}`, {
    ...config,
    skipAuth: true,
  });

export const addCourseReview = (courseId, reviewData) =>
  api.post(`/api/courses/${courseId}/reviews`, reviewData);

