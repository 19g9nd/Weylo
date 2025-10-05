import { httpClient } from "./httpClient";
import { ApiResponse } from "../types/shared";
import { Category, CategoryDto } from "../types/category";

export const categoriesService = {
  async getCategories(): Promise<ApiResponse<Category[]>> {
    return httpClient.get(`/api/admin/categories`);
  },

  async getCategoryById(id: number): Promise<ApiResponse<Category>> {
    return httpClient.get(`/api/admin/categories/${id}`);
  },

  async createCategory(
    categoryDto: CategoryDto
  ): Promise<ApiResponse<Category>> {
    return httpClient.post(`/api/admin/categories`, categoryDto);
  },

  async updateCategory(
    id: number,
    categoryDto: CategoryDto
  ): Promise<ApiResponse<void>> {
    return httpClient.put(`/api/admin/categories/${id}`, categoryDto);
  },

  async deleteCategory(id: number): Promise<ApiResponse<void>> {
    return httpClient.delete(`/api/admin/categories/${id}`);
  },
};
