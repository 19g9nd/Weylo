import { SupportedCountry } from "./country";
import { Place } from "./place";

export enum SidebarMode {
  WELCOME = "welcome",
  COUNTRY_EXPLORATION = "country_exploration",
  ROUTE_PLANNING = "route_planning",
  MY_ROUTES = "my_routes",
  FAVOURITES = "favourites",
}

export interface UnifiedSidebarProps {
  mode: SidebarMode;
  places: Place[];
  selectedPlaceId: string | null;
  onPlaceSelect: (placeId: string | null) => void;
  onRemovePlace: (place: Place) => void;
  selectedCountry: SupportedCountry | null;
  favourites: Place[];
  onAddToFavourites: (place: Place) => void; // ← ДОБАВИЛИ
  onRemoveFromFavourites: (place: Place) => void; // ← ДОБАВИЛИ

  activeRoute: Route | null;
  routes: Route[];
  onSelectRoute: (routeId: string) => void;
  onCreateRoute: () => void;
  onEditRoute: (route: Route) => void;
  onDeleteRoute: (routeId: string) => void;
  onDuplicateRoute: (routeId: string) => void;

  onAddPlaceToRoute: (place: Place) => void;
  onRemovePlaceFromRoute: (placeId: string) => void;
  onMovePlaceInRoute: (
    routeId: string,
    placeId: string,
    newDayNumber: number,
    newOrderInDay: number
  ) => void;
  onOptimizeRouteDay: (routeId: string, dayNumber: number) => void;

  onAddDay: (routeId: string) => void;
  onRemoveDay: (routeId: string, dayNumber: number) => void;

  onGetRouteStats: (routeId: string) => {
    totalPlaces: number;
    totalDays: number;
    avgPlacesPerDay: number;
  } | null;
  onGetRouteStatus: (route: Route) => { label: string; color: string };

  onSwitchMode: (mode: SidebarMode) => void;
  isLoading: boolean;
  error: string | null;
}

export interface Route {
  id: string; // Frontend ID localstorage
  backendId?: number; // ID from backend if synced
  userId?: string;
  name: string;
  places: RoutePlace[];
  startDate?: Date;
  endDate?: Date;
  status?: string; // e.g., "planned", "in_progress", "completed"
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  isPublic?: boolean; // Whether the route is public
  isSynced?: boolean; // Whether the route is synced with backend
}

export interface RoutePlace {
  placeId: string; // Google Place ID
  backendId?: number; // ID from backend if synced
  routeDestinationId?: number; // ID in RouteDestinations
  dayNumber: number;
  orderInDay: number;
  displayName: string;
  formattedAddress?: string;
  location: {
    lat: number;
    lng: number;
  };
  notes?: string;
  timeSlot?: string; // e.g., "morning", "afternoon", "evening"
  estimatedDuration?: number; // minutes
  isVisited?: boolean; // Whether the user marked it as visited
  actualVisitDate?: Date; // Date when the user actually visited
}

export interface RouteDay {
  dayNumber: number;
  places: RoutePlace[];
  date?: Date; // Calculated from startDate + dayNumber
  notes?: string;
}

export interface SidebarState {
  mode: SidebarMode;
  activeRouteId?: string | null;
}

// Backend API Types
export interface BackendRoute {
  id: number;
  name: string;
  userId: number;
  startDate: string;
  endDate: string;
  notes?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}
export interface BackendRouteDestinationDto {
  id: number;
  userRouteId: number;
  destinationId: number;
  order: number;
  dayNumber: number;
  orderInDay: number;
  plannedVisitDate: string | null;
  estimatedDuration: string | null;
  userNotes: string | null;
  isVisited: boolean;
  actualVisitDate: string | null;
  createdAt: string;
  destination: BackendDestinationDto;
}

export interface BackendDestinationDto {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  googlePlaceId: string;
  cachedDescription: string | null;
  cachedRating: number | null;
  cachedImageUrl: string | null;
  cachedAddress: string | null;
  cacheUpdatedAt: string | null;
  googleType: string;
  categoryId: number;
  categoryName: string | null;
  cityId: number;
  cityName: string | null;
  countryName: string | null;
  countryCode: string | null;
  usageCount: number;
  createdAt: string;
}

// Request types
export interface AddDestinationToRouteRequest {
  destinationId: number;
  dayNumber: number;
  orderInDay: number;
  notes?: string;
}

export interface UpdateRouteDestinationRequest {
  dayNumber?: number;
  orderInDay?: number;
  userNotes?: string;
  isVisited?: boolean;
}
