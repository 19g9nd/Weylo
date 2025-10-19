"use client";
import { useState, useEffect, useCallback } from "react";
import { Route, RoutePlace } from "../types/sidebar";
import { Place } from "../types/place";
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
    (routeId: string, place: Place, dayNumber: number) => {
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


// "use client";
// import { useState, useEffect, useCallback } from "react";
// import { Route, RoutePlace } from "../types/sidebar";
// import { Place } from "../types/place";
// import { useRouteDestinations } from "./useRouteDestinations";
// import {
//   calculateRouteStats,
//   convertBackendToRoute,
//   convertRouteToBackendCreate,
//   convertRouteToBackendUpdate,
// } from "../utils/routeUtils";
// import { routesService } from "../services/routesServices";

// // Local storage keys for persistence
// const ROUTES_STORAGE_KEY = "weylo_routes";
// const ACTIVE_ROUTE_KEY = "weylo_active_route";

// // Utility functions
// const generateRouteId = () =>
//   `route_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
// const now = () => new Date();

// /**
//  * Custom hook for managing routes with local storage persistence and backend synchronization
//  */
// export const useRoutes = () => {
//   const [routes, setRoutes] = useState<Route[]>([]);
//   const [activeRouteId, setActiveRouteId] = useState<string | null>(null);
//   const [loaded, setLoaded] = useState(false);
//   const [syncing, setSyncing] = useState(false);
//   const [userId, setUserId] = useState<number | null>(null);
//   const [error, setError] = useState<string | null>(null);
  
//   // Derive active route from routes and activeRouteId
//   const activeRoute = routes.find((r) => r.id === activeRouteId) || null;

//   // === ROUTE DESTINATIONS INTEGRATION ===

//   /**
//    * Handle places updates from backend destinations service
//    */
//   const handlePlacesUpdate = useCallback(
//     (routeId: string, newPlaces: RoutePlace[]) => {
//       setRoutes((prev) =>
//         prev.map((route) => {
//           if (route.id === routeId) {
//             return {
//               ...route,
//               places: newPlaces, // Replace with new places from backend
//               updatedAt: new Date(),
//               isSynced: true,
//             };
//           }
//           return route;
//         })
//       );
//     },
//     []
//   );

//   /**
//    * Handle errors from destinations service
//    */
//   const handleError = useCallback((errorMsg: string) => {
//     setError(errorMsg);
//     setTimeout(() => setError(null), 5000);
//   }, []);

//   // Initialize route destinations service
//   const routeDestinations = useRouteDestinations({
//     onPlacesUpdate: handlePlacesUpdate,
//     onError: handleError,
//   });

//   // === ROUTES LOADING AND PERSISTENCE ===

//   /**
//    * Load routes from backend with localStorage fallback
//    */
//   useEffect(() => {
//     const loadRoutes = async () => {
//       if (loaded) return;
      
//       try {
//         console.log("🔄 Loading routes...");
//         const backendResult = await routesService.getMyRoutes();

//         if (backendResult.success && backendResult.data) {
//           const backendRoutes: Route[] = backendResult.data.map(
//             convertBackendToRoute
//           );

//           console.log("📦 Backend routes loaded:", backendRoutes.length);

//           // ИСПРАВЛЕНИЕ: Load destinations for each backend route
//           for (const route of backendRoutes) {
//             if (route.backendId) {
//               console.log(`🔄 Loading destinations for route ${route.backendId}`);
              
//               const result = await routeDestinations.loadRouteDestinations(route.backendId);
              
//               if (result.success && result.places) {
//                 // Update route with loaded places
//                 handlePlacesUpdate(route.id, result.places);
//               }
//             }
//           }

//           // Load unsynced local routes from localStorage
//           const stored = localStorage.getItem(ROUTES_STORAGE_KEY);
//           let localRoutes: Route[] = [];

//           if (stored) {
//             const parsed = JSON.parse(stored);
//             localRoutes = parsed.map((r: Route) => ({
//               ...r,
//               createdAt: new Date(r.createdAt),
//               updatedAt: new Date(r.updatedAt),
//               startDate: r.startDate ? new Date(r.startDate) : undefined,
//               endDate: r.endDate ? new Date(r.endDate) : undefined,
//             }));
//           }

//           // Combine backend routes with unsynced local routes
//           const unsyncedLocal = localRoutes.filter((lr) => !lr.isSynced && !lr.backendId);
//           const mergedRoutes = [...backendRoutes, ...unsyncedLocal];

//           setRoutes(mergedRoutes);
//           console.log("✅ Routes loaded:", mergedRoutes.length);
//         } else {
//           // Fallback to localStorage only
//           const stored = localStorage.getItem(ROUTES_STORAGE_KEY);
//           if (stored) {
//             const parsed = JSON.parse(stored);
//             const routesWithDates = parsed.map((r: Route) => ({
//               ...r,
//               createdAt: new Date(r.createdAt),
//               updatedAt: new Date(r.updatedAt),
//               startDate: r.startDate ? new Date(r.startDate) : undefined,
//               endDate: r.endDate ? new Date(r.endDate) : undefined,
//             }));
//             setRoutes(routesWithDates);
//           }
//         }

//         // Restore active route selection
//         const activeId = localStorage.getItem(ACTIVE_ROUTE_KEY);
//         if (activeId) setActiveRouteId(activeId);
        
//       } catch (error) {
//         console.error("❌ Error loading routes:", error);
//         handleError("Failed to load routes");

//         // Final fallback to localStorage
//         try {
//           const stored = localStorage.getItem(ROUTES_STORAGE_KEY);
//           if (stored) {
//             const parsed = JSON.parse(stored);
//             const routesWithDates = parsed.map((r: Route) => ({
//               ...r,
//               createdAt: new Date(r.createdAt),
//               updatedAt: new Date(r.updatedAt),
//               startDate: r.startDate ? new Date(r.startDate) : undefined,
//               endDate: r.endDate ? new Date(r.endDate) : undefined,
//             }));
//             setRoutes(routesWithDates);
//           }
//         } catch (e) {
//           console.error("Error loading from localStorage:", e);
//           setRoutes([]);
//         }
//       } finally {
//         setLoaded(true);
//       }
//     };

//     loadRoutes();
//   }, [loaded, handlePlacesUpdate, handleError]);

//   /**
//    * Persist routes to localStorage
//    */
//   useEffect(() => {
//     if (!loaded) return;
//     try {
//       localStorage.setItem(ROUTES_STORAGE_KEY, JSON.stringify(routes));
//     } catch (e) {
//       console.error("Error saving routes to localStorage:", e);
//     }
//   }, [routes, loaded]);

//   /**
//    * Persist active route selection
//    */
//   useEffect(() => {
//     if (!loaded) return;
//     try {
//       if (activeRouteId) {
//         localStorage.setItem(ACTIVE_ROUTE_KEY, activeRouteId);
//       } else {
//         localStorage.removeItem(ACTIVE_ROUTE_KEY);
//       }
//     } catch (e) {
//       console.error("Error saving active route to localStorage:", e);
//     }
//   }, [activeRouteId, loaded]);

//   // === ROUTE MANAGEMENT HELPERS ===

//   /**
//    * Helper to update route data
//    */
//   const updateRouteData = useCallback(
//     (routeId: string, updater: (route: Route) => Route) => {
//       setRoutes((prev) =>
//         prev.map((route) => {
//           if (route.id === routeId) {
//             const updated = updater(route);
//             if (updated.backendId) {
//               updated.isSynced = false;
//             }
//             return updated;
//           }
//           return route;
//         })
//       );
//     },
//     []
//   );

//   /**
//    * Helper to update route places
//    */
//   const updateRoutePlaces = useCallback(
//     (routeId: string, updater: (places: RoutePlace[]) => RoutePlace[]) => {
//       updateRouteData(routeId, (route) => ({
//         ...route,
//         places: updater(route.places),
//         updatedAt: now(),
//         isSynced: false,
//       }));
//     },
//     [updateRouteData]
//   );

//   // === ROUTE CRUD OPERATIONS ===

//   /**
//    * Create a new route
//    */
//   const createRoute = useCallback(
//     async (name: string, startDate?: Date, endDate?: Date) => {
//       const newRoute: Route = {
//         id: generateRouteId(),
//         name,
//         places: [],
//         startDate,
//         endDate,
//         status: "draft",
//         createdAt: now(),
//         updatedAt: now(),
//         isSynced: false,
//       };

//       setRoutes((prev) => [...prev, newRoute]);
//       setActiveRouteId(newRoute.id);

//       // ИСПРАВЛЕНИЕ: Sync with backend
//       if (userId) {
//         try {
//           const backendData = convertRouteToBackendCreate(newRoute, userId);
//           const response = await routesService.createRoute(backendData);

//           if (response.success && response.data) {
//             console.log("✅ Route created on backend:", response.data.id);
            
//             // ВАЖНО: Update with backend ID
//             setRoutes((prev) =>
//               prev.map((r) =>
//                 r.id === newRoute.id
//                   ? {
//                       ...r,
//                       backendId: response.data!.id,
//                       isSynced: true,
//                     }
//                   : r
//               )
//             );
//           }
//         } catch (error) {
//           console.error("❌ Error syncing new route:", error);
//           handleError("Failed to sync route with backend");
//         }
//       }

//       return newRoute;
//     },
//     [userId, handleError]
//   );

//   /**
//    * Update existing route
//    */
//   const updateRoute = useCallback(
//     async (routeId: string, updates: Partial<Route>) => {
//       const route = routes.find((r) => r.id === routeId);

//       // Update local state immediately
//       updateRouteData(routeId, (route) => ({
//         ...route,
//         ...updates,
//         updatedAt: now(),
//         isSynced: false,
//       }));

//       // Sync with backend
//       if (route?.backendId) {
//         try {
//           const backendData = convertRouteToBackendUpdate({
//             ...route,
//             ...updates,
//           });
//           await routesService.updateRoute(route.backendId, backendData);
          
//           updateRouteData(routeId, (r) => ({ ...r, isSynced: true }));
//         } catch (error) {
//           console.error("Error syncing route update:", error);
//         }
//       }
//     },
//     [routes, updateRouteData]
//   );

//   /**
//    * Delete route
//    */
//   const deleteRoute = useCallback(
//     async (routeId: string) => {
//       const route = routes.find((r) => r.id === routeId);

//       if (route?.backendId) {
//         try {
//           await routesService.deleteRoute(route.backendId);
//         } catch (error) {
//           console.error("Error deleting route from backend:", error);
//         }
//       }

//       setRoutes((prev) => prev.filter((r) => r.id !== routeId));

//       if (activeRouteId === routeId) {
//         const remaining = routes.filter((r) => r.id !== routeId);
//         setActiveRouteId(remaining.length > 0 ? remaining[0].id : null);
//       }
//     },
//     [activeRouteId, routes]
//   );

//   /**
//    * Duplicate route
//    */
//   const duplicateRoute = useCallback(
//     (routeId: string) => {
//       const route = routes.find((r) => r.id === routeId);
//       if (!route) return;

//       const newRoute: Route = {
//         ...route,
//         id: generateRouteId(),
//         backendId: undefined,
//         name: `${route.name} (Copy)`,
//         createdAt: now(),
//         updatedAt: now(),
//         isSynced: false,
//       };

//       setRoutes((prev) => [...prev, newRoute]);
//       setActiveRouteId(newRoute.id);
//     },
//     [routes]
//   );

//   // === PLACE MANAGEMENT ===

//   /**
//    * Add place to route with backend sync
//    */
//   const addPlaceToRoute = useCallback(
//     async (routeId: string, place: Place, dayNumber: number) => {
//       const route = routes.find((r) => r.id === routeId);
      
//       if (!route) {
//         handleError("Route not found");
//         return;
//       }

//       // ИСПРАВЛЕНИЕ: Check for backendId
//       if (!route.backendId) {
//         handleError("Route is not synced with backend. Please save the route first.");
//         return;
//       }

//       // Check for duplicates
//       if (route.places.some((p) => p.placeId === place.placeId)) {
//         handleError("Place already in route");
//         return;
//       }

//       // Calculate order in day
//       const dayPlaces = route.places.filter((p) => p.dayNumber === dayNumber);
//       const orderInDay = dayPlaces.length + 1;

//       console.log("➕ Adding place to route:", {
//         routeId: route.id,
//         backendRouteId: route.backendId,
//         place: place.displayName,
//         dayNumber,
//         orderInDay,
//       });

//       // ИСПРАВЛЕНИЕ: Use backend API with backendId
//       const result = await routeDestinations.addPlaceToRoute(
//         route.backendId, // ← Pass backend ID (number)
//         place,
//         dayNumber,
//         orderInDay
//       );

//       if (!result.success) {
//         handleError(result.error || "Failed to add place");
//         return;
//       }

//       // Update local state
//       if (result.place) {
//         setRoutes((prev) =>
//           prev.map((r) =>
//             r.id === routeId
//               ? {
//                   ...r,
//                   places: [...r.places, result.place!],
//                   updatedAt: new Date(),
//                   isSynced: true,
//                 }
//               : r
//           )
//         );
//       }
//     },
//     [routes, routeDestinations, handleError]
//   );

//   /**
//    * Remove place from route
//    */
//   const removePlaceFromRoute = useCallback(
//     async (routeId: string, placeId: string) => {
//       const route = routes.find((r) => r.id === routeId);
//       if (!route) return;

//       const place = route.places.find((p) => p.placeId === placeId);
//       if (!place) return;

//       // Use backend API for synced routes
//       if (route.backendId && place.routeDestinationId) {
//         const result = await routeDestinations.removePlaceFromRoute(
//           route.backendId,
//           place.routeDestinationId
//         );

//         if (result.success) {
//           setRoutes((prev) =>
//             prev.map((r) => {
//               if (r.id !== routeId) return r;

//               const removedPlace = r.places.find((p) => p.placeId === placeId);
//               if (!removedPlace) return r;

//               return {
//                 ...r,
//                 places: r.places
//                   .filter((p) => p.placeId !== placeId)
//                   .map((p) =>
//                     p.dayNumber === removedPlace.dayNumber &&
//                     p.orderInDay > removedPlace.orderInDay
//                       ? { ...p, orderInDay: p.orderInDay - 1 }
//                       : p
//                   ),
//                 updatedAt: new Date(),
//               };
//             })
//           );
//         }
//       } else {
//         // Local removal for unsynced routes
//         setRoutes((prev) =>
//           prev.map((r) => {
//             if (r.id !== routeId) return r;

//             const removedPlace = r.places.find((p) => p.placeId === placeId);
//             if (!removedPlace) return r;

//             return {
//               ...r,
//               places: r.places
//                 .filter((p) => p.placeId !== placeId)
//                 .map((p) =>
//                   p.dayNumber === removedPlace.dayNumber &&
//                   p.orderInDay > removedPlace.orderInDay
//                     ? { ...p, orderInDay: p.orderInDay - 1 }
//                     : p
//                 ),
//               updatedAt: new Date(),
//             };
//           })
//         );
//       }
//     },
//     [routes, routeDestinations]
//   );

//   /**
//    * Move place within route
//    */
//   const movePlaceInRoute = useCallback(
//     async (
//       routeId: string,
//       placeId: string,
//       newDayNumber: number,
//       newOrderInDay: number
//     ) => {
//       const route = routes.find((r) => r.id === routeId);
//       if (!route) return;

//       const place = route.places.find((p) => p.placeId === placeId);
//       if (!place) return;

//       // Use backend API for synced routes
//       if (place.routeDestinationId) {
//         const result = await routeDestinations.updatePlaceInRoute(
//           place.routeDestinationId,
//           { dayNumber: newDayNumber, orderInDay: newOrderInDay }
//         );

//         if (result.success) {
//           setRoutes((prev) =>
//             prev.map((r) => {
//               if (r.id !== routeId) return r;

//               const oldDay = place.dayNumber;
//               const oldOrder = place.orderInDay;

//               return {
//                 ...r,
//                 places: r.places.map((p) => {
//                   if (p.placeId === placeId) {
//                     return {
//                       ...p,
//                       dayNumber: newDayNumber,
//                       orderInDay: newOrderInDay,
//                     };
//                   }
//                   if (p.dayNumber === oldDay && p.orderInDay > oldOrder) {
//                     return { ...p, orderInDay: p.orderInDay - 1 };
//                   }
//                   if (
//                     p.dayNumber === newDayNumber &&
//                     p.orderInDay >= newOrderInDay
//                   ) {
//                     return { ...p, orderInDay: p.orderInDay + 1 };
//                   }
//                   return p;
//                 }),
//                 updatedAt: new Date(),
//               };
//             })
//           );
//         }
//       } else {
//         // Local move for unsynced routes
//         setRoutes((prev) =>
//           prev.map((r) => {
//             if (r.id !== routeId) return r;

//             const oldDay = place.dayNumber;
//             const oldOrder = place.orderInDay;

//             return {
//               ...r,
//               places: r.places.map((p) => {
//                 if (p.placeId === placeId) {
//                   return {
//                     ...p,
//                     dayNumber: newDayNumber,
//                     orderInDay: newOrderInDay,
//                   };
//                 }
//                 if (p.dayNumber === oldDay && p.orderInDay > oldOrder) {
//                   return { ...p, orderInDay: p.orderInDay - 1 };
//                 }
//                 if (
//                   p.dayNumber === newDayNumber &&
//                   p.orderInDay >= newOrderInDay
//                 ) {
//                   return { ...p, orderInDay: p.orderInDay + 1 };
//                 }
//                 return p;
//               }),
//               updatedAt: new Date(),
//             };
//           })
//         );
//       }
//     },
//     [routes, routeDestinations]
//   );

//   // === DAY MANAGEMENT ===

//   const addDayToRoute = useCallback(
//     (routeId: string) => {
//       updateRouteData(routeId, (route) => ({ ...route, updatedAt: now() }));
//     },
//     [updateRouteData]
//   );

//   const removeDayFromRoute = useCallback(
//     (routeId: string, dayNumber: number) => {
//       updateRoutePlaces(routeId, (places) =>
//         places
//           .filter((p) => p.dayNumber !== dayNumber)
//           .map((p) =>
//             p.dayNumber > dayNumber ? { ...p, dayNumber: p.dayNumber - 1 } : p
//           )
//       );
//     },
//     [updateRoutePlaces]
//   );

//   // === UTILITY OPERATIONS ===

//   const deactivateRoute = useCallback(() => {
//     setActiveRouteId(null);
//   }, []);

//   const getRouteStats = useCallback(
//     (routeId: string) => {
//       const route = routes.find((r) => r.id === routeId);
//       if (!route) return null;
//       return calculateRouteStats(route);
//     },
//     [routes]
//   );

//   const syncAllRoutes = useCallback(async () => {
//     if (!userId || syncing) return;

//     setSyncing(true);
//     try {
//       const unsyncedRoutes = routes.filter((r) => !r.isSynced);

//       for (const route of unsyncedRoutes) {
//         try {
//           if (!route.backendId) {
//             const backendData = convertRouteToBackendCreate(route, userId);
//             const response = await routesService.createRoute(backendData);

//             if (response.success && response.data) {
//               updateRouteData(route.id, (r) => ({
//                 ...r,
//                 backendId: response.data!.id,
//                 isSynced: true,
//               }));
//             }
//           } else {
//             const backendData = convertRouteToBackendUpdate(route);
//             await routesService.updateRoute(route.backendId, backendData);
//             updateRouteData(route.id, (r) => ({ ...r, isSynced: true }));
//           }
//         } catch (error) {
//           console.error(`Error syncing route ${route.id}:`, error);
//         }
//       }
//     } finally {
//       setSyncing(false);
//     }
//   }, [routes, userId, syncing, updateRouteData]);

//   const getUnsyncedCount = useCallback(() => {
//     return routes.filter((r) => !r.isSynced).length;
//   }, [routes]);

//   return {
//     routes,
//     activeRoute,
//     activeRouteId,
//     loaded,
//     syncing,
//     error,
//     unsyncedCount: getUnsyncedCount(),
//     destinationsLoading: routeDestinations.loading,
//     setActiveRouteId,
//     setUserId,
//     createRoute,
//     updateRoute,
//     deleteRoute,
//     duplicateRoute,
//     addPlaceToRoute,
//     removePlaceFromRoute,
//     movePlaceInRoute,
//     addDayToRoute,
//     removeDayFromRoute,
//     getRouteStats,
//     deactivateRoute,
//     syncAllRoutes,
//   };
// };