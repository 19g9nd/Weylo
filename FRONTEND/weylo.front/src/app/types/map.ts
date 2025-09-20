export interface SavedPlace {
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
}

export interface PlaceData extends SavedPlace {
  name: string;
  lat: number;
  lng: number;
}
