"use client";
import React from "react";
import { SavedPlace } from "../../types/map";

interface SidebarProps {
  places: SavedPlace[];
  selectedPlaceId: string | null;
  onPlaceSelect: (placeId: string) => void;
  onPlaceRemove: (placeId: string) => void;
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
}) => {
  if (places.length === 0) {
    return (
      <div className="w-80 bg-white border-l border-gray-200 p-4 flex items-center justify-center">
        <p className="text-gray-500 text-center">
          No places saved yet. Start searching to add places!
        </p>
      </div>
    );
  }

  return (
    <div className="w-80 bg-white border-l border-gray-200 p-4 overflow-y-auto">
      <h3 className="text-lg font-semibold mb-4">Saved Places</h3>
      <ul className="space-y-2">
        {places.map((place) => (
          <li
            key={place.placeId}
            className={`p-3 rounded-lg border transition-colors ${
              selectedPlaceId === place.placeId
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 hover:bg-gray-50"
            }`}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">
                  {place.displayName || "Unnamed place"}
                </h4>

                {place.formattedAddress && (
                  <p className="text-sm text-gray-600 mt-1">
                    {place.formattedAddress}
                  </p>
                )}

                {place.rating && (
                  <p className="text-sm text-gray-500 mt-1">
                    ⭐ {place.rating}{" "}
                    {place.userRatingsTotal &&
                      `(${place.userRatingsTotal} reviews)`}
                  </p>
                )}
              </div>

              <div className="flex gap-2 ml-2">
                <button
                  onClick={() => onPlaceSelect(place.placeId)}
                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                  title="View on map"
                >
                  🔍
                </button>
                <button
                  onClick={() => onPlaceRemove(place.placeId)}
                  className="p-1 hover:bg-red-100 rounded transition-colors"
                  title="Remove place"
                >
                  ❌
                </button>
              </div>
            </div>

            {/* Show category */}
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
                    .slice(0, 2) // 2 types max
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

      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-sm text-gray-500">Total places: {places.length}</p>
      </div>
    </div>
  );
};

export default Sidebar;
