import axiosInstance from "../config/axios.js";

export const productService = {
  getAllProducts: (params = {}) => {
    return axiosInstance.get("/products", { params });
  },

  getProductById: (productId, sortBy = "desc") => {
    return axiosInstance.get(`/products/${productId}`, {
      params: { sortBy },
    });
  },

  createProduct: (productData) => {
    return axiosInstance.post("/products", productData);
  },

  updateProduct: (productId, productData) => {
    return axiosInstance.patch(`/products/${productId}`, productData);
  },

  deleteProduct: (productId) => {
    return axiosInstance.delete(`/products/${productId}`);
  },
};

