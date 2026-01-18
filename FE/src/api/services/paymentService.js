import axiosInstance from "../config/axios.js";

export const paymentService = {
  createVnpayUrl: (orderId) => {
    return axiosInstance.post(`/payment/orders/${orderId}/vnpay`);
  },

  getPaymentStatus: (orderId) => {
    return axiosInstance.get(`/payment/orders/${orderId}`);
  },
};

