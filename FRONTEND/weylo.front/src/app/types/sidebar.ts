export enum SidebarMode {
  WELCOME = "welcome",
  COUNTRY_EXPLORATION = "country_exploration",
  ROUTE_PLANNING = "route_planning",
  MY_ROUTES = "my_routes",
}

export interface Route {
  id: string;
  name: string;
  places: RoutePlace[];
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface RoutePlace {
  placeId: string;
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
