"use client";
import React from "react";
import { SidebarMode, Route } from "../../types/sidebar";
import { SavedPlace } from "../../types/map";
import { SupportedCountry } from "../../types/country";
import { groupPlacesByDay } from "../../utils/routeUtils";

interface UnifiedSidebarProps {
  mode: SidebarMode;
  places: SavedPlace[];
  selectedPlaceId: string | null;
  onPlaceSelect: (placeId: string | null) => void;
  onRemovePlace: (place: SavedPlace) => void;
  selectedCountry: SupportedCountry | null;

  activeRoute: Route | null;
  routes: Route[];
  onSelectRoute: (routeId: string) => void;
  onCreateRoute: () => void;
  onEditRoute: (route: Route) => void;
  onDeleteRoute: (routeId: string) => void;
  onDuplicateRoute: (routeId: string) => void;

  onAddPlaceToRoute: (place: SavedPlace) => void;
  onRemovePlaceFromRoute: (placeId: string) => void;
  onMovePlaceInRoute: (
    routeId: string,
    placeId: string,
    newDayNumber: number,
    newOrderInDay: number
  ) => void;
  onOptimizeRouteDay: (routeId: string, dayNumber: number) => void;

  onAddDay: (routeId: string) => void;
  onRemoveDay: (routeId: string, dayNumber: number) => void;

  onGetRouteStats: (routeId: string) => {
    totalPlaces: number;
    totalDays: number;
    avgPlacesPerDay: number;
  } | null;
  onGetRouteStatus: (route: Route) => { label: string; color: string };

  onSwitchMode: (mode: SidebarMode) => void;
  isLoading: boolean;
  error: string | null;
}

const UnifiedSidebar: React.FC<UnifiedSidebarProps> = ({
  mode,
  places,
  selectedPlaceId,
  onPlaceSelect,
  onRemovePlace,
  selectedCountry,
  activeRoute,
  routes,
  onSelectRoute,
  onCreateRoute,
  onEditRoute,
  onDeleteRoute,
  onDuplicateRoute,
  onAddPlaceToRoute,
  onRemovePlaceFromRoute,
  onMovePlaceInRoute,
  onOptimizeRouteDay,
  onAddDay,
  onRemoveDay,
  onGetRouteStats,
  onGetRouteStatus,
  onSwitchMode,
  isLoading,
  error,
}) => {
  // --- Welcome Mode ---
  const renderWelcome = () => (
    <div className="h-full flex items-center justify-center p-8">
      <div className="text-center">
        <div className="text-6xl mb-4">🗺️</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome to Weylo
        </h2>
        <p className="text-gray-600 mb-6">
          Start by selecting a country to explore or create your travel route
        </p>
        <div className="space-y-3">
          <button
            onClick={() => onSwitchMode(SidebarMode.COUNTRY_EXPLORATION)}
            className="w-full py-3 px-4 bg-yellow-400 hover:bg-yellow-500 text-white rounded-lg font-medium transition-colors"
          >
            🌍 Explore countries
          </button>
          <button
            onClick={() => onSwitchMode(SidebarMode.MY_ROUTES)}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            📅 My routes
          </button>
        </div>
      </div>
    </div>
  );

  // --- Country Exploration Mode ---
  const renderCountryExploration = () => (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0 p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900">
            {selectedCountry
              ? `Places in ${selectedCountry.name}`
              : "Available places"}
          </h3>
          {places.length > 0 && (
            <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-xs">
              {places.length}
            </span>
          )}
        </div>

        {selectedCountry && (
          <div className="p-2 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2">
            <span className="text-xs text-yellow-800">
              🌍 <strong>{selectedCountry.name}</strong>
            </span>
          </div>
        )}

        {error && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {places.length === 0 ? (
          <div className="h-full flex items-center justify-center p-4">
            <div className="text-center">
              <div className="text-gray-400 text-4xl mb-4">📍</div>
              <p className="text-gray-500 text-base mb-2">No places found</p>
              <p className="text-gray-400 text-sm">Use search to add places</p>
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {places.map((place, index) => (
              <div
                key={place.placeId}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  selectedPlaceId === place.placeId
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
                onClick={() => onPlaceSelect(place.placeId)}
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                        #{index + 1}
                      </span>
                      <h4 className="font-medium text-gray-900 truncate">
                        {place.displayName}
                      </h4>
                    </div>
                    {place.formattedAddress && (
                      <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                        {place.formattedAddress}
                      </p>
                    )}
                    {place.rating && (
                      <div className="flex items-center gap-1">
                        <span>⭐</span>
                        <span className="text-sm font-medium">
                          {place.rating}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddPlaceToRoute(place);
                      }}
                      className="p-2 hover:bg-green-100 rounded text-green-600"
                      title="Add to route"
                    >
                      ➕
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (
                          confirm(
                            `Remove "${place.displayName}" from saved places?`
                          )
                        ) {
                          onRemovePlace(place);
                        }
                      }}
                      className="p-2 hover:bg-red-100 rounded text-red-600"
                      title="Remove from list"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // --- Route Planning Mode ---
  const renderRoutePlanning = () => {
    if (!activeRoute) return null;

    const days = groupPlacesByDay(activeRoute.places, activeRoute.startDate);
    const stats = onGetRouteStats(activeRoute.id);
    const status = onGetRouteStatus(activeRoute);

    return (
      <div className="h-full flex flex-col">
        <div className="flex-shrink-0 p-4 border-b border-gray-200 bg-gradient-to-r from-yellow-50 to-orange-50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {activeRoute.name}
              </h3>
              <button
                onClick={() => onEditRoute(activeRoute)}
                className="text-blue-600 hover:text-blue-700"
                title="Edit"
              >
                ✏️
              </button>
            </div>
            <button
              onClick={() => onSwitchMode(SidebarMode.MY_ROUTES)}
              className="text-sm text-gray-600 hover:text-gray-900 px-2"
            >
              📋 All routes
            </button>
          </div>

          {stats && (
            <div className="flex gap-4 text-sm mb-2">
              <span className="text-gray-700">
                📍 {stats.totalPlaces} places
              </span>
              <span className="text-gray-700">📅 {stats.totalDays} days</span>
              <span className="text-gray-700">
                ⚡ {stats.avgPlacesPerDay} places/day
              </span>
            </div>
          )}

          <span
            className={`inline-block px-2 py-1 rounded-full text-xs font-medium bg-${status.color}-100 text-${status.color}-700`}
          >
            {status.label}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {days.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl mb-4">📅</div>
                <p className="text-gray-500 mb-2">Route is empty</p>
                <p className="text-gray-400 text-sm">Add places from search</p>
              </div>
            </div>
          ) : (
            days.map((day) => (
              <div
                key={day.dayNumber}
                className="border-2 border-gray-200 rounded-xl p-4 bg-white shadow-sm"
              >
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📅</span>
                    <div>
                      <h4 className="font-bold text-gray-900 text-lg">
                        Day {day.dayNumber}
                      </h4>
                      {day.date && (
                        <p className="text-sm text-gray-600">
                          {day.date.toLocaleDateString("en-US", {
                            day: "numeric",
                            month: "long",
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">
                      {day.places.length} places
                    </span>
                    {day.places.length > 1 && (
                      <button
                        onClick={() =>
                          onOptimizeRouteDay(activeRoute.id, day.dayNumber)
                        }
                        className="text-yellow-600 hover:bg-yellow-100 p-2 rounded-lg"
                        title="Optimize route order"
                      >
                        ⚡
                      </button>
                    )}
                    <button
                      onClick={() => onRemoveDay(activeRoute.id, day.dayNumber)}
                      className="text-red-600 hover:bg-red-100 p-2 rounded-lg"
                      title="Remove day"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {day.places
                    .sort((a, b) => a.orderInDay - b.orderInDay)
                    .map((place, idx) => (
                      <div
                        key={place.placeId}
                        className="flex items-start gap-3 p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg hover:shadow-md transition-all border border-blue-200"
                      >
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 mb-1">
                            {place.displayName}
                          </p>
                          {place.formattedAddress && (
                            <p className="text-xs text-gray-600 mb-2">
                              📍 {place.formattedAddress}
                            </p>
                          )}
                          {place.notes && (
                            <div className="mt-2 p-2 bg-yellow-50 rounded border border-yellow-200">
                              <p className="text-xs text-gray-700">
                                💭 {place.notes}
                              </p>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => {
                              if (idx > 0) {
                                const prevPlace = day.places[idx - 1];
                                onMovePlaceInRoute(
                                  activeRoute.id,
                                  place.placeId,
                                  day.dayNumber,
                                  prevPlace.orderInDay
                                );
                              }
                            }}
                            disabled={idx === 0}
                            className="p-1 hover:bg-blue-200 rounded disabled:opacity-30"
                            title="Move up"
                          >
                            ▲
                          </button>
                          <button
                            onClick={() => {
                              if (idx < day.places.length - 1) {
                                const nextPlace = day.places[idx + 1];
                                onMovePlaceInRoute(
                                  activeRoute.id,
                                  place.placeId,
                                  day.dayNumber,
                                  nextPlace.orderInDay
                                );
                              }
                            }}
                            disabled={idx === day.places.length - 1}
                            className="p-1 hover:bg-blue-200 rounded disabled:opacity-30"
                            title="Move down"
                          >
                            ▼
                          </button>
                          <button
                            onClick={() =>
                              onRemovePlaceFromRoute(place.placeId)
                            }
                            className="p-1 hover:bg-red-200 rounded text-red-600"
                            title="Remove"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex-shrink-0 p-4 border-t border-gray-200 space-y-2 bg-gray-50">
          <button
            onClick={() => onAddDay(activeRoute.id)}
            className="w-full py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <span>📅</span>
            <span>Add day</span>
          </button>
          <button
            onClick={() => onSwitchMode(SidebarMode.COUNTRY_EXPLORATION)}
            className="w-full py-2.5 px-4 bg-yellow-400 hover:bg-yellow-500 text-gray-900 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <span>➕</span>
            <span>Add places</span>
          </button>
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => onDuplicateRoute(activeRoute.id)}
              className="flex-1 py-2 px-3 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-sm font-medium"
            >
              📋 Duplicate
            </button>
            <button
              onClick={() => onDeleteRoute(activeRoute.id)}
              className="flex-1 py-2 px-3 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm font-medium"
            >
              🗑️ Delete
            </button>
          </div>
        </div>
      </div>
    );
  };

  // --- My Routes Mode ---
  const renderMyRoutes = () => (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0 p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">My Routes</h3>
        <button
          onClick={onCreateRoute}
          className="w-full py-2 px-4 bg-yellow-400 hover:bg-yellow-500 text-white rounded-lg font-medium transition-colors"
        >
          ＋ Create new route
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {routes.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl mb-4">🗺️</div>
              <p className="text-gray-500 mb-2">No routes</p>
              <p className="text-gray-400 text-sm">
                Create your first route to start travel planning
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {routes.map((route) => {
              const stats = onGetRouteStats(route.id);
              const status = onGetRouteStatus(route);

              return (
                <div
                  key={route.id}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    activeRoute?.id === route.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                  onClick={() => {
                    onSelectRoute(route.id);
                    onSwitchMode(SidebarMode.ROUTE_PLANNING);
                  }}
                >
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 mb-1 truncate">
                        {route.name}
                      </h4>
                      {stats && (
                        <p className="text-sm text-gray-600">
                          {stats.totalPlaces} places • {stats.totalDays} days
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col gap-1">
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded bg-${status.color}-100 text-${status.color}-700`}
                      >
                        {status.label}
                      </span>
                      {activeRoute?.id === route.id && (
                        <span className="text-xs font-medium px-2 py-1 bg-green-50 text-green-700 rounded">
                          Active
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditRoute(route);
                      }}
                      className="flex-1 py-1 px-2 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDuplicateRoute(route.id);
                      }}
                      className="flex-1 py-1 px-2 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded"
                    >
                      📋 Copy
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteRoute(route.id);
                      }}
                      className="py-1 px-2 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  // --- MAIN RENDER ---
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin text-4xl mb-4">🌀</div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  switch (mode) {
    case SidebarMode.COUNTRY_EXPLORATION:
      return renderCountryExploration();
    case SidebarMode.ROUTE_PLANNING:
      return renderRoutePlanning();
    case SidebarMode.MY_ROUTES:
      return renderMyRoutes();
    default:
      return renderWelcome();
  }
};

export default UnifiedSidebar;