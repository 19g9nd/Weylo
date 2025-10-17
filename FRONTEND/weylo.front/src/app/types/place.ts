export interface Place {
  backendId?: number;
  placeId: string;
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
}

export interface BackendPlace {
  id: number;
  googlePlaceId: string;
  name: string;
  latitude: number;
  longitude: number;
  cachedAddress?: string;
  cachedRating?: number;
  cachedImageUrl?: string;
  googleType?: string;
  city: string;
  category: string;
  createdAt: string;
}