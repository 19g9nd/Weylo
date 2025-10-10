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
};
