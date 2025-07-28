import axios from "axios";
import { toast } from "react-toastify";

const api = axios.create({
  baseURL: "http://192.168.8.156:5000/api", // Your backend URL
});

// Add token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      toast.error("Session expired. Please login again.");
      window.location.href = "/login"; // Full page reload to clear state
    }
    return Promise.reject(error);
  }
);

export default api;