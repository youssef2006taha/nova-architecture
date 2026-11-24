import api from "../axios"

const publicRequest = { skipAuth: true };

export const login = (payload) =>
  api.post("/api/Auth/login", payload, publicRequest);
export const register = (payload) =>
  api.post("/api/Auth/register", payload, publicRequest);
export const forgotPassword = (payload) =>
  api.post("/api/Auth/forgot-password", payload, publicRequest);
export const resetPassword = (payload) =>
  api.post("/api/Auth/reset-password", payload, publicRequest);
export const refreshToken = (payload) =>
  api.post("/api/Auth/refresh", payload, publicRequest);
export const revokeToken = (payload) =>
  api.post("/api/Auth/revoke", payload, publicRequest);

export const getMe = (config) => api.get("/api/Auth/me", config);