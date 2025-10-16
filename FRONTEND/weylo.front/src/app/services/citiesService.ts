import {
  City,
  CreateCityRequest,
  UpdateCityRequest,
  MergeDuplicateCitiesResult,
} from "../types/city";
import { ApiResponse } from "../types/shared";
import httpClient from "./httpClient";

export const citiesService = {
  /**
   * Получить список всех городов
   * GET /api/admin/cities
   */
  async getCities(): Promise<ApiResponse<City[]>> {
    return httpClient.get<City[]>("/api/admin/cities");
  },

  /**
   * Получить город по ID
   * GET /api/admin/cities/{id}
   */
  async getCity(id: number): Promise<ApiResponse<City>> {
    return httpClient.get<City>(`/api/admin/cities/${id}`);
  },

  /**
   * Создать новый город
   * POST /api/admin/cities
   */
  async createCity(payload: CreateCityRequest): Promise<ApiResponse<City>> {
    return httpClient.post<City>("/api/admin/cities", payload);
  },

  /**
   * Обновить существующий город
   * PUT /api/admin/cities/{id}
   */
  async updateCity(
    id: number,
    payload: UpdateCityRequest
  ): Promise<ApiResponse<void>> {
    return httpClient.put<void>(`/api/admin/cities/${id}`, payload);
  },

  /**
   * Удалить город
   * DELETE /api/admin/cities/{id}
   */
  async deleteCity(id: number): Promise<ApiResponse<void>> {
    return httpClient.delete<void>(`/api/admin/cities/${id}`);
  },

  /**
   * Объединить дубликаты городов
   * POST /api/admin/cities/merge-duplicates
   */
  async mergeDuplicates(): Promise<ApiResponse<MergeDuplicateCitiesResult>> {
    return httpClient.post<MergeDuplicateCitiesResult>(
      "/api/admin/cities/merge-duplicates"
    );
  },
};
