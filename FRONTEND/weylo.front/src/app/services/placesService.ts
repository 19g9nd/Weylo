import { BackendPlace, SavedPlace } from "../types/map";
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
  googleType?: string;
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
  async savePlace(place: SavedPlace): Promise<ApiResponse<{ id: number }>> {
    const { city, country } = extractLocationInfo(place.formattedAddress);
    const googleType =
      place.types?.[0] || place.primaryTypeDisplayName?.text || "";

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
      googleType: googleType,
    };

    return httpClient.post<{ id: number }>(
      "/api/user/destinations/save",
      request
    );
  },

  async deletePlace(
    backendId: number
  ): Promise<ApiResponse<{ success: boolean }>> {
    return httpClient.delete<{ success: boolean }>(
      `/api/user/destinations/${backendId}`
    );
  },

  async getMyPlaces(): Promise<ApiResponse<SavedPlace[]>> {
    const response = await httpClient.get<BackendPlace[]>(
      "/api/user/destinations/my"
    );

    if (!response.success || !response.data) {
      return {
        success: false,
        error: response.error || "Failed to fetch places",
      };
    }

    const places: SavedPlace[] = response.data.map((bp) => {
      const categoryName = bp.category || bp.googleType || "general";
      const googleType = bp.googleType || "point_of_interest";

      const types = googleType
        ? [googleType]
        : [categoryName.toLowerCase().replace(/ /g, "_")];

      return {
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
                getURI: () => bp.cachedImageUrl || "",
              } as google.maps.places.Photo,
            ]
          : undefined,
        types: types,
        primaryTypeDisplayName: {
          text: categoryName,
        },
        source: "saved" as const,
      };
    });

    return { success: true, data: places };
  },
};
