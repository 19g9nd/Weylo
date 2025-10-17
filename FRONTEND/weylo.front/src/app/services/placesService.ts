import { BackendPlace, Place } from "../types/map";
import { ApiResponse } from "../types/shared";
import httpClient from "./httpClient";

interface SavePlaceRequest {
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

const extractLocationInfo = (
  address: string = ""
): { city: string; country: string } => {
  const parts = address.split(", ");
  const country = parts.length > 0 ? parts[parts.length - 1] : "Unknown";
  const city = parts.length > 1 ? parts[parts.length - 2] : "Unknown";
  return { city, country };
};

export const placesService = {
  async savePlace(place: Place): Promise<ApiResponse<{ id: number }>> {
    const { city, country } = extractLocationInfo(place.formattedAddress);

    const googleTypes = place.types?.length
      ? place.types
      : place.primaryTypeDisplayName?.text
      ? [place.primaryTypeDisplayName.text]
      : [];

    const request: SavePlaceRequest = {
      googlePlaceId: place.placeId,
      name: place.displayName || "Unknown Place",
      latitude: place.location.lat,
      longitude: place.location.lng,
      address: place.formattedAddress,
      rating: place.rating ?? undefined,
      imageUrl: place.photos?.[0]?.getURI?.(),
      cityName: city,
      countryName: country,
      googleTypes,
    };

    return httpClient.post<{ id: number }>("/api/destinations/save", request);
  },

  async deletePlace(
    backendId: number
  ): Promise<ApiResponse<{ success: boolean }>> {
    return httpClient.delete<{ success: boolean }>(
      `/api/destinations/${backendId}`
    );
  },

  async getPlaces(): Promise<ApiResponse<Place[]>> {
    const response = await httpClient.get<BackendPlace[]>(
      "/api/destinations/catalogue"
    );

    if (!response.success || !response.data) {
      return {
        success: false,
        error: response.error || "Failed to fetch places",
      };
    }

    const places: Place[] = response.data.map((bp) => ({
      placeId: bp.googlePlaceId,
      backendId: bp.id,
      displayName: bp.name,
      formattedAddress: bp.cachedAddress || "",
      location: {
        lat: bp.latitude,
        lng: bp.longitude,
      },
      rating: bp.cachedRating,
      photos: bp.cachedImageUrl
        ? [
            {
              getURI: () => bp.cachedImageUrl,
            } as google.maps.places.Photo,
          ]
        : undefined,
      types: bp.googleType
        ? bp.googleType.split(",").map((t) => t.trim())
        : [bp.category.toLowerCase().replace(" ", "_")],
      primaryTypeDisplayName: {
        text: bp.category,
      },
    }));

    return { success: true, data: places };
  },

  async getMyPlaces(): Promise<ApiResponse<Place[]>> {
    const response = await httpClient.get<BackendPlace[]>(
      "/api/destinations/my"
    );

    if (!response.success || !response.data) {
      return {
        success: false,
        error: response.error || "Failed to fetch places",
      };
    }

    const places: Place[] = response.data.map((bp) => ({
      placeId: bp.googlePlaceId,
      backendId: bp.id,
      displayName: bp.name,
      formattedAddress: bp.cachedAddress || "",
      location: {
        lat: bp.latitude,
        lng: bp.longitude,
      },
      rating: bp.cachedRating,
      photos: bp.cachedImageUrl
        ? [
            {
              getURI: () => bp.cachedImageUrl,
            } as google.maps.places.Photo,
          ]
        : undefined,
      types: bp.googleType
        ? bp.googleType.split(",").map((t) => t.trim())
        : [bp.category.toLowerCase().replace(" ", "_")],
      primaryTypeDisplayName: {
        text: bp.category,
      },
    }));

    return { success: true, data: places };
  },
  async addPlaceToUser(backendId: number): Promise<ApiResponse<Place>> {
    return httpClient.post<Place>(`/api/destinations/my/${backendId}`);
  },
};