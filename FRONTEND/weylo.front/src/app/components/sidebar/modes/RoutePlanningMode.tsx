import { UnifiedSidebarProps, SidebarMode } from "@/src/app/types/sidebar";
import { getPrimaryCategory } from "@/src/app/utils/filterUtils";
import { groupPlacesByDay } from "@/src/app/utils/routeUtils";

interface RoutePlanningModeProps {
  activeRoute: UnifiedSidebarProps["activeRoute"];
  onSwitchMode: UnifiedSidebarProps["onSwitchMode"];
  onEditRoute: UnifiedSidebarProps["onEditRoute"];
  onAddDay: UnifiedSidebarProps["onAddDay"];
  onRemoveDay: UnifiedSidebarProps["onRemoveDay"];
  onMovePlaceInRoute: UnifiedSidebarProps["onMovePlaceInRoute"];
  onOptimizeRouteDay: UnifiedSidebarProps["onOptimizeRouteDay"];
  onRemovePlaceFromRoute: UnifiedSidebarProps["onRemovePlaceFromRoute"];
  onGetRouteStats: UnifiedSidebarProps["onGetRouteStats"];
  onGetRouteStatus: UnifiedSidebarProps["onGetRouteStatus"];
  onDuplicateRoute: UnifiedSidebarProps["onDuplicateRoute"];
  onDeleteRoute: UnifiedSidebarProps["onDeleteRoute"];
}

export const RoutePlanningMode: React.FC<RoutePlanningModeProps> = ({
  activeRoute,
  onSwitchMode,
  onEditRoute,
  onAddDay,
  onRemoveDay,
  onMovePlaceInRoute,
  onOptimizeRouteDay,
  onRemovePlaceFromRoute,
  onGetRouteStats,
  onGetRouteStatus,
  onDuplicateRoute,
  onDeleteRoute,
}) => {
  if (!activeRoute) return null;

  const days = groupPlacesByDay(activeRoute.places, activeRoute.startDate);
  const stats = onGetRouteStats(activeRoute.id);
  const status = onGetRouteStatus(activeRoute);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
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
            <span className="text-gray-700">📍 {stats.totalPlaces} places</span>
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

      {/* Days */}
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

      {/* Footer */}
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