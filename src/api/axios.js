import axios from "axios";

const api = axios.create({
  baseURL: "https://sarupyaedu-backend-computer-store.onrender.com/api",
});

// attach admin token automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("adminToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
