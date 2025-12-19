import api from "./axios";

// Orders
export const adminListOrders = () => api.get("/orders/admin/all");

export const adminUpdateOrderStatus = (id, payload) =>
  api.patch(`/orders/admin/${id}/status`, payload);

// Refund
export const adminRefundOrder = (id) => api.patch(`/orders/admin/${id}/refund`);

// Return / Replacement
export const adminDecideRR = (id, payload) =>
  api.patch(`/orders/admin/${id}/rr/decide`, payload);

export const adminCompleteRR = (id, payload) =>
  api.patch(`/orders/admin/${id}/rr/complete`, payload);
