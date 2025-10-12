// import { useState, useCallback } from "react";
// import { RoutePlace } from "../types/sidebar";
// import { SavedPlace } from "../types/map";
// import { routeDestinationsService } from "../services/routeDestinationsService";

// interface UseRouteDestinationsProps {
//   onPlacesUpdate: (routeId: string, places: RoutePlace[]) => void;
//   onError?: (error: string) => void;
// }

// export const useRouteDestinations = ({
//   onPlacesUpdate,
//   onError,
// }: UseRouteDestinationsProps) => {
//   const [loading, setLoading] = useState(false);

//   /**
//    * Load all destinations for a route
//    */
//   const loadRouteDestinations = useCallback(
//     async (backendRouteId: number) => {
//       if (isNaN(backendRouteId) || backendRouteId <= 0) {
//         const error = `Invalid route ID: ${backendRouteId}`;
//         console.error(error);
//         onError?.(error);
//         return { success: false, error };
//       }

//       setLoading(true);
//       try {
//         console.log(`🔄 Loading destinations for route ${backendRouteId}`);
        
//         const result = await routeDestinationsService.getRouteDestinations(
//           backendRouteId
//         );

//         if (!result.success || !result.data) {
//           throw new Error(result.error || "Failed to load route destinations");
//         }

//         const routePlaces: RoutePlace[] = result.data.map((rd) => ({
//           placeId: rd.destination.googlePlaceId,
//           displayName: rd.destination.name,
//           formattedAddress: rd.destination.cachedAddress || "",
//           location: {
//             lat: rd.destination.latitude,
//             lng: rd.destination.longitude,
//           },
//           dayNumber: rd.dayNumber,
//           orderInDay: rd.orderInDay,
//           backendId: rd.destinationId,
//           routeDestinationId: rd.id,
//           notes: rd.userNotes,
//         }));

//         console.log(`✅ Loaded ${routePlaces.length} destinations`);
//         return { success: true, places: routePlaces };
//       } catch (error) {
//         const errorMsg =
//           error instanceof Error ? error.message : "Failed to load destinations";
//         console.error("❌ Error in loadRouteDestinations:", error);
//         onError?.(errorMsg);
//         return { success: false, error: errorMsg };
//       } finally {
//         setLoading(false);
//       }
//     },
//     [onError]
//   );

//   /**
//    * Add place to route
//    * @param backendRouteId - Backend route ID (number)
//    * @param place - Place to add (SavedPlace with backendId)
//    * @param dayNumber - Day number
//    * @param orderInDay - Order in day
//    */
//   const addPlaceToRoute = useCallback(
//     async (
//       backendRouteId: number,
//       place: SavedPlace,
//       dayNumber: number,
//       orderInDay: number
//     ) => {
//       if (isNaN(backendRouteId) || backendRouteId <= 0) {
//         const error = `Invalid route ID: ${backendRouteId}`;
//         console.error(error);
//         onError?.(error);
//         return { success: false, error };
//       }

//       if (!place.backendId) {
//         const error = "Place has no backend ID";
//         console.error(error);
//         onError?.(error);
//         return { success: false, error };
//       }

//       setLoading(true);
//       try {
//         console.log("➕ Adding place to route:", {
//           backendRouteId,
//           destinationId: place.backendId,
//           dayNumber,
//           orderInDay,
//         });

//         const result = await routeDestinationsService.addDestinationToRoute(
//           backendRouteId,
//           {
//             destinationId: place.backendId,
//             dayNumber,
//             orderInDay,
//           }
//         );

//         if (!result.success || !result.data) {
//           throw new Error(result.error || "Failed to add destination to route");
//         }

//         const newPlace: RoutePlace = {
//           placeId: result.data.destination.googlePlaceId,
//           displayName: result.data.destination.name,
//           formattedAddress: result.data.destination.cachedAddress || "",
//           location: {
//             lat: result.data.destination.latitude,
//             lng: result.data.destination.longitude,
//           },
//           dayNumber: result.data.dayNumber,
//           orderInDay: result.data.orderInDay,
//           backendId: result.data.destinationId,
//           routeDestinationId: result.data.id,
//           notes: result.data.userNotes,
//         };

//         console.log("✅ Place added successfully");
//         return { success: true, place: newPlace };
//       } catch (error) {
//         const errorMsg =
//           error instanceof Error ? error.message : "Failed to add place";
//         console.error("❌ Error in addPlaceToRoute:", error);
//         onError?.(errorMsg);
//         return { success: false, error: errorMsg };
//       } finally {
//         setLoading(false);
//       }
//     },
//     [onError]
//   );

//   /**
//    * Remove place from route
//    * @param backendRouteId - Backend route ID
//    * @param routeDestinationId - RouteDestination ID to remove
//    */
//   const removePlaceFromRoute = useCallback(
//     async (backendRouteId: number, routeDestinationId: number) => {
//       if (isNaN(backendRouteId) || backendRouteId <= 0) {
//         const error = `Invalid route ID: ${backendRouteId}`;
//         console.error(error);
//         onError?.(error);
//         return { success: false, error };
//       }

//       if (isNaN(routeDestinationId) || routeDestinationId <= 0) {
//         const error = `Invalid route destination ID: ${routeDestinationId}`;
//         console.error(error);
//         onError?.(error);
//         return { success: false, error };
//       }

//       setLoading(true);
//       try {
//         console.log("🗑️ Removing place from route:", {
//           backendRouteId,
//           routeDestinationId,
//         });

//         const result = await routeDestinationsService.removeDestinationFromRoute(
//           backendRouteId,
//           routeDestinationId
//         );

//         if (!result.success) {
//           throw new Error(result.error || "Failed to remove destination");
//         }

//         console.log("✅ Place removed successfully");
//         return { success: true };
//       } catch (error) {
//         const errorMsg =
//           error instanceof Error ? error.message : "Failed to remove place";
//         console.error("❌ Error in removePlaceFromRoute:", error);
//         onError?.(errorMsg);
//         return { success: false, error: errorMsg };
//       } finally {
//         setLoading(false);
//       }
//     },
//     [onError]
//   );

//   /**
//    * Update place in route (change day/order/notes)
//    * @param routeDestinationId - RouteDestination ID
//    * @param updates - Fields to update
//    */
//   const updatePlaceInRoute = useCallback(
//     async (
//       routeDestinationId: number,
//       updates: { dayNumber?: number; orderInDay?: number; notes?: string }
//     ) => {
//       if (isNaN(routeDestinationId) || routeDestinationId <= 0) {
//         const error = `Invalid route destination ID: ${routeDestinationId}`;
//         console.error(error);
//         onError?.(error);
//         return { success: false, error };
//       }

//       setLoading(true);
//       try {
//         console.log("✏️ Updating place in route:", {
//           routeDestinationId,
//           updates,
//         });

//         const result = await routeDestinationsService.updateRouteDestination(
//           routeDestinationId,
//           updates
//         );

//         if (!result.success) {
//           throw new Error(result.error || "Failed to update place");
//         }

//         console.log("✅ Place updated successfully");
//         return { success: true };
//       } catch (error) {
//         const errorMsg =
//           error instanceof Error ? error.message : "Failed to update place";
//         console.error("❌ Error in updatePlaceInRoute:", error);
//         onError?.(errorMsg);
//         return { success: false, error: errorMsg };
//       } finally {
//         setLoading(false);
//       }
//     },
//     [onError]
//   );

//   return {
//     loading,
//     loadRouteDestinations,
//     addPlaceToRoute,
//     removePlaceFromRoute,
//     updatePlaceInRoute,
//   };
// };