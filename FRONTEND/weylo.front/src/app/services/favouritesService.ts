import { Place } from "../types/place";
import httpClient from "./httpClient";

export const favouritesService = {
  async getFavourites(): Promise<Place[]> {
    const response = await httpClient.get<Place[]>("/api/destinations/favourites");
    if (!response.success) {
      throw new Error(response.error || "Failed to load favourites");
    }
    return response.data || [];
  },

  async addToFavourites(destinationId: number): Promise<void> {
    const response = await httpClient.post(
      `/api/destinations/favourites/${destinationId}`
    );
    if (!response.success) {
      throw new Error(response.error || "Failed to add to favourites");
    }
  },

  async removeFromFavourites(destinationId: number): Promise<void> {
    const response = await httpClient.delete(
      `/api/destinations/favourites/${destinationId}`
    );
    if (!response.success) {
      throw new Error(response.error || "Failed to remove from favourites");
    }
  },
};