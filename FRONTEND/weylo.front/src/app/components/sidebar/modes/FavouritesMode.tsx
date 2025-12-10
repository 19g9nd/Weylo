import { FavouritePlace } from "@/src/app/types/place";
import { SidebarMode } from "@/src/app/types/sidebar";
import { getPrimaryCategory } from "@/src/app/utils/filterUtils";

interface FavouritesModeProps {
  favourites: FavouritePlace[];
  selectedPlaceId: string | null;
  onPlaceSelect: (placeId: string | null) => void;
  onRemoveFromFavourites: (place: FavouritePlace) => void;
  onAddToRoute: (place: FavouritePlace) => void;
  onSwitchMode: (mode: SidebarMode) => void;
}

export const FavouritesMode: React.FC<FavouritesModeProps> = ({
  favourites = [],
  selectedPlaceId,
  onPlaceSelect,
  onRemoveFromFavourites,
  onAddToRoute,
  onSwitchMode,
}) => {
  if (favourites.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="text-center">
          <div className="text-6xl mb-4">⭐</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            No favourites yet
          </h2>
          <p className="text-gray-600 mb-6">
            Save places you love to find them easily later
          </p>
          <button
            onClick={() => onSwitchMode(SidebarMode.COUNTRY_EXPLORATION)}
            className="py-3 px-6 bg-yellow-400 hover:bg-yellow-500 text-white rounded-lg font-medium transition-colors"
          >
            🌍 Explore places
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200 bg-gradient-to-r from-yellow-50 to-orange-50">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900">
            ⭐ My Favourites
          </h3>
          <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs">
            {favourites.length}
          </span>
        </div>
        <p className="text-sm text-gray-600">
          Your saved places for quick access
        </p>
      </div>

      {/* Favourites List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {favourites.map((place, index) => {
          const primaryCategory = getPrimaryCategory(place);
          const categoryIcon = primaryCategory?.icon || "📍";
          const categoryName = primaryCategory?.name || "Place";
          
          // Get image URL from photos array
          const imageUrl = place.photos?.[0]?.getURI?.() || null;
          // Get saved date if available
          const savedDate = place.savedAt ? new Date(place.savedAt) : null;
          // Get personal notes
          const personalNotes = place.personalNotes;

          return (
            <div
              key={place.placeId}
              className={`p-3 rounded-lg border cursor-pointer transition-all ${
                selectedPlaceId === place.placeId
                  ? "border-yellow-500 bg-yellow-50"
                  : "border-gray-200 hover:bg-gray-50"
              }`}
              onClick={() => onPlaceSelect(place.placeId)}
            >
              <div className="flex gap-3">
                {/* Image Section */}
                {imageUrl && (
                  <div className="flex-shrink-0">
                    <img
                      src={imageUrl}
                      alt={place.displayName || "Place image"}
                      className="w-20 h-20 rounded-lg object-cover"
                      onError={(e) => {
                        // Fallback if image fails to load
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
                
                {/* Content Section */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs bg-yellow-100 px-1.5 py-0.5 rounded text-yellow-700">
                          #{index + 1}
                        </span>
                        <span className="text-sm">{categoryIcon}</span>
                        <h4 className="font-medium text-gray-900 truncate">
                          {place.displayName}
                        </h4>
                      </div>
                      
                      {/* Personal Notes (if any) */}
                      {personalNotes && (
                        <div className="mb-2 p-2 bg-blue-50 border border-blue-100 rounded">
                          <p className="text-xs text-blue-800 italic">
                            💬 "{personalNotes}"
                          </p>
                        </div>
                      )}
                      
                      {/* Rating and Category */}
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        {place.rating && (
                          <div className="flex items-center gap-1">
                            <span>⭐</span>
                            <span className="text-sm font-medium">
                              {place.rating.toFixed(1)}
                            </span>
                            {place.userRatingsTotal && (
                              <span className="text-xs text-gray-500">
                                ({place.userRatingsTotal.toLocaleString()})
                              </span>
                            )}
                          </div>
                        )}
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                          {categoryName}
                        </span>
                        
                        {/* Saved Date */}
                        {savedDate && (
                          <span className="text-xs bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded">
                            📅 {savedDate.toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      
                      {/* Address */}
                      {place.formattedAddress && (
                        <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                          {place.formattedAddress}
                        </p>
                      )}
                      
                      {/* Additional Info */}
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        {place.googleType && (
                          <span className="truncate">
                            {place.googleType.split(',')[0].replace(/_/g, ' ')}
                          </span>
                        )}
                        {place.city && (
                          <span className="flex items-center gap-1">
                            <span>🏙️</span>
                            {place.city}
                          </span>
                        )}
                        {place.country && (
                          <span className="flex items-center gap-1">
                            <span>🌐</span>
                            {place.country}
                          </span>
                        )}
                      </div>
                      
                      {/* Types/Tags */}
                      {place.types && place.types.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {place.types.slice(0, 3).map((type, idx) => (
                            <span
                              key={idx}
                              className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded"
                            >
                              {type.replace(/_/g, " ")}
                            </span>
                          ))}
                          {place.types.length > 3 && (
                            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">
                              +{place.types.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* Actions */}
                    <div className="flex flex-col gap-1">
                      {/* Add to route button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddToRoute(place);
                        }}
                        className="p-2 hover:bg-green-100 rounded text-green-600"
                        title="Add to route"
                      >
                        ➕
                      </button>
                      
                      {/* Remove from favourites button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (
                            confirm(
                              `Remove "${place.displayName}" from favourites?`
                            )
                          ) {
                            onRemoveFromFavourites(place);
                          }
                        }}
                        className="p-2 hover:bg-red-100 rounded text-red-600"
                        title="Remove from favourites"
                      >
                        ❌
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 p-4 border-t border-gray-200 bg-gray-50">
        <button
          onClick={() => onSwitchMode(SidebarMode.COUNTRY_EXPLORATION)}
          className="w-full py-2.5 px-4 bg-yellow-400 hover:bg-yellow-500 text-white rounded-lg font-medium transition-colors"
        >
          🌍 Explore more places
        </button>
      </div>
    </div>
  );
};