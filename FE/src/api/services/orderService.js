import axiosInstance from "../config/axios.js";

export const orderService = {
  createOrder: (orderData) => {
    return axiosInstance.post("/orders", orderData);
  },

  getOrders: (params = {}) => {
    return axiosInstance.get("/orders", { params });
  },

  getOrderById: (orderId) => {
    return axiosInstance.get(`/orders/${orderId}`);
  },

  updateOrderStatus: (orderId, status) => {
    return axiosInstance.patch(`/orders/${orderId}/status`, { status });
  },

  cancelOrder: (orderId) => {
    return axiosInstance.post(`/orders/${orderId}/cancel`);
  },
};

