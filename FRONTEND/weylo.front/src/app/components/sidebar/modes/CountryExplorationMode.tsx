import { SupportedCountry } from "@/src/app/types/country";
import { Place } from "@/src/app/types/place";
import { matchesRating, getPrimaryCategory } from "@/src/app/utils/filterUtils";
import { ChevronDown } from "../../ui/chevronDown";
import { Search } from "../../ui/search";
import { PLACE_CATEGORIES } from "@/src/app/config/placeCategories";

interface CountryExplorationModeProps {
  selectedCountry: SupportedCountry | null;
  places: Place[];
  filteredPlaces: Place[];
  filters: {
    categories: string[];
    rating: number | null;
    searchQuery: string;
  };
  isFavourite: (placeId: string) => boolean;
  onAddToFavourites: (place: Place) => void;
  onRemoveFromFavourites: (place: Place) => void;
  setFilters: React.Dispatch<
    React.SetStateAction<{
      categories: string[];
      rating: number | null;
      searchQuery: string;
    }>
  >;
  categoryCounts: Record<string, number>;
  isFiltersExpanded: boolean;
  setIsFiltersExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  activeFiltersCount: number;
  clearFilters: () => void;
  toggleCategory: (categoryId: string) => void;
  selectedPlaceId: string | null;
  onPlaceSelect: (placeId: string | null) => void;
  onAddPlaceToRoute: (place: Place) => void;
  onRemovePlace: (place: Place) => void;
  error: string | null;
}

const CountryExplorationMode: React.FC<CountryExplorationModeProps> = ({
  selectedCountry,
  places,
  filteredPlaces,
  filters,
  setFilters,
  categoryCounts,
  isFiltersExpanded,
  setIsFiltersExpanded,
  activeFiltersCount,
  clearFilters,
  toggleCategory,
  selectedPlaceId,
  onPlaceSelect,
  onAddPlaceToRoute,
  onRemovePlace,
  isFavourite,
  onAddToFavourites,
  onRemoveFromFavourites,
  error,
}) => {
  return (
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
                        } ${
                          count === 0 ? "opacity-50 cursor-not-allowed" : ""
                        }`}
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
                        {place.types &&
                          place.types.slice(0, 2).map((type, idx) => (
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
                      {/* Кнопка фаворита */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isFavourite(place.placeId)) {
                            onRemoveFromFavourites(place);
                          } else {
                            onAddToFavourites(place);
                          }
                        }}
                        className={`p-2 rounded transition-colors ${
                          isFavourite(place.placeId)
                            ? "text-yellow-600 hover:bg-yellow-200"
                            : "text-gray-600 hover:bg-gray-200"
                        }`}
                        title={
                          isFavourite(place.placeId)
                            ? "Remove from favourites"
                            : "Add to favourites"
                        }
                      >
                        {isFavourite(place.placeId) ? "❤️" : "🩶"}
                      </button>

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
};

export default CountryExplorationMode;
