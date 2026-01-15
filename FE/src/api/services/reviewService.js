import axiosInstance from "../config/axios.js";

export const reviewService = {
  createReview: (reviewData) => {
    return axiosInstance.post("/reviews", reviewData);
  },

  createComment: (commentData) => {
    return axiosInstance.post("/reviews/comment", commentData);
  },

  getReviewsByProduct: (productId, params = {}) => {
    return axiosInstance.get(`/reviews/product/${productId}`, { params });
  },

  canReviewProduct: (productId) => {
    return axiosInstance.get(`/reviews/product/${productId}/can-review`);
  },

  updateReview: (reviewId, reviewData) => {
    return axiosInstance.patch(`/reviews/${reviewId}`, reviewData);
  },

  deleteReview: (reviewId) => {
    return axiosInstance.delete(`/reviews/${reviewId}`);
  },

  getAllReviews: (params = {}) => {
    return axiosInstance.get("/reviews", { params });
  },

  replyReview: (reviewId, reply) => {
    return axiosInstance.post(`/reviews/${reviewId}/reply`, { reply });
  },
};

