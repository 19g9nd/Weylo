"use client";
import React from "react";
import { SavedPlace } from "../../types/map";

interface SidebarProps {
  places: SavedPlace[];
  selectedPlaceId: string | null;
  onPlaceSelect: (placeId: string) => void;
  onPlaceRemove: (placeId: string) => void;
  isLoading?: boolean;
  error?: string | null;
}

const HIDDEN_TYPES = [
  "locality",
  "political",
  "point_of_interest",
  "establishment",
  "geocode",
];

const Sidebar: React.FC<SidebarProps> = ({
  places,
  selectedPlaceId,
  onPlaceSelect,
  onPlaceRemove,
  isLoading = false,
  error = null,
}) => {
  if (isLoading) {
    return (
      <div className="w-80 bg-white border-l border-gray-200 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-gray-500 mt-2">Loading places...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-white border-l border-gray-200 p-4 overflow-y-auto">
      {error && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800 text-sm">{error}</p>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Saved Places</h3>
        {places.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
              {places.length} {places.length === 1 ? 'place' : 'places'}
            </span>
            <div 
              className="w-2 h-2 rounded-full bg-green-500" 
              title="Synced with server"
            />
          </div>
        )}
      </div>

      {places.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400 text-4xl mb-4">📍</div>
          <p className="text-gray-500 text-center">
            No places saved yet. Start searching to add places!
          </p>
          <p className="text-gray-400 text-sm mt-2">
            Use the search box above to find and save interesting locations.
          </p>
        </div>
      ) : (
        <>
          <ul className="space-y-3">
            {places.map((place, index) => (
              <li
                key={place.placeId}
                className={`p-3 rounded-lg border transition-all duration-200 cursor-pointer ${
                  selectedPlaceId === place.placeId
                    ? "border-blue-500 bg-blue-50 shadow-md"
                    : "border-gray-200 hover:bg-gray-50 hover:shadow-sm"
                }`}
                onClick={() => onPlaceSelect(place.placeId)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2">
                      <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-mono">
                        #{index + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 truncate">
                          {place.displayName || "Unnamed place"}
                        </h4>
                      </div>
                    </div>

                    {place.formattedAddress && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {place.formattedAddress}
                      </p>
                    )}

                    {place.rating && (
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-yellow-400">⭐</span>
                        <span className="text-sm text-gray-700 font-medium">
                          {place.rating}
                        </span>
                        {place.userRatingsTotal && (
                          <span className="text-xs text-gray-500">
                            ({place.userRatingsTotal} reviews)
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-1 ml-2 flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onPlaceSelect(place.placeId);
                      }}
                      className="p-1.5 hover:bg-blue-100 rounded transition-colors text-blue-600"
                      title="View on map"
                    >
                      🔍
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onPlaceRemove(place.placeId);
                      }}
                      className="p-1.5 hover:bg-red-100 rounded transition-colors text-red-600"
                      title="Remove place"
                    >
                      ❌
                    </button>
                  </div>
                </div>

                {/* Show category/type */}
                {place.primaryTypeDisplayName ? (
                  <div className="mt-2">
                    <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                      {place.primaryTypeDisplayName.text}
                    </span>
                  </div>
                ) : (
                  place.types && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {place.types
                        .filter((t) => !HIDDEN_TYPES.includes(t))
                        .slice(0, 2)
                        .map((type, idx) => (
                          <span
                            key={idx}
                            className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded"
                          >
                            {type.replace(/_/g, " ")}
                          </span>
                        ))}
                    </div>
                  )
                )}
              </li>
            ))}
          </ul>

          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>Total places: {places.length}</span>
              <button 
                onClick={() => {/* TODO: implement clear all */}}
                className="text-red-500 hover:text-red-700 text-xs"
              >
                Clear all
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Sidebar;