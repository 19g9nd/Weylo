"use client";
import React, { useState } from "react";
import { Route } from "../../types/sidebar";
import { Place } from "../../types/place";

interface AddToRouteModalProps {
  isOpen: boolean;
  onClose: () => void;
  place: Place | null;
  routes: Route[];
  onCreateNewRoute: (name: string, place: Place) => void;
  onAddToExistingRoute: (routeId: string, place: Place) => void;
}

const AddToRouteModal: React.FC<AddToRouteModalProps> = ({
  isOpen,
  onClose,
  place,
  routes,
  onCreateNewRoute,
  onAddToExistingRoute,
}) => {
  const [isCreatingNew, setIsCreatingNew] = useState(routes.length === 0);
  const [newRouteName, setNewRouteName] = useState("");
  const [selectedRouteId, setSelectedRouteId] = useState<string>(
    routes.length > 0 ? routes[0].id : ""
  );

  if (!isOpen || !place) return null;

  const handleSubmit = () => {
    if (isCreatingNew) {
      if (newRouteName.trim()) {
        onCreateNewRoute(newRouteName.trim(), place);
        setNewRouteName("");
        onClose();
      }
    } else {
      if (selectedRouteId) {
        onAddToExistingRoute(selectedRouteId, place);
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Add place to route
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-2 truncate">
            {place.displayName}
          </p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {routes.length > 0 && (
            <div className="space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={isCreatingNew}
                  onChange={() => setIsCreatingNew(true)}
                  className="w-4 h-4 text-yellow focus:ring-yellow"
                />
                <span className="font-medium text-gray-900">
                  ✨ Create new route
                </span>
              </label>

              {isCreatingNew && (
                <input
                  type="text"
                  value={newRouteName}
                  onChange={(e) => setNewRouteName(e.target.value)}
                  placeholder="Example: Rome 2024"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow focus:border-transparent"
                  autoFocus
                />
              )}
            </div>
          )}

          {routes.length > 0 && (
            <div className="space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={!isCreatingNew}
                  onChange={() => setIsCreatingNew(false)}
                  className="w-4 h-4 text-yellow focus:ring-yellow"
                />
                <span className="font-medium text-gray-900">
                  📋 Add to existing route
                </span>
              </label>

              {!isCreatingNew && (
                <div className="space-y-2 ml-6">
                  {routes.map((route) => (
                    <label
                      key={route.id}
                      className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="route"
                        value={route.id}
                        checked={selectedRouteId === route.id}
                        onChange={(e) => setSelectedRouteId(e.target.value)}
                        className="w-4 h-4 text-yellow focus:ring-yellow"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {route.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {route.places.length} places
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {routes.length === 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Route name
              </label>
              <input
                type="text"
                value={newRouteName}
                onChange={(e) => setNewRouteName(e.target.value)}
                placeholder="Example: Rome 2024"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow focus:border-transparent"
                autoFocus
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isCreatingNew && !newRouteName.trim()}
            className="flex-1 py-2 px-4 bg-yellow hover:bg-yellow/90 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddToRouteModal;
