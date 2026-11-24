import api from "../axios";

export const getEnrollments = () => api.get("/api/enrollments");

export const checkEnrollment = (courseId) =>
  api.get(`/api/enrollments/${courseId}/check`);

export const getStudentDashboard = (config = {}) =>
  api.get("/api/enrollments/dashboard", config);

export const getCourseProgress = (courseId) =>
  api.get(`/api/progress/${courseId}`);

export const recordProgress = (data) =>
  api.post("/api/progress", data);

export const getLessonPlayUrl = (courseId, lessonId) =>
  api.get(`/api/progress/${courseId}/lessons/${lessonId}/play`);

export const getCertificatePdf = (verificationCode, config = {}) =>
  api.get(
    `/api/certificates/${encodeURIComponent(verificationCode)}/pdf`,
    { ...config, skipAuth: true, responseType: "blob" },
  );

