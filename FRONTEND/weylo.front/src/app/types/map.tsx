export interface SavedPlace {
  placeId: string;
  location: { lat: number; lng: number };
  displayName?: string;
  formattedAddress?: string;
  rating?: number | null;
  userRatingsTotal?: number | null;
  types?: string[];
  primaryTypeDisplayName?: { text: string };
  note?: string;
}

export interface PlaceData extends SavedPlace {
  name: string;
  lat: number;
  lng: number;
}
