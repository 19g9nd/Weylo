import { BasePlace } from "./place";

export interface Route {
  id: number;
  name: string;
  startDate: string; // ISO string
  endDate: string; // ISO string
  notes?: string;
  status: "Draft" | "Active" | "Completed";
  createdAt: string;
  updatedAt: string;
}

export interface RouteDetails extends Route {
  routeItems: RouteItem[];
}

export interface RouteItem {
  id: number;
  routeId: number;
  dayNumber: number;
  orderInDay: number;
  userNotes?: string;
  plannedTime?: string; // ISO string
  isVisited: boolean;
  place: BasePlace;
}
export interface RouteDto {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  notes?: string;
  status: "Draft" | "Active" | "Completed";
  createdAt: string;
  updatedAt: string;
}

export interface RouteDetailsDto extends RouteDto {
  routeItems: RouteItemDto[];
}

export interface RouteItemDto {
  id: number;
  routeId: number;
  placeId: number;
  dayNumber: number;
  orderInDay: number;
  userNotes?: string;
  plannedTime?: string;
  isVisited: boolean;
  place: BasePlace;
}

export interface CreateRouteRequest {
  name: string;
  startDate: string;
  endDate: string;
  notes?: string;
}

export interface UpdateRouteRequest {
  name?: string;
  startDate?: string;
  endDate?: string;
  notes?: string;
  status?: string;
}

export interface AddPlaceToRouteRequest {
  placeId: number;
  dayNumber: number;
  userNotes?: string;
  plannedTime?: string;
}

export interface UpdateRouteItemRequest {
  dayNumber?: number;
  userNotes?: string;
  plannedTime?: string;
  isVisited?: boolean;
}

export interface ReorderPlacesRequest {
  placeOrder: number[];
  dayNumber: number;
}