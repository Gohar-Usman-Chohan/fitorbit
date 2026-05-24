import axios from "axios";
import STATUS_CODES from "./statusCodes";
import { handleResponseStatus } from "./responseHandler";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_BACKEND_API_URL ||
  "http://localhost:5000/api";

const axiosInstance = axios.create({
  baseURL: API_BASE_URL.endsWith("/api") ? API_BASE_URL : `${API_BASE_URL}/api`,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Send cookies with requests if required
});

// Request Interceptor: Attach token if available
axiosInstance.interceptors.request.use(
  (config) => {
    // If running in browser, fetch JWT token from localStorage or cookies
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle global errors and unauthorized attempts
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const status = error.response ? error.response.status : null;
    const message = error.response && error.response.data ? error.response.data.message : null;

    if (status) {
      handleResponseStatus(status, message);
      
      // Auto-logout user if token is unauthorized or expired
      if (status === STATUS_CODES.UNAUTHORIZED && typeof window !== "undefined") {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        
        // Only redirect to login if we aren't already on a public page
        const publicPaths = ["/login", "/register", "/forgot-password", "/reset-password"];
        const currentPath = window.location.pathname;
        if (!publicPaths.some(path => currentPath.startsWith(path))) {
          window.location.href = "/login";
        }
      }
    } else {
      // Network error or no response
      handleResponseStatus(500, "Network connection error. Please try again.");
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
