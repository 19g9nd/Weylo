import {
  City,
  CreateCityRequest,
  UpdateCityRequest,
  MergeDuplicateCitiesResult,
} from "../types/city";
import { ApiResponse } from "../types/shared";
import httpClient from "./httpClient";

export interface AutoDetectCityRequest {
  latitude: number;
  longitude: number;
  autoCreate?: boolean;
}
export interface FetchCityDetailsRequest {
  cityName: string;
}

export interface CityDetailsResponse {
  message: string;
  cityExists: boolean;
  countryNotSupported?: boolean;
  existingCity?: {
    id: number;
    name: string;
    latitude: number;
    longitude: number;
    countryId: number;
    countryName: string;
    countryCode: string;
  };
  cityDetails?: {
    name: string;
    latitude: number;
    longitude: number;
    countryId: number;
    countryName: string;
    countryCode: string;
    googlePlaceId: string;
    formattedAddress: string;
  };
}

export interface AutoDetectCityResponse {
  message: string;
  cityExists: boolean;
  autoCreated?: boolean;
  city?: {
    id: number;
    name: string;
    latitude: number;
    longitude: number;
    countryId: number;
    countryName: string;
    countryCode: string;
    googlePlaceId?: string;
  };
  detectedCity?: {
    name: string;
    latitude: number;
    longitude: number;
    countryId: number;
    countryName: string;
    countryCode: string;
    googlePlaceId: string;
  };
  suggestCountryCreation?: boolean;
}

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

  async fetchCityDetails(
    request: FetchCityDetailsRequest
  ): Promise<ApiResponse<CityDetailsResponse>> {
    return httpClient.post<CityDetailsResponse>(
      "/api/admin/cities/fetch-details",
      request
    );
  },

  /**
   * Создать новый город
   * POST /api/admin/cities
   */
  async createCity(payload: CreateCityRequest): Promise<ApiResponse<City>> {
    return httpClient.post<City>("/api/admin/cities", payload);
  },

  async autoDetectCity(
    request: AutoDetectCityRequest
  ): Promise<ApiResponse<AutoDetectCityResponse>> {
    return httpClient.post<AutoDetectCityResponse>(
      "/api/cities/auto-detect",
      request
    );
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
