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
  category?: string;
  categoryValue?: string;
  city?: string;
  country?: string;
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