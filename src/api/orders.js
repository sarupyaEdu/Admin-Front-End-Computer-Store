import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:4500/api",
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("adminToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Orders
export const adminListOrders = () => API.get("/orders/admin/all");

export const adminUpdateOrderStatus = (id, payload) =>
  API.patch(`/orders/admin/${id}/status`, payload);

// Refund
export const adminRefundOrder = (id) => API.patch(`/orders/admin/${id}/refund`);

// Return / Replacement
export const adminDecideRR = (id, payload) =>
  API.patch(`/orders/admin/${id}/rr/decide`, payload);

export const adminCompleteRR = (id, payload) =>
  API.patch(`/orders/admin/${id}/rr/complete`, payload);
