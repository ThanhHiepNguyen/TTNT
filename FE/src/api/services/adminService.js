import axiosInstance from "../config/axios.js";

export const adminService = {
  getUsers: (params = {}) => {
    return axiosInstance.get("/auth/admin/users", { params });
  },

  getUserById: (userId) => {
    return axiosInstance.get(`/auth/admin/users/${userId}`);
  },

  createUser: (userData) => {
    return axiosInstance.post("/auth/admin/users", userData);
  },

  updateUser: (userId, userData) => {
    return axiosInstance.patch(`/auth/admin/users/${userId}`, userData);
  },

  lockUser: (userId) => {
    return axiosInstance.post(`/auth/admin/users/${userId}/lock`);
  },

  unlockUser: (userId) => {
    return axiosInstance.post(`/auth/admin/users/${userId}/unlock`);
  },
};

