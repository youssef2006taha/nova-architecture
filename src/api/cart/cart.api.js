import api from "../axios";

export const getCart = () => api.get("/api/cart");

export const addToCartApi = (courseId) =>
  api.post("/api/cart/items", { courseId });

export const removeFromCartApi = (courseId) =>
  api.delete(`/api/cart/items/${courseId}`);

export const applyCouponApi = (couponCode) =>
  api.post("/api/cart/coupon", { couponCode });

export const removeCouponApi = () => api.delete("/api/cart/coupon");

export const checkoutOrderApi = () => api.post("/api/orders/checkout");

export const getOrders = (config = {}) => api.get("/api/orders", config);

export const getOrderById = (id) => api.get(`/api/orders/${id}`);

export const getInstaPayInstructions = () =>
  api.get("/api/orders/instapay-instructions", { skipAuth: true });

export const uploadPaymentReceiptFile = (orderId, formData) =>
  api.post(`/api/orders/${orderId}/receipt/upload`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const uploadPaymentReceipt = (orderId, data) =>
  api.post(`/api/orders/${orderId}/receipt`, data);


