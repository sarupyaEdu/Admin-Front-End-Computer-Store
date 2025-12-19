import api from "./axios";

export const adminListTickets = () => api.get("/support/admin/all");

export const adminUpdateTicketStatus = (id, data) =>
  api.patch(`/support/admin/${id}/status`, data);

export const adminAddTicketMessage = (id, data) =>
  api.post(`/support/${id}/message`, data);
