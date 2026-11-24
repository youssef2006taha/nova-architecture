import api from "../axios";

export const getInstructorDashboard = (config = {}) =>
  api.get("/api/instructor/courses/dashboard", config);

export const createInstructorCourse = (data) =>
  api.post("/api/instructor/courses", data);

export const uploadCourseImage = (formData) =>
  api.post("/api/uploads/image", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

