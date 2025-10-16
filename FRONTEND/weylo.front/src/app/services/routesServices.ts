import { ApiResponse } from "../types/shared";
import { BackendRoute } from "../types/sidebar";
import httpClient from "./httpClient";

export const routesService = {
  async getMyRoutes(): Promise<ApiResponse<BackendRoute[]>> {
    return httpClient.get("/api/user/routes");
  },

  async createRoute(
    routeData: Omit<BackendRoute, "id" | "createdAt" | "updatedAt">
  ): Promise<ApiResponse<BackendRoute>> {
    return httpClient.post("/api/user/routes", routeData);
  },

  async updateRoute(
    routeId: number,
    routeData: Partial<BackendRoute>
  ): Promise<ApiResponse<BackendRoute>> {
    return httpClient.put(`/api/user/routes/${routeId}`, routeData);
  },

  async deleteRoute(routeId: number): Promise<ApiResponse<void>> {
    return httpClient.delete(`/api/user/routes/${routeId}`);
  },

  async getRouteDetails(routeId: number): Promise<ApiResponse<BackendRoute>> {
    return httpClient.get(`/api/user/route/${routeId}`);
  },

  async addDestinationToRoute(
    routeId: number,
    request: any
  ): Promise<ApiResponse<any>> {
    return httpClient.post(`/api/user/route/${routeId}/destinations`, request);
  },
  async addDayToRoute(
    routeId: number,
    request: any
  ): Promise<ApiResponse<any>> {
    return httpClient.post(`/api/user/route/${routeId}/days`, request);
  },

  async updateRouteDestination(
    routeDestinationId: number,
    request: any
  ): Promise<ApiResponse<any>> {
    return httpClient.put(
      `/api/user/route/destinations/${routeDestinationId}`,
      request
    );
  },

  async moveDestination(
    routeDestinationId: number,
    request: any
  ): Promise<ApiResponse<any>> {
    return httpClient.put(
      `/api/user/route/destinations/${routeDestinationId}/move`,
      request
    );
  },

  async removeDestinationFromRoute(
    routeId: number,
    destinationId: number
  ): Promise<ApiResponse<any>> {
    return httpClient.delete(
      `/api/Route/${routeId}/destinations/${destinationId}`
    );
  },

  async removeDayFromRoute(
    routeId: number,
    dayNumber: number
  ): Promise<ApiResponse<any>> {
    return httpClient.delete(`/api/Route/${routeId}/days/${dayNumber}`);
  },
};