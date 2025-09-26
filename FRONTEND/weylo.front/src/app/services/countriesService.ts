import { ApiResponse } from "../types/shared";
import httpClient from "./httpClient";

export interface SupportedCountry {
  id: number;
  name: string;
  code: string;
  northBound: number;
  southBound: number;
  eastBound: number;
  westBound: number;
  googlePlaceId: string;
}

export interface CountryBounds {
  south: number;
  west: number;
  north: number;
  east: number;
}

export interface BulkCreateResult {
  successCount: number;
  createdCountries: SupportedCountry[];
  errors: string[];
}

export const countriesService = {
  async getSupportedCountries(): Promise<ApiResponse<SupportedCountry[]>> {
    return httpClient.get<SupportedCountry[]>("/api/admin/countries/supported");
  },

  async getCountryByCode(code: string): Promise<ApiResponse<SupportedCountry>> {
    return httpClient.get<SupportedCountry>(`/api/admin/countries/by-code/${code}`);
  },

  async checkCountrySupport(code: string): Promise<ApiResponse<{ countryCode: string; isSupported: boolean }>> {
    return httpClient.get<{ countryCode: string; isSupported: boolean }>(`/api/admin/countries/check-support/${code}`);
  },

  async getAllCountries(): Promise<ApiResponse<SupportedCountry[]>> {
    return httpClient.get<SupportedCountry[]>("/api/admin/countries");
  },

  async createCountry(countryName: string): Promise<ApiResponse<SupportedCountry>> {
    return httpClient.post<SupportedCountry>("/api/admin/countries", { countryName });
  },

  async bulkCreateCountries(countryNames: string[]): Promise<ApiResponse<BulkCreateResult>> {
    return httpClient.post<BulkCreateResult>("/api/admin/countries/bulk-create", countryNames);
  },

  async refreshCountryData(countryId: number): Promise<ApiResponse<SupportedCountry>> {
    return httpClient.put<SupportedCountry>(`/api/admin/countries/${countryId}/refresh-data`);
  },

  async deleteCountry(countryId: number): Promise<ApiResponse<void>> {
    return httpClient.delete(`/api/admin/countries/${countryId}`);
  },

  async getSupportedCountryCodes(): Promise<ApiResponse<string[]>> {
    return httpClient.get<string[]>("/api/admin/countries/codes");
  }
};