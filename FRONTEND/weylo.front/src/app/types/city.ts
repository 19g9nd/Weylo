export interface City {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  countryId: number;
  countryName: string;
  countryCode: string;
  googlePlaceId: string;
  createdAt: string; // ISO date string
  destinationsCount: number;
}

export interface CreateCityRequest {
  name: string;
  latitude: number;
  longitude: number;
  countryId: number;
  googlePlaceId: string;
}

export interface UpdateCityRequest {
  name: string;
  latitude: number;
  longitude: number;
  countryId: number;
  googlePlaceId: string;
}

export interface MergeDuplicateCitiesResult {
  remainingCount: any;
  message: string;
  mergedCount: number;
}

export interface CityConflictResponse {
  message: string;
  existingCity: {
    id: number;
    name: string;
    latitude: number;
    longitude: number;
  };
}