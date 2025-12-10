// utils/transformCatalogPlace.ts

import { BasePlace } from "../types/place";

interface BackendDestination {
  id: number;
  googlePlaceId: string;
  name: string;
  latitude: number;
  longitude: number;
  cachedAddress?: string;
  cachedRating?: number;
  cachedImageUrl?: string;
  cachedDescription?: string;
  categoryId?: number;
  categoryName?: string;
  cityId?: number;
  cityName?: string;
  countryId?: number;
  countryName?: string;
  googleType?: string;
  createdAt?: string;
  // Add these properties that exist in your JSON
  category?: {
    id: number;
    name: string;
    description: string;
    // ... other category properties
  };
  city?: {
    id: number;
    name: string;
    countryId: number;
    // ... other city properties
    country?: {
      id: number;
      name: string;
      code: string;
      // ... other country properties
    };
  };
}

export function transformCatalogPlace(data: BackendDestination): BasePlace {
  return {
    backendId: data.id,
    placeId: data.googlePlaceId,
    location: {
      lat: data.latitude,
      lng: data.longitude,
    },
    displayName: data.name,
    formattedAddress: data.cachedAddress,
    rating: data.cachedRating || null, // Use cachedRating instead of rating
    userRatingsTotal: null,
    googleType: data.googleType,
    types: data.googleType ? data.googleType.split(",") : [],
    primaryTypeDisplayName: data.category?.name 
      ? { text: data.category.name } 
      : data.categoryName 
        ? { text: data.categoryName }
        : undefined,
    photos: data.cachedImageUrl
      ? [{ getURI: () => data.cachedImageUrl! }]
      : [],
    // Fix these properties to match your backend response structure
    category: data.category?.name || data.categoryName,
    categoryValue: data.category?.name || data.categoryName,
    categoryId: data.categoryId || data.category?.id,
    city: data.city?.name || data.cityName,
    cityId: data.cityId || data.city?.id,
    country: data.city?.country?.name || data.countryName,
    countryId: data.countryId || data.city?.country?.id,
    createdAt: data.createdAt ? new Date(data.createdAt) : undefined,
  };
}

export function transformFavouritePlace(data: any): any {
  const basePlace = transformCatalogPlace(data.destination || data);
  
  return {
    ...basePlace,
    userFavouriteId: data.id,
    personalNotes: data.personalNotes,
    savedAt: new Date(data.savedAt),
  };
}

export function transformRoutePlace(data: any): any {
  const basePlace = transformCatalogPlace(data.destination || data);
  
  return {
    ...basePlace,
    routeItemId: data.id,
    routeNotes: data.notes,
    dayNumber: data.dayNumber,
    orderInDay: data.orderInDay,
    plannedTime: data.plannedTime ? new Date(data.plannedTime) : undefined,
    isVisited: data.isVisited || false,
  };
}