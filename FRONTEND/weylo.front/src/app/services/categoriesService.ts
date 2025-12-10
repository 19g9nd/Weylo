import { httpClient } from "./httpClient";
import { ApiResponse } from "../types/shared";
import { Category, CategoryDto } from "../types/category";

export const categoriesService = {
  // ========== PUBLIC ==========
  async getCategories(): Promise<ApiResponse<Category[]>> {
    return httpClient.get(`/api/categories`);
  },

  async getCategoryById(id: number): Promise<ApiResponse<Category>> {
    return httpClient.get(`/api/categories/${id}`);
  },

  async getDestinationsByCategory(
    categoryId: number
  ): Promise<ApiResponse<any>> {
    return httpClient.get(`/api/categories/${categoryId}/destinations`);
  },

  // ========== ADMIN ==========
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

  async canDeleteCategory(
    id: number
  ): Promise<ApiResponse<{ canDelete: boolean; reason?: string }>> {
    return httpClient.get(`/api/categories/${id}/can-delete`);
  },

  async updateDestinationCategory(
    destinationId: number,
    categoryId: number
  ): Promise<ApiResponse<void>> {
    return httpClient.put(
      `/api/admin/categories/${categoryId}/destinations/${destinationId}`,
      {}
    );
  },

  async transferCategoryDestinations(
    fromCategoryId: number,
    toCategoryId: number
  ): Promise<ApiResponse<any>> {
    return httpClient.post(`/api/admin/categories/transfer`, {
      fromCategoryId,
      toCategoryId,
    });
  },
};