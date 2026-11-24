import api from "../axios";

export const getAdminStatistics = (config = {}) =>
  api.get("/api/admin/statistics", config);

export const getPendingAdminOrders = (config = {}) =>
  api.get("/api/admin/orders/pending-verification", config);

export const approveAdminOrder = (orderId) =>
  api.post(`/api/admin/orders/${encodeURIComponent(orderId)}/approve-payment`);

export const rejectAdminOrder = (orderId, reason) =>
  api.post(`/api/admin/orders/${encodeURIComponent(orderId)}/reject-payment`, {
    reason,
  });

export const getPendingAdminCourses = (config = {}) =>
  api.get("/api/admin/courses/pending", config);

export const updateAdminCourseApproval = (courseId, data) =>
  api.put(
    `/api/admin/courses/${encodeURIComponent(courseId)}/approve`,
    data,
  );

export const getAdminUsers = (
  { search = "", role = "", page = 1, pageSize = 10 },
  config = {},
) => {
  const query = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });
  if (search.trim()) query.set("search", search.trim());
  if (role.trim()) query.set("role", role.trim());

  return api.get(`/api/admin/users?${query}`, config);
};

export const updateAdminUserRoles = (userId, roles) =>
  api.put(`/api/admin/users/${encodeURIComponent(userId)}/roles`, { roles });

export const updateAdminUserLock = (userId, lock) =>
  api.put(`/api/admin/users/${encodeURIComponent(userId)}/lock`, { lock });
