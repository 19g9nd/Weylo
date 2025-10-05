"use client";
import { useState, useEffect, useCallback } from "react";
import { Route, RoutePlace } from "../types/sidebar";
import { SavedPlace } from "../types/map";
import { calculateRouteStats } from "../utils/routeUtils";

const ROUTES_STORAGE_KEY = "weylo_routes";
const ACTIVE_ROUTE_KEY = "weylo_active_route";

// Generate unique route ID
const generateRouteId = () =>
  `route_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
const now = () => new Date();

export const useRoutes = () => {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [activeRouteId, setActiveRouteId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const activeRoute = routes.find((r) => r.id === activeRouteId) || null;

  // Load routes from localStorage on initial render
  useEffect(() => {
    const loadRoutes = () => {
      try {
        const stored = localStorage.getItem(ROUTES_STORAGE_KEY);
        const activeId = localStorage.getItem(ACTIVE_ROUTE_KEY);

        if (stored) {
          const parsed = JSON.parse(stored) as Route[];
          // Convert date strings back to Date objects
          const routesWithDates = parsed.map((r) => ({
            ...r,
            createdAt: new Date(r.createdAt),
            updatedAt: new Date(r.updatedAt),
            startDate: r.startDate ? new Date(r.startDate) : undefined,
            endDate: r.endDate ? new Date(r.endDate) : undefined,
          }));
          setRoutes(routesWithDates);
        }

        if (activeId) setActiveRouteId(activeId);
      } catch (error) {
        console.error("Error loading routes from localStorage:", error);
        // Initialize with empty array on error
        setRoutes([]);
      } finally {
        setLoaded(true);
      }
    };

    loadRoutes();
  }, []);

  // Save routes to localStorage whenever routes change
  useEffect(() => {
    if (!loaded) return; // Don't save until initial load is complete

    try {
      localStorage.setItem(ROUTES_STORAGE_KEY, JSON.stringify(routes));
    } catch (e) {
      console.error("Error saving routes to localStorage:", e);
    }
  }, [routes, loaded]);

  // Save active route ID to localStorage whenever it changes
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

  // Universal route update function
  const updateRouteData = useCallback(
    (routeId: string, updater: (route: Route) => Route) => {
      setRoutes((prev) =>
        prev.map((route) => (route.id === routeId ? updater(route) : route))
      );
    },
    []
  );

  // Universal route places update function
  const updateRoutePlaces = useCallback(
    (routeId: string, updater: (places: RoutePlace[]) => RoutePlace[]) => {
      updateRouteData(routeId, (route) => ({
        ...route,
        places: updater(route.places),
        updatedAt: now(),
      }));
    },
    [updateRouteData]
  );

  // Create new route
  const createRoute = useCallback(
    (name: string, startDate?: Date, endDate?: Date) => {
      const newRoute: Route = {
        id: generateRouteId(),
        name,
        places: [],
        startDate,
        endDate,
        createdAt: now(),
        updatedAt: now(),
      };
      setRoutes((prev) => [...prev, newRoute]);
      setActiveRouteId(newRoute.id);
      return newRoute;
    },
    []
  );

  // Update route properties
  const updateRoute = useCallback(
    (routeId: string, updates: Partial<Route>) => {
      updateRouteData(routeId, (route) => ({
        ...route,
        ...updates,
        updatedAt: now(),
      }));
    },
    [updateRouteData]
  );

  // Delete route
  const deleteRoute = useCallback(
    (routeId: string) => {
      setRoutes((prev) => prev.filter((r) => r.id !== routeId));
      if (activeRouteId === routeId) {
        // After deleting active route, select first available route or null
        setActiveRouteId((prev) => {
          const remaining = routes.filter((r) => r.id !== routeId);
          return remaining.length > 0 ? remaining[0].id : null;
        });
      }
    },
    [activeRouteId, routes]
  );

  // Duplicate route
  const duplicateRoute = useCallback(
    (routeId: string) => {
      const route = routes.find((r) => r.id === routeId);
      if (!route) return;

      const newRoute: Route = {
        ...route,
        id: generateRouteId(),
        name: `${route.name} (Copy)`,
        createdAt: now(),
        updatedAt: now(),
      };
      setRoutes((prev) => [...prev, newRoute]);
      setActiveRouteId(newRoute.id);
    },
    [routes]
  );

  // Add place to route
  const addPlaceToRoute = useCallback(
    (routeId: string, place: SavedPlace, dayNumber: number) => {
      updateRoutePlaces(routeId, (places) => {
        // Check if place already exists in route
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

  // Remove place from route
  const removePlaceFromRoute = useCallback(
    (routeId: string, placeId: string) => {
      updateRoutePlaces(routeId, (places) => {
        const removedPlace = places.find((p) => p.placeId === placeId);
        if (!removedPlace) return places;

        // Remove place and adjust orders in the same day
        return places
          .filter((p) => p.placeId !== placeId)
          .map((p) =>
            p.dayNumber === removedPlace.dayNumber &&
            p.orderInDay > removedPlace.orderInDay
              ? { ...p, orderInDay: p.orderInDay - 1 }
              : p
          );
      });
    },
    [updateRoutePlaces]
  );

  // Deactivate current route
  const deactivateRoute = useCallback(() => {
    setActiveRouteId(null);
  }, []);

  // Move place within route (change day or order)
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

          // Adjust orders in old day
          if (p.dayNumber === oldDay && p.orderInDay > oldOrder) {
            return { ...p, orderInDay: p.orderInDay - 1 };
          }

          // Adjust orders in new day
          if (p.dayNumber === newDayNumber && p.orderInDay >= newOrderInDay) {
            return { ...p, orderInDay: p.orderInDay + 1 };
          }

          return p;
        });
      });
    },
    [updateRoutePlaces]
  );

  // Add new day to route
  const addDayToRoute = useCallback(
    (routeId: string) => {
      updateRouteData(routeId, (route) => ({ ...route, updatedAt: now() }));
    },
    [updateRouteData]
  );

  // Remove day from route (and all its places)
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

  // Calculate route statistics
  const getRouteStats = useCallback(
    (routeId: string) => {
      const route = routes.find((r) => r.id === routeId);
      if (!route) return null;

      return calculateRouteStats(route);
    },
    [routes]
  );

  return {
    routes,
    activeRoute,
    activeRouteId,
    setActiveRouteId,
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
    loaded,
  };
};
