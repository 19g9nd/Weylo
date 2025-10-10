"use client";
import { useState, useEffect, useCallback } from "react";
import { Route, RoutePlace } from "../types/sidebar";
import { SavedPlace } from "../types/map";
import {
  calculateRouteStats,
  convertBackendToRoute,
  convertRouteToBackendCreate,
  convertRouteToBackendUpdate,
} from "../utils/routeUtils";
import { routesService } from "../services/routesServices";

// Local storage keys for persistence
const ROUTES_STORAGE_KEY = "weylo_routes";
const ACTIVE_ROUTE_KEY = "weylo_active_route";

// Utility functions
const generateRouteId = () =>
  `route_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
const now = () => new Date();

/**
 * Custom hook for managing routes with local storage persistence and backend synchronization
 * Handles CRUD operations for routes and provides synchronization status
 */
export const useRoutes = () => {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [activeRouteId, setActiveRouteId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);

  // Derive active route from routes and activeRouteId
  const activeRoute = routes.find((r) => r.id === activeRouteId) || null;

  /**
   * Load routes from backend with localStorage fallback
   * Merges backend routes with unsynced local routes
   */
  useEffect(() => {
    const loadRoutes = async () => {
      try {
        // Attempt to load from backend first
        const backendResult = await routesService.getMyRoutes();

        if (backendResult.success && backendResult.data) {
          const backendRoutes: Route[] = backendResult.data.map(
            convertBackendToRoute
          );

          // Load any unsynced local routes
          const stored = localStorage.getItem(ROUTES_STORAGE_KEY);
          let localRoutes: Route[] = [];

          if (stored) {
            const parsed = JSON.parse(stored);
            localRoutes = parsed.map((r: Route) => ({
              ...r,
              createdAt: new Date(r.createdAt),
              updatedAt: new Date(r.updatedAt),
              startDate: r.startDate ? new Date(r.startDate) : undefined,
              endDate: r.endDate ? new Date(r.endDate) : undefined,
            }));
          }

          // Combine backend routes with unsynced local routes
          const unsyncedLocal = localRoutes.filter((lr) => !lr.isSynced);
          const mergedRoutes = [...backendRoutes, ...unsyncedLocal];

          setRoutes(mergedRoutes);
        } else {
          // Fallback to localStorage only
          const stored = localStorage.getItem(ROUTES_STORAGE_KEY);
          if (stored) {
            const parsed = JSON.parse(stored);
            const routesWithDates = parsed.map((r: Route) => ({
              ...r,
              createdAt: new Date(r.createdAt),
              updatedAt: new Date(r.updatedAt),
              startDate: r.startDate ? new Date(r.startDate) : undefined,
              endDate: r.endDate ? new Date(r.endDate) : undefined,
            }));
            setRoutes(routesWithDates);
          }
        }

        // Restore active route selection
        const activeId = localStorage.getItem(ACTIVE_ROUTE_KEY);
        if (activeId) setActiveRouteId(activeId);
      } catch (error) {
        console.error("Error loading routes:", error);
        // Final fallback to localStorage with error handling
        try {
          const stored = localStorage.getItem(ROUTES_STORAGE_KEY);
          if (stored) {
            const parsed = JSON.parse(stored);
            const routesWithDates = parsed.map((r: Route) => ({
              ...r,
              createdAt: new Date(r.createdAt),
              updatedAt: new Date(r.updatedAt),
              startDate: r.startDate ? new Date(r.startDate) : undefined,
              endDate: r.endDate ? new Date(r.endDate) : undefined,
            }));
            setRoutes(routesWithDates);
          }
        } catch (e) {
          console.error("Error loading from localStorage:", e);
          setRoutes([]);
        }
      } finally {
        setLoaded(true);
      }
    };

    loadRoutes();
  }, []);

  /**
   * Persist routes to localStorage whenever routes change
   */
  useEffect(() => {
    if (!loaded) return;

    try {
      localStorage.setItem(ROUTES_STORAGE_KEY, JSON.stringify(routes));
    } catch (e) {
      console.error("Error saving routes to localStorage:", e);
    }
  }, [routes, loaded]);

  /**
   * Persist active route selection to localStorage
   */
  useEffect(() => {
    if (!loaded) return;

    try {
      if (activeRouteId) {
        localStorage.setItem(ACTIVE_ROUTE_KEY, activeRouteId);
      } else {
        localStorage.removeItem(ACTIVE_ROUTE_KEY);
      }
    } catch (e) {
      console.error("Error saving active route to localStorage:", e);
    }
  }, [activeRouteId, loaded]);

  /**
   * Helper function to update route data and mark as unsynced
   */
  const updateRouteData = useCallback(
    (routeId: string, updater: (route: Route) => Route) => {
      setRoutes((prev) =>
        prev.map((route) => {
          if (route.id === routeId) {
            const updated = updater(route);
            // Mark as unsynced if it has a backend ID
            if (updated.backendId) {
              updated.isSynced = false;
            }
            return updated;
          }
          return route;
        })
      );
    },
    []
  );

  /**
   * Helper function to update route places
   */
  const updateRoutePlaces = useCallback(
    (routeId: string, updater: (places: RoutePlace[]) => RoutePlace[]) => {
      updateRouteData(routeId, (route) => ({
        ...route,
        places: updater(route.places),
        updatedAt: now(),
        isSynced: false, // Mark as unsynced after place changes
      }));
    },
    [updateRouteData]
  );

  /**
   * Create a new route with optional backend synchronization
   */
  const createRoute = useCallback(
    async (name: string, startDate?: Date, endDate?: Date) => {
      const newRoute: Route = {
        id: generateRouteId(),
        name,
        places: [],
        startDate,
        endDate,
        status: "draft",
        createdAt: now(),
        updatedAt: now(),
        isSynced: false, // Initially unsynced
      };

      setRoutes((prev) => [...prev, newRoute]);
      setActiveRouteId(newRoute.id);

      // Sync with backend if user is authenticated
      if (userId) {
        try {
          const backendData = convertRouteToBackendCreate(newRoute, userId);
          const response = await routesService.createRoute(backendData);

          if (response.success && response.data) {
            // Update with backend ID and mark as synced
            updateRouteData(newRoute.id, (route) => ({
              ...route,
              backendId: response.data!.id,
              isSynced: true,
            }));
          }
        } catch (error) {
          console.error("Error syncing new route:", error);
        }
      }

      return newRoute;
    },
    [userId, updateRouteData]
  );

  /**
   * Update existing route with backend synchronization
   */
  const updateRoute = useCallback(
    async (routeId: string, updates: Partial<Route>) => {
      const route = routes.find((r) => r.id === routeId);

      // Update local state immediately
      updateRouteData(routeId, (route) => ({
        ...route,
        ...updates,
        updatedAt: now(),
        isSynced: false, // Mark as unsynced
      }));

      // Sync with backend if route exists there
      if (route?.backendId) {
        try {
          const backendData = convertRouteToBackendUpdate({
            ...route,
            ...updates,
          });
          await routesService.updateRoute(route.backendId, backendData);

          // Mark as synced after successful update
          updateRouteData(routeId, (r) => ({ ...r, isSynced: true }));
        } catch (error) {
          console.error("Error syncing route update:", error);
        }
      }
    },
    [routes, updateRouteData]
  );

  /**
   * Delete route from both local state and backend
   */
  const deleteRoute = useCallback(
    async (routeId: string) => {
      const route = routes.find((r) => r.id === routeId);

      // Delete from backend if it exists there
      if (route?.backendId) {
        try {
          await routesService.deleteRoute(route.backendId);
        } catch (error) {
          console.error("Error deleting route from backend:", error);
        }
      }

      // Remove from local state
      setRoutes((prev) => prev.filter((r) => r.id !== routeId));

      // Update active route if deleted route was active
      if (activeRouteId === routeId) {
        const remaining = routes.filter((r) => r.id !== routeId);
        setActiveRouteId(remaining.length > 0 ? remaining[0].id : null);
      }
    },
    [activeRouteId, routes]
  );

  /**
   * Duplicate an existing route
   */
  const duplicateRoute = useCallback(
    (routeId: string) => {
      const route = routes.find((r) => r.id === routeId);
      if (!route) return;

      const newRoute: Route = {
        ...route,
        id: generateRouteId(),
        backendId: undefined, // New copy starts as unsynced
        name: `${route.name} (Copy)`,
        createdAt: now(),
        updatedAt: now(),
        isSynced: false,
      };

      setRoutes((prev) => [...prev, newRoute]);
      setActiveRouteId(newRoute.id);
    },
    [routes]
  );

  /**
   * Add place to route with day assignment
   */
  const addPlaceToRoute = useCallback(
    (routeId: string, place: SavedPlace, dayNumber: number) => {
      updateRoutePlaces(routeId, (places) => {
        // Prevent duplicate places in same route
        if (places.some((p) => p.placeId === place.placeId)) return places;

        // Calculate order in day
        const orderInDay =
          places.filter((p) => p.dayNumber === dayNumber).length + 1;

        return [
          ...places,
          {
            placeId: place.placeId,
            dayNumber,
            orderInDay,
            displayName: place.displayName || "Unknown place",
            formattedAddress: place.formattedAddress,
            location: place.location,
          },
        ];
      });
    },
    [updateRoutePlaces]
  );

  /**
   * Remove place from route and reorder remaining places
   */
  const removePlaceFromRoute = useCallback(
    (routeId: string, placeId: string) => {
      updateRoutePlaces(routeId, (places) => {
        const removedPlace = places.find((p) => p.placeId === placeId);
        if (!removedPlace) return places;

        return places
          .filter((p) => p.placeId !== placeId)
          .map((p) =>
            p.dayNumber === removedPlace.dayNumber &&
            p.orderInDay > removedPlace.orderInDay
              ? { ...p, orderInDay: p.orderInDay - 1 } // Reorder remaining places
              : p
          );
      });
    },
    [updateRoutePlaces]
  );

  /**
   * Move place within route (change day or order)
   */
  const movePlaceInRoute = useCallback(
    (
      routeId: string,
      placeId: string,
      newDayNumber: number,
      newOrderInDay: number
    ) => {
      updateRoutePlaces(routeId, (places) => {
        const place = places.find((p) => p.placeId === placeId);
        if (!place) return places;

        const oldDay = place.dayNumber;
        const oldOrder = place.orderInDay;

        return places.map((p) => {
          if (p.placeId === placeId) {
            return { ...p, dayNumber: newDayNumber, orderInDay: newOrderInDay };
          }

          // Adjust order in old day
          if (p.dayNumber === oldDay && p.orderInDay > oldOrder) {
            return { ...p, orderInDay: p.orderInDay - 1 };
          }

          // Adjust order in new day
          if (p.dayNumber === newDayNumber && p.orderInDay >= newOrderInDay) {
            return { ...p, orderInDay: p.orderInDay + 1 };
          }

          return p;
        });
      });
    },
    [updateRoutePlaces]
  );

  /**
   * Add new day to route
   */
  const addDayToRoute = useCallback(
    (routeId: string) => {
      updateRouteData(routeId, (route) => ({ ...route, updatedAt: now() }));
    },
    [updateRouteData]
  );

  /**
   * Remove day from route and adjust remaining days
   */
  const removeDayFromRoute = useCallback(
    (routeId: string, dayNumber: number) => {
      updateRoutePlaces(routeId, (places) =>
        places
          .filter((p) => p.dayNumber !== dayNumber)
          .map((p) =>
            p.dayNumber > dayNumber ? { ...p, dayNumber: p.dayNumber - 1 } : p
          )
      );
    },
    [updateRoutePlaces]
  );

  /**
   * Deactivate current route (clear selection)
   */
  const deactivateRoute = useCallback(() => {
    setActiveRouteId(null);
  }, []);

  /**
   * Calculate statistics for a route
   */
  const getRouteStats = useCallback(
    (routeId: string) => {
      const route = routes.find((r) => r.id === routeId);
      if (!route) return null;
      return calculateRouteStats(route);
    },
    [routes]
  );

  /**
   * Synchronize all unsynced routes with backend
   */
  const syncAllRoutes = useCallback(async () => {
    if (!userId || syncing) return;

    setSyncing(true);
    try {
      const unsyncedRoutes = routes.filter((r) => !r.isSynced);

      for (const route of unsyncedRoutes) {
        try {
          if (!route.backendId) {
            // Create new route in backend
            const backendData = convertRouteToBackendCreate(route, userId);
            const response = await routesService.createRoute(backendData);

            if (response.success && response.data) {
              updateRouteData(route.id, (r) => ({
                ...r,
                backendId: response.data!.id,
                isSynced: true,
              }));
            }
          } else {
            // Update existing route in backend
            const backendData = convertRouteToBackendUpdate(route);
            await routesService.updateRoute(route.backendId, backendData);

            updateRouteData(route.id, (r) => ({ ...r, isSynced: true }));
          }
        } catch (error) {
          console.error(`Error syncing route ${route.id}:`, error);
        }
      }
    } finally {
      setSyncing(false);
    }
  }, [routes, userId, syncing, updateRouteData]);

  /**
   * Count unsynced routes for UI indicator
   */
  const getUnsyncedCount = useCallback(() => {
    return routes.filter((r) => !r.isSynced).length;
  }, [routes]);

  return {
    routes,
    activeRoute,
    activeRouteId,
    loaded,
    syncing,
    unsyncedCount: getUnsyncedCount(),
    setActiveRouteId,
    setUserId,
    createRoute,
    updateRoute,
    deleteRoute,
    duplicateRoute,
    addPlaceToRoute,
    removePlaceFromRoute,
    movePlaceInRoute,
    addDayToRoute,
    removeDayFromRoute,
    getRouteStats,
    deactivateRoute,
    syncAllRoutes,
  };
};
