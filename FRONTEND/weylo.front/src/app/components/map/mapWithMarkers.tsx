"use client";
import React from "react";
import { AdvancedMarker, Pin, useMap } from "@vis.gl/react-google-maps";
import { SavedPlace } from "../../types/map";
import { Route, SidebarMode } from "../../types/sidebar";
import { SupportedCountry } from "../../types/country";

interface MapWithMarkersProps {
  places: SavedPlace[];
  selectedPlace: SavedPlace | null;
  selectedCountry: SupportedCountry | null;
  sidebarMode: SidebarMode;
  routePlaces: SavedPlace[];
  activeRoute: Route | null;
}

export const MapWithMarkers: React.FC<MapWithMarkersProps> = ({
  places,
  selectedPlace,
  selectedCountry,
  sidebarMode,
  routePlaces,
  activeRoute,
}) => {
  const map = useMap();
  const boundsSetRef = React.useRef<string | null>(null);
  const [isUserInteracting, setIsUserInteracting] = React.useState(false);

  React.useEffect(() => {
    if (!map) return;

    const listeners = [
      map.addListener("dragstart", () => setIsUserInteracting(true)),
      map.addListener("zoom_changed", () => setIsUserInteracting(true)),
      map.addListener("click", () => setIsUserInteracting(true)),
    ];

    return () => listeners.forEach((listener) => listener.remove());
  }, [map]);

  React.useEffect(() => {
    if (!map || !selectedCountry || isUserInteracting) return;
    if (boundsSetRef.current === selectedCountry.code) return;

    const bounds = new google.maps.LatLngBounds(
      { lat: selectedCountry.southBound, lng: selectedCountry.westBound },
      { lat: selectedCountry.northBound, lng: selectedCountry.eastBound }
    );

    map.fitBounds(bounds);
    boundsSetRef.current = selectedCountry.code;
  }, [map, selectedCountry, isUserInteracting]);

  React.useEffect(() => {
    if (!map || !selectedPlace) return;

    setIsUserInteracting(true); 
    map.panTo(selectedPlace.location);
    map.setZoom(14);

    const timer = setTimeout(() => setIsUserInteracting(false), 1000);
    return () => clearTimeout(timer);
  }, [map, selectedPlace]);

  React.useEffect(() => {
    if (!map || !activeRoute || sidebarMode !== SidebarMode.ROUTE_PLANNING)
      return;

    const routePath = routePlaces.map((place) => place.location);

    if (routePath.length > 1) {
      const polyline = new google.maps.Polyline({
        path: routePath,
        geodesic: true,
        strokeColor: "#3B82F6",
        strokeOpacity: 0.8,
        strokeWeight: 4,
        map: map,
      });

      return () => {
        polyline.setMap(null);
      };
    }
  }, [map, activeRoute, routePlaces, sidebarMode]);

  const displayPlaces = React.useMemo(() => {
    return sidebarMode === SidebarMode.ROUTE_PLANNING ? routePlaces : places;
  }, [sidebarMode, routePlaces, places]);

  return (
    <>
      {displayPlaces.map((place, index) => {
        const markerKey = `${sidebarMode}-${place.placeId}`;

        return (
          <AdvancedMarker key={markerKey} position={place.location}>
            <Pin
              background={
                selectedPlace?.placeId === place.placeId
                  ? "#FFD514"
                  : sidebarMode === SidebarMode.ROUTE_PLANNING
                  ? "#3B82F6"
                  : "#00BFA5"
              }
              borderColor="#1E3A8A"
              glyphColor="#FFFFFF"
            />
            {sidebarMode === SidebarMode.ROUTE_PLANNING && (
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                {index + 1}
              </div>
            )}
          </AdvancedMarker>
        );
      })}
    </>
  );
};

export default MapWithMarkers;