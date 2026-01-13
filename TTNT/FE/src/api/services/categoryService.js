import axiosInstance from "../config/axios.js";

export const categoryService = {
  getAllCategories: () => {
    return axiosInstance.get("/categories");
  },

  getCategoryById: (categoryId, params = {}) => {
    return axiosInstance.get(`/categories/${categoryId}`, { params });
  },

  createCategory: (categoryData) => {
    return axiosInstance.post("/categories", categoryData);
  },

  updateCategory: (categoryId, categoryData) => {
    return axiosInstance.patch(`/categories/${categoryId}`, categoryData);
  },

  deleteCategory: (categoryId) => {
    return axiosInstance.delete(`/categories/${categoryId}`);
  },
};

