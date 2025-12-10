import { ApiResponse } from "../types/shared";
import httpClient from "./httpClient";
import { CreateRouteRequest, UpdateRouteRequest, UpdateRouteItemRequest, AddPlaceToRouteRequest, ReorderPlacesRequest } from "../types/requests";
import { RouteDetailsDto, RouteDto, RouteItemDto } from "../types/route";

export const routesService = {
  async getMyRoutes(): Promise<ApiResponse<RouteDto[]>> {
    return httpClient.get("/api/route");
  },

  async getRouteDetails(routeId: number): Promise<ApiResponse<RouteDetailsDto>> {
    return httpClient.get(`/api/route/${routeId}`);
  },

  async createRoute(routeData: CreateRouteRequest): Promise<ApiResponse<RouteDto>> {
    return httpClient.post("/api/route", routeData);
  },

  async updateRoute(routeId: number, routeData: UpdateRouteRequest): Promise<ApiResponse<RouteDto>> {
    return httpClient.put(`/api/route/${routeId}`, routeData);
  },

  async deleteRoute(routeId: number): Promise<ApiResponse<void>> {
    return httpClient.delete(`/api/route/${routeId}`);
  },

  async addPlaceToRoute(routeId: number, request: AddPlaceToRouteRequest): Promise<ApiResponse<RouteItemDto>> {
    return httpClient.post(`/api/route/${routeId}/places`, request);
  },

  async updateRouteItem(routeItemId: number, request: UpdateRouteItemRequest): Promise<ApiResponse<RouteItemDto>> {
    return httpClient.put(`/api/route/items/${routeItemId}`, request);
  },

  async removePlaceFromRoute(routeId: number, placeId: number): Promise<ApiResponse<void>> {
    return httpClient.delete(`/api/route/${routeId}/places/${placeId}`);
  },

  async reorderPlaces(routeId: number, request: ReorderPlacesRequest): Promise<ApiResponse<void>> {
    return httpClient.put(`/api/route/${routeId}/places/reorder`, request);
  }
};