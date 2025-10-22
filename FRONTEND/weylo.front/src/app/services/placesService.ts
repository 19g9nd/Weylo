import { httpClient } from "./httpClient";
import { BasePlace } from "../types/place";
import { transformCatalogPlace } from "../utils/transformCatalogPlace";

export interface SavePlaceRequest {
  googlePlaceId: string;
  name: string;
  latitude: number;
  longitude: number;
  address?: string;
  rating?: number;
  imageUrl?: string;
  cityName: string;
  countryName: string;
  googleTypes?: string[];
}

export interface UpdatePlaceRequest {
  name?: string;
  category?: string;
  cachedAddress?: string;
}

export const placesService = {
  basePath: "/api/destinations",

  async savePlace(placeData: SavePlaceRequest): Promise<BasePlace | null> {
    const response = await httpClient.post<any>(
      `${this.basePath}/save`,
      placeData
    );

    if (response.success && response.data) {
      return transformCatalogPlace(response.data);
    }

    console.error("Failed to save place:", response.error);
    return null;
  },

  async getCatalogue(): Promise<BasePlace[]> {
    const response = await httpClient.get<any[]>(`${this.basePath}/catalogue`);

    if (response.success && response.data) {
      return response.data.map(transformCatalogPlace);
    }

    console.error("Failed to load places catalogue:", response.error);
    return [];
  },

  async getPopular(take: number = 20): Promise<BasePlace[]> {
    const response = await httpClient.get<any[]>(
      `${this.basePath}/popular?take=${take}`
    );

    if (response.success && response.data) {
      return response.data.map(transformCatalogPlace);
    }

    console.error("Failed to load popular places:", response.error);
    return [];
  },

  async getPlace(id: number): Promise<BasePlace | null> {
    const response = await httpClient.get<any>(`${this.basePath}/${id}`);

    if (response.success && response.data) {
      return transformCatalogPlace(response.data);
    }

    console.error(`Failed to load place ${id}:`, response.error);
    return null;
  },

  async deletePlace(id: number): Promise<boolean> {
    const response = await httpClient.delete(`${this.basePath}/${id}`);

    if (response.success) {
      return true;
    }

    console.error(`Failed to delete place ${id}:`, response.error);
    return false;
  },

  async getPlacesByCity(cityId: number): Promise<BasePlace[]> {
    const response = await httpClient.get<any[]>(
      `${this.basePath}/by-city/${cityId}`
    );

    if (response.success && response.data) {
      return response.data.map(transformCatalogPlace);
    }

    console.error(`Failed to load places for city ${cityId}:`, response.error);
    return [];
  },

  async searchPlaces(query: string): Promise<BasePlace[]> {
    if (!query.trim()) {
      return [];
    }

    const response = await httpClient.get<any[]>(
      `${this.basePath}/search?query=${encodeURIComponent(query)}`
    );

    if (response.success && response.data) {
      return response.data.map(transformCatalogPlace);
    }

    console.error(
      `Failed to search places with query "${query}":`,
      response.error
    );
    return [];
  },

  async updatePlace(
    placeId: number,
    updateData: UpdatePlaceRequest
  ): Promise<BasePlace | null> {
    const response = await httpClient.put<any>(
      `${this.basePath}/${placeId}`,
      updateData
    );

    if (response.success && response.data) {
      return transformCatalogPlace(response.data);
    }

    console.error(`Failed to update place ${placeId}:`, response.error);
    return null;
  },
};