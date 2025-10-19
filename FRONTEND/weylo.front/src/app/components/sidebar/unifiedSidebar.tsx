"use client";
import React, { useState, useMemo } from "react";
import { SidebarMode, UnifiedSidebarProps } from "../../types/sidebar";
import { groupPlacesByDay } from "../../utils/routeUtils";
import {
  matchesCategory,
  matchesRating,
  matchesSearch,
  getPrimaryCategory,
} from "../../utils/filterUtils";
import WelcomeMode from "./modes/WelcomeMode";
import CountryExplorationMode from "./modes/CountryExplorationMode";
import { PLACE_CATEGORIES } from "../../config/placeCategories";
import { RoutePlanningMode } from "./modes/RoutePlanningMode";
import { FavouritesMode } from "./modes/FavouritesMode";

const UnifiedSidebar: React.FC<UnifiedSidebarProps> = ({
  mode,
  places,
  selectedPlaceId,
  onPlaceSelect,
  onRemovePlace,
  selectedCountry,
  activeRoute,
  routes,
  favourites,
  onAddToFavourites,
  onRemoveFromFavourites,
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
  // Filter state
  const [filters, setFilters] = useState({
    categories: [] as string[],
    rating: null as number | null,
    searchQuery: "",
  });
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);

  // Apply filters to places
  const filteredPlaces = useMemo(() => {
    let result = [...places];

    if (filters.categories.length > 0) {
      result = result.filter((place) =>
        filters.categories.some((catId) => matchesCategory(place, catId))
      );
    }

    if (filters.rating !== null) {
      result = result.filter((place) => matchesRating(place, filters.rating));
    }

    if (filters.searchQuery) {
      result = result.filter((place) =>
        matchesSearch(place, filters.searchQuery)
      );
    }

    return result;
  }, [places, filters]);

  // Calculate category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    PLACE_CATEGORIES.forEach((category) => {
      counts[category.id] = places.filter((place) =>
        matchesCategory(place, category.id)
      ).length;
    });
    return counts;
  }, [places]);

  const toggleCategory = (categoryId: string) => {
    setFilters((prev) => ({
      ...prev,
      categories: prev.categories.includes(categoryId)
        ? prev.categories.filter((id) => id !== categoryId)
        : [...prev.categories, categoryId],
    }));
  };

  const clearFilters = () => {
    setFilters({
      categories: [],
      rating: null,
      searchQuery: "",
    });
  };

  const activeFiltersCount =
    filters.categories.length +
    (filters.rating !== null ? 1 : 0) +
    (filters.searchQuery ? 1 : 0);

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
                        className={`text-xs font-medium px-2 py-1 rounded ${
                          status.color === "green"
                            ? "bg-green-100 text-green-700"
                            : status.color === "yellow"
                            ? "bg-yellow-100 text-yellow-700"
                            : status.color === "red"
                            ? "bg-red-100 text-red-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
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
      return (
        <CountryExplorationMode
          selectedCountry={selectedCountry}
          places={places}
          filteredPlaces={filteredPlaces}
          filters={filters}
          setFilters={setFilters}
          categoryCounts={categoryCounts}
          isFiltersExpanded={isFiltersExpanded}
          setIsFiltersExpanded={setIsFiltersExpanded}
          activeFiltersCount={activeFiltersCount}
          clearFilters={clearFilters}
          toggleCategory={toggleCategory}
          selectedPlaceId={selectedPlaceId}
          onPlaceSelect={onPlaceSelect}
          onAddPlaceToRoute={onAddPlaceToRoute}
          onRemovePlace={onRemovePlace}
          error={error}
          isFavourite={(placeId: string) =>
            favourites.some((fav) => fav.placeId === placeId)
          }
          onAddToFavourites={onAddToFavourites}
          onRemoveFromFavourites={onRemoveFromFavourites}
        />
      );
    case SidebarMode.ROUTE_PLANNING:
      return (
        <RoutePlanningMode
          activeRoute={activeRoute}
          onSwitchMode={onSwitchMode}
          onEditRoute={onEditRoute}
          onAddDay={onAddDay}
          onRemoveDay={onRemoveDay}
          onMovePlaceInRoute={onMovePlaceInRoute}
          onOptimizeRouteDay={onOptimizeRouteDay}
          onRemovePlaceFromRoute={onRemovePlaceFromRoute}
          onGetRouteStats={onGetRouteStats}
          onGetRouteStatus={onGetRouteStatus}
          onDuplicateRoute={onDuplicateRoute}
          onDeleteRoute={onDeleteRoute}
        />
      );
    case SidebarMode.FAVOURITES:
      return (
        <FavouritesMode
          favourites={favourites || []}
          selectedPlaceId={selectedPlaceId}
          onPlaceSelect={onPlaceSelect}
          onRemoveFromFavourites={onRemoveFromFavourites}
          onAddToRoute={onAddPlaceToRoute}
          onSwitchMode={onSwitchMode}
        />
      );
    case SidebarMode.MY_ROUTES:
      return renderMyRoutes();
    default:
      return <WelcomeMode onSwitchMode={onSwitchMode} />;
  }
};

export default UnifiedSidebar;
