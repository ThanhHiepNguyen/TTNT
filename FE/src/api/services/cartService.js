import axiosInstance from "../config/axios.js";

export const cartService = {
  getCart: () => {
    return axiosInstance.get("/cart");
  },

  addToCart: (productId, optionId, quantity) => {
    return axiosInstance.post("/cart", {
      productId,
      optionId,
      quantity,
    });
  },

  updateCartItem: (cartItemId, quantity) => {
    return axiosInstance.patch(`/cart/${cartItemId}`, {
      quantity,
    });
  },

  removeCartItem: (cartItemId) => {
    return axiosInstance.delete(`/cart/${cartItemId}`);
  },

  clearCart: () => {
    return axiosInstance.delete("/cart");
  },
};

