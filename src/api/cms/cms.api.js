import api from "../axios";

export const getHomeCms = (config = {}) =>
  api.get("/api/cms/home", { ...config, skipAuth: true });

export const subscribeNewsletter = (email) =>
  api.post("/api/cms/newsletter/subscribe", { email }, { skipAuth: true });

