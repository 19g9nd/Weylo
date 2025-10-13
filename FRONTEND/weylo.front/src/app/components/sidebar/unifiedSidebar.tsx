"use client";
import React, { useState, useMemo } from "react";
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

// Category configuration
interface PlaceCategory {
  id: string;
  name: string;
  icon: string;
  googleTypes: string[];
}

const PLACE_CATEGORIES: PlaceCategory[] = [
  {
    id: "food",
    name: "Food & Drinks",
    icon: "🍽️",
    googleTypes: [
      "restaurant",
      "cafe",
      "bar",
      "bakery",
      "meal_takeaway",
      "meal_delivery",
      "food",
    ],
  },
  {
    id: "nature",
    name: "Nature",
    icon: "🌳",
    googleTypes: [
      "park",
      "natural_feature",
      "campground",
      "hiking_area",
      "national_park",
    ],
  },
  {
    id: "culture",
    name: "Culture",
    icon: "🏛️",
    googleTypes: [
      "museum",
      "art_gallery",
      "library",
      "church",
      "tourist_attraction",
      "landmark",
    ],
  },
  {
    id: "entertainment",
    name: "Entertainment",
    icon: "🎭",
    googleTypes: [
      "movie_theater",
      "amusement_park",
      "zoo",
      "aquarium",
      "bowling_alley",
      "night_club",
    ],
  },
  {
    id: "shopping",
    name: "Shopping",
    icon: "🛍️",
    googleTypes: [
      "shopping_mall",
      "clothing_store",
      "store",
      "supermarket",
      "convenience_store",
    ],
  },
  {
    id: "accommodation",
    name: "Accommodation",
    icon: "🏨",
    googleTypes: ["lodging", "hotel", "hostel", "resort", "guest_house"],
  },
];

// Filter utilities
const matchesCategory = (place: SavedPlace, categoryId: string): boolean => {
  const category = PLACE_CATEGORIES.find((c) => c.id === categoryId);
  if (!category || !place.types) return false;

  return place.types.some((placeType) =>
    category.googleTypes.some((categoryType) =>
      placeType.toLowerCase().includes(categoryType.toLowerCase())
    )
  );
};

const matchesRating = (
  place: SavedPlace,
  minRating: number | null
): boolean => {
  if (minRating === null) return true;
  return (place.rating || 0) >= minRating;
};

const matchesSearch = (place: SavedPlace, query: string): boolean => {
  if (!query) return true;
  const searchLower = query.toLowerCase();
  return (
    place.displayName?.toLowerCase().includes(searchLower) ||
    place.formattedAddress?.toLowerCase().includes(searchLower) ||
    place.types?.some((type) => type.toLowerCase().includes(searchLower)) ||
    false
  );
};

// Get primary category for a place
const getPrimaryCategory = (place: SavedPlace): PlaceCategory | null => {
  if (!place.types) return null;
  
  for (const category of PLACE_CATEGORIES) {
    if (matchesCategory(place, category.id)) {
      return category;
    }
  }
  return null;
};

// Chevron Down Icon Component
const ChevronDown = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 9l-7 7-7-7"
    />
  </svg>
);

// Search Icon Component
const Search = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    />
  </svg>
);

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
    PLACE_CATEGORIES.forEach(category => {
      counts[category.id] = places.filter(place => matchesCategory(place, category.id)).length;
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

  // --- Country Exploration Mode with Filters ---
  const renderCountryExploration = () => (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900">
            {selectedCountry
              ? `Places in ${selectedCountry.name}`
              : "Available places"}
          </h3>
          {filteredPlaces.length > 0 && (
            <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-xs">
              {filteredPlaces.length}
              {filteredPlaces.length !== places.length && ` / ${places.length}`}
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

      {/* Filters Section */}
      {places.length > 0 && (
        <div className="flex-shrink-0 border-b border-gray-200">
          <div
            className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50"
            onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
          >
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">🔍 Filters</span>
              {activeFiltersCount > 0 && (
                <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {activeFiltersCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {activeFiltersCount > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    clearFilters();
                  }}
                  className="text-xs text-red-600 hover:text-red-700 px-2 py-1 hover:bg-red-50 rounded"
                >
                  Clear
                </button>
              )}
              <ChevronDown
                className={`w-4 h-4 transition-transform ${
                  isFiltersExpanded ? "rotate-180" : ""
                }`}
              />
            </div>
          </div>

          {isFiltersExpanded && (
            <div className="p-3 space-y-3 bg-gray-50">
              {/* Search */}
              <div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={filters.searchQuery}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        searchQuery: e.target.value,
                      }))
                    }
                    placeholder="Search by name, address, or type..."
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Categories */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  Categories
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {PLACE_CATEGORIES.map((category) => {
                    const isActive = filters.categories.includes(category.id);
                    const count = categoryCounts[category.id] || 0;

                    return (
                      <button
                        key={category.id}
                        onClick={() => toggleCategory(category.id)}
                        className={`flex items-center gap-2 p-2 rounded-lg border transition-all text-left ${
                          isActive
                            ? "border-blue-500 bg-blue-50 text-blue-700"
                            : "border-gray-200 hover:border-gray-300 bg-white"
                        } ${count === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
                        disabled={count === 0}
                      >
                        <span className="text-lg">{category.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium truncate">
                            {category.name}
                          </div>
                          <div className="text-xs text-gray-500">{count}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Rating */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  Minimum rating
                </label>
                <div className="grid grid-cols-5 gap-1">
                  {[null, 3, 3.5, 4, 4.5].map((rating) => {
                    const isActive = filters.rating === rating;
                    const count =
                      rating === null
                        ? places.length
                        : places.filter((p) => matchesRating(p, rating)).length;

                    return (
                      <button
                        key={rating || "all"}
                        onClick={() =>
                          setFilters((prev) => ({ ...prev, rating }))
                        }
                        className={`px-2 py-1.5 rounded-lg border text-xs transition-all ${
                          isActive
                            ? "border-yellow-500 bg-yellow-50 text-yellow-700"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="font-medium">
                          {rating === null ? "All" : `${rating}+`}
                        </div>
                        <div className="text-gray-500">{count}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Places List */}
      <div className="flex-1 overflow-y-auto">
        {filteredPlaces.length === 0 ? (
          <div className="h-full flex items-center justify-center p-4">
            <div className="text-center">
              <div className="text-gray-400 text-4xl mb-4">
                {places.length === 0 ? "📍" : "🔍"}
              </div>
              <p className="text-gray-500 text-base mb-2">
                {places.length === 0 ? "No places found" : "No matches"}
              </p>
              <p className="text-gray-400 text-sm">
                {places.length === 0
                  ? "Use search to add places"
                  : "Try different filters"}
              </p>
              {activeFiltersCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="mt-3 text-sm text-blue-600 hover:text-blue-700"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {filteredPlaces.map((place, index) => {
              const primaryCategory = getPrimaryCategory(place);
              const categoryIcon = primaryCategory?.icon || "📍";
              const categoryName = primaryCategory?.name || "Place";

              return (
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
                        <span className="text-sm">{categoryIcon}</span>
                        <h4 className="font-medium text-gray-900 truncate">
                          {place.displayName}
                        </h4>
                      </div>
                      {place.formattedAddress && (
                        <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                          {place.formattedAddress}
                        </p>
                      )}
                      <div className="flex items-center gap-2 flex-wrap">
                        {place.rating && (
                          <div className="flex items-center gap-1">
                            <span>⭐</span>
                            <span className="text-sm font-medium">
                              {place.rating}
                            </span>
                            {place.userRatingsTotal && (
                              <span className="text-xs text-gray-500">
                                ({place.userRatingsTotal})
                              </span>
                            )}
                          </div>
                        )}
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                          {categoryName}
                        </span>
                        {place.types && place.types.slice(0, 2).map((type, idx) => (
                          <span 
                            key={idx}
                            className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded"
                          >
                            {type.replace(/_/g, " ")}
                          </span>
                        ))}
                      </div>
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
              );
            })}
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
            className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
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
                    .map((place, idx) => {
                      const primaryCategory = getPrimaryCategory(place);
                      const categoryIcon = primaryCategory?.icon || "📍";

                      return (
                        <div
                          key={place.placeId}
                          className="flex items-start gap-3 p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg hover:shadow-md transition-all border border-blue-200"
                        >
                          <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                            {idx + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm">{categoryIcon}</span>
                              <p className="font-semibold text-gray-900">
                                {place.displayName}
                              </p>
                            </div>
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
                      );
                    })}
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