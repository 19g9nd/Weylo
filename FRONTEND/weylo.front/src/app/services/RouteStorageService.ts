// import { RouteDto, RouteDetailsDto } from "../types/route";

// const ROUTE_KEYS = {
//   ROUTES: "routes",
//   ROUTE_DETAILS: "route_details",
// };

// export class RouteStorageService {
//   private userId: number | null = null;

//   setUser(userId: number | null) {
//     this.userId = userId;
//   }

//   private getUserKey(baseKey: string): string {
//     if (!this.userId) throw new Error("User not set");
//     return `${baseKey}_${this.userId}`;
//   }

//   // Список маршрутов
//   async getRoutes(): Promise<RouteDto[]> {
//     if (!this.userId) return [];
//     return this._getFromStorage<RouteDto>(this.getUserKey(ROUTE_KEYS.ROUTES));
//   }

//   async saveRoutes(routes: RouteDto[]): Promise<void> {
//     await this._save(this.getUserKey(ROUTE_KEYS.ROUTES), routes);
//   }

//   // Детали маршрута
//   async getRouteDetails(routeId: number): Promise<RouteDetailsDto | null> {
//     if (!this.userId) return null;
//     const details = await this._getFromStorage<RouteDetailsDto>(
//       this.getUserKey(ROUTE_KEYS.ROUTE_DETAILS)
//     );
//     return details.find((d) => d.id === routeId) || null;
//   }

//   async saveRouteDetails(route: RouteDetailsDto): Promise<void> {
//     const details = await this._getFromStorage<RouteDetailsDto>(
//       this.getUserKey(ROUTE_KEYS.ROUTE_DETAILS)
//     );
//     const filtered = details.filter((d) => d.id !== route.id);
//     await this._save(this.getUserKey(ROUTE_KEYS.ROUTE_DETAILS), [
//       ...filtered,
//       route,
//     ]);
//   }

//   async deleteRouteDetails(routeId: number): Promise<void> {
//     const details = await this._getFromStorage<RouteDetailsDto>(
//       this.getUserKey(ROUTE_KEYS.ROUTE_DETAILS)
//     );
//     const filtered = details.filter((d) => d.id !== routeId);
//     await this._save(this.getUserKey(ROUTE_KEYS.ROUTE_DETAILS), filtered);
//   }

//   // Очистка данных пользователя
//   async clearUserData(): Promise<void> {
//     if (!this.userId) return;

//     const keys = [
//       this.getUserKey(ROUTE_KEYS.ROUTES),
//       this.getUserKey(ROUTE_KEYS.ROUTE_DETAILS),
//     ];

//     keys.forEach((key) => localStorage.removeItem(key));
//     this.userId = null;
//   }

//   // Helpers
//   private async _getFromStorage<T>(key: string): Promise<T[]> {
//     if (typeof window === "undefined") return [];
//     try {
//       const stored = localStorage.getItem(key);
//       return stored ? JSON.parse(stored) : [];
//     } catch (error) {
//       console.error(`Error loading from localStorage (${key}):`, error);
//       return [];
//     }
//   }

//   private async _save<T>(key: string, data: T[]): Promise<void> {
//     if (typeof window === "undefined") return;
//     try {
//       localStorage.setItem(key, JSON.stringify(data));
//     } catch (error) {
//       console.error(`Error saving to localStorage (${key}):`, error);
//       throw error;
//     }
//   }
// }

// export const routeStorageService = new RouteStorageService();