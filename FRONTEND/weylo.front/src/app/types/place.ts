// types/place.ts

export interface BasePlace {
  backendId: number;
  placeId: string;
  location: { lat: number; lng: number };
  displayName: string;
  formattedAddress?: string;
  rating?: number | null;
  userRatingsTotal?: number | null;
  googleType?: string;
  types?: string[];
  primaryTypeDisplayName?: { text: string };
  photos?: { getURI: () => string }[];
  
  // Additional properties for admin management
  category?: string;
  categoryValue?: string;
  categoryId?: number;
  city?: string;
  cityId?: number;
  country?: string;
  countryId?: number;
  createdAt?: Date;
}

export interface FavouritePlace extends BasePlace {
  userFavouriteId: number;
  personalNotes?: string;
  savedAt: Date;
}

export interface RoutePlace extends BasePlace {
  routeItemId: number;
  routeNotes?: string;
  dayNumber: number;
  orderInDay: number;
  plannedTime?: Date;
  isVisited: boolean;
}

export interface Place {
  backendId?: number;
  placeId: string;
  userFavouriteId?: number;
  location: { lat: number; lng: number };
  displayName?: string;
  formattedAddress?: string;
  rating?: number | null;
  userRatingsTotal?: number | null;
  googleType?: string;
  types?: string[];
  primaryTypeDisplayName?: { text: string };
  note?: string;
  photos?: { getURI: () => string }[];
  category?: string;
  categoryValue?: string;
  city?: string;
  country?: string;
  categoryId?: number;
  cityId?: number;
  countryId?: number;
}