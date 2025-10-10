import { Route, RoutePlace, RouteDay, BackendRoute } from "../types/sidebar";

/**
 * Group route places by day number
 */
export function groupPlacesByDay(
  places: RoutePlace[],
  startDate?: Date
): RouteDay[] {
  const daysMap = new Map<number, RoutePlace[]>();

  places.forEach((place) => {
    if (!daysMap.has(place.dayNumber)) {
      daysMap.set(place.dayNumber, []);
    }
    daysMap.get(place.dayNumber)!.push(place);
  });

  const days: RouteDay[] = Array.from(daysMap.entries()).map(
    ([dayNumber, dayPlaces]) => {
      let date: Date | undefined;
      if (startDate) {
        date = new Date(startDate);
        date.setDate(date.getDate() + dayNumber - 1);
      }

      return {
        dayNumber,
        places: dayPlaces.sort((a, b) => a.orderInDay - b.orderInDay),
        date,
      };
    }
  );

  return days.sort((a, b) => a.dayNumber - b.dayNumber);
}

/**
 * Calculate route statistics
 */
export function calculateRouteStats(route: Route) {
  const days = groupPlacesByDay(route.places);
  const totalDays = days.length;
  const totalPlaces = route.places.length;
  const avgPlacesPerDay = totalDays > 0 ? totalPlaces / totalDays : 0;

  let duration: number | null = null;
  if (route.startDate && route.endDate) {
    const diffTime = route.endDate.getTime() - route.startDate.getTime();
    duration = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }

  return {
    totalDays,
    totalPlaces,
    avgPlacesPerDay: Math.round(avgPlacesPerDay * 10) / 10,
    duration,
  };
}

/**
 * Validate route dates
 */
export function validateRouteDates(
  startDate?: Date,
  endDate?: Date
): string | null {
  if (!startDate || !endDate) return null;

  if (endDate < startDate) {
    return "End date must be after start date";
  }

  const diffDays = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diffDays > 365) {
    return "Route cannot be longer than one year";
  }

  return null;
}

/**
 * Format date for display
 */
export function formatDate(date?: Date, locale: string = "en-US"): string {
  if (!date) return "";

  return date.toLocaleDateString(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Format short date (without year if current year)
 */
export function formatShortDate(date?: Date, locale: string = "en-US"): string {
  if (!date) return "";

  const isCurrentYear = date.getFullYear() === new Date().getFullYear();

  return date.toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
    ...(isCurrentYear ? {} : { year: "numeric" }),
  });
}

/**
 * Check if route is currently active (today is between start and end dates)
 */
export function isRouteActive(route: Route): boolean {
  if (!route.startDate || !route.endDate) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return today >= route.startDate && today <= route.endDate;
}

/**
 * Check if route is upcoming (starts in the future)
 */
export function isRouteUpcoming(route: Route): boolean {
  if (!route.startDate) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return route.startDate > today;
}

/**
 * Check if route is past (ended in the past)
 */
export function isRoutePast(route: Route): boolean {
  if (!route.endDate) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return route.endDate < today;
}

/**
 * Get route status badge info
 */
export function getRouteStatus(route: Route): { label: string; color: string } {
  if (isRouteActive(route)) {
    return { label: "Active", color: "green" };
  }
  if (isRouteUpcoming(route)) {
    return { label: "Upcoming", color: "blue" };
  }
  if (isRoutePast(route)) {
    return { label: "Completed", color: "gray" };
  }
  return { label: "Draft", color: "yellow" };
}

/**
 * Export route to JSON for sharing/backup
 */
export function exportRoute(route: Route): string {
  return JSON.stringify(route, null, 2);
}

/**
 * Import route from JSON
 */
export function importRoute(json: string): Route | null {
  try {
    const parsed = JSON.parse(json);

    // Convert date strings back to Date objects
    return {
      ...parsed,
      createdAt: new Date(parsed.createdAt),
      updatedAt: new Date(parsed.updatedAt),
      startDate: parsed.startDate ? new Date(parsed.startDate) : undefined,
      endDate: parsed.endDate ? new Date(parsed.endDate) : undefined,
    };
  } catch (error) {
    console.error("Error importing route:", error);
    return null;
  }
}

export const convertBackendToRoute = (backendRoute: BackendRoute): Route => ({
  id: `route_${backendRoute.id}`, //localstorage ID
  backendId: backendRoute.id,
  userId: backendRoute.userId?.toString(),
  name: backendRoute.name,
  startDate: new Date(backendRoute.startDate),
  endDate: new Date(backendRoute.endDate),
  status: backendRoute.status,
  notes: backendRoute.notes || undefined,
  places: [],
  createdAt: new Date(backendRoute.createdAt),
  updatedAt: new Date(backendRoute.updatedAt),
  isSynced: true,
});

export const convertRouteToBackendCreate = (
  route: Route,
  userId: number
): Omit<BackendRoute, "id" | "createdAt" | "updatedAt"> => ({
  name: route.name,
  userId: userId,
  startDate: route.startDate?.toISOString() || new Date().toISOString(),
  endDate: route.endDate?.toISOString() || new Date().toISOString(),
  status: route.status || "draft",
  notes: route.notes,
});

export const convertRouteToBackendUpdate = (
  route: Route
): Partial<Omit<BackendRoute, "id" | "createdAt" | "updatedAt">> => ({
  name: route.name,
  startDate: route.startDate?.toISOString(),
  endDate: route.endDate?.toISOString(),
  status: route.status,
  notes: route.notes,
});

/**
 * Generate route summary text
 */
export function generateRouteSummary(route: Route): string {
  const stats = calculateRouteStats(route);
  const days = groupPlacesByDay(route.places, route.startDate);

  let summary = `${route.name}\n`;
  summary += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  if (route.startDate && route.endDate) {
    summary += `📅 ${formatDate(route.startDate)} - ${formatDate(
      route.endDate
    )}\n`;
    summary += `⏱️ ${stats.duration} days\n\n`;
  }

  summary += `📍 Total places: ${stats.totalPlaces}\n`;
  summary += `📅 Number of days: ${stats.totalDays}\n\n`;

  days.forEach((day) => {
    summary += `Day ${day.dayNumber}`;
    if (day.date) {
      summary += ` (${formatShortDate(day.date)})`;
    }
    summary += `:\n`;

    day.places.forEach((place, idx) => {
      summary += `  ${idx + 1}. ${place.displayName}\n`;
      if (place.notes) {
        summary += `     💭 ${place.notes}\n`;
      }
    });
    summary += `\n`;
  });

  return summary;
}

/**
 * Reorder places after drag and drop
 */
export function reorderPlaces(
  places: RoutePlace[],
  draggedPlaceId: string,
  targetDay: number,
  targetOrder: number
): RoutePlace[] {
  const draggedPlace = places.find((p) => p.placeId === draggedPlaceId);
  if (!draggedPlace) return places;

  const oldDay = draggedPlace.dayNumber;
  const oldOrder = draggedPlace.orderInDay;

  return places.map((place) => {
    if (place.placeId === draggedPlaceId) {
      return { ...place, dayNumber: targetDay, orderInDay: targetOrder };
    }

    // Adjust orders in old day
    if (place.dayNumber === oldDay && place.orderInDay > oldOrder) {
      return { ...place, orderInDay: place.orderInDay - 1 };
    }

    // Adjust orders in new day
    if (place.dayNumber === targetDay && place.orderInDay >= targetOrder) {
      return { ...place, orderInDay: place.orderInDay + 1 };
    }

    return place;
  });
}

/**
 * Calculate optimal route (simple distance-based ordering)
 * This is a basic implementation - you might want to use a proper routing API
 */
export function optimizeRouteDay(places: RoutePlace[]): RoutePlace[] {
  if (places.length <= 1) return places;

  const optimized: RoutePlace[] = [places[0]];
  const remaining = places.slice(1);

  while (remaining.length > 0) {
    const last = optimized[optimized.length - 1];
    let nearestIdx = 0;
    let minDist = Infinity;

    remaining.forEach((place, idx) => {
      const dist = calculateDistance(
        last.location.lat,
        last.location.lng,
        place.location.lat,
        place.location.lng
      );
      if (dist < minDist) {
        minDist = dist;
        nearestIdx = idx;
      }
    });

    optimized.push(remaining[nearestIdx]);
    remaining.splice(nearestIdx, 1);
  }

  return optimized.map((place, idx) => ({
    ...place,
    orderInDay: idx + 1,
  }));
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}