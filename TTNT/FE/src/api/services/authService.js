import axiosInstance from "../config/axios.js";

export const authService = {
  register: (userData) => {
    return axiosInstance.post("/auth/register", userData);
  },

  login: (credentials) => {
    return axiosInstance.post("/auth/login", credentials);
  },

  logout: () => {
    return axiosInstance.post("/auth/logout");
  },

  getProfile: () => {
    return axiosInstance.get("/auth/profile");
  },

  updateProfile: (userData) => {
    return axiosInstance.patch("/auth/profile", userData);
  },

  forgotPassword: (email) => {
    return axiosInstance.post("/auth/forgot-password", { email });
  },

  verifyOtp: (email, otp) => {
    return axiosInstance.post("/auth/verify-otp", { email, otp });
  },

  resetPassword: (token, password, email) => {
    return axiosInstance.post("/auth/reset-password", { token, password, email });
  },
};

