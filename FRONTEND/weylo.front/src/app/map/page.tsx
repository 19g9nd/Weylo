"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  AdvancedMarker,
  APIProvider,
  ControlPosition,
  Map,
  Pin,
  useMap,
} from "@vis.gl/react-google-maps";
import { useSavedPlaces } from "../hooks/useSavedPlaces";
import { useRoutes } from "../hooks/useRoutes";
import { SavedPlace } from "../types/map";
import { Route, SidebarMode } from "../types/sidebar";
import { convertGooglePlaceToSaved } from "../utils/placeUtils";
import AutocompleteControl from "../components/autocomplete/control";
import Head from "next/head";
import Navigation from "../components/ui/navigation";
import { useSearchParams } from "next/navigation";
import { countriesService } from "../services/countriesService";
import AddToRouteModal from "../components/modal/addToRouteModal";
import UnifiedSidebar from "../components/sidebar/unifiedSidebar";
import { SupportedCountry } from "../types/country";
import { optimizeRouteDay } from "../utils/routeUtils";
import RouteEditModal from "../components/modal/routeEditModal";
import { useAuth } from "../context/AuthContext";

const API_KEY: string = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string;

const MapWithMarkers = ({
  places,
  selectedPlace,
  selectedCountry,
  sidebarMode,
  routePlaces,
  activeRoute,
}: {
  places: SavedPlace[];
  selectedPlace: SavedPlace | null;
  selectedCountry: SupportedCountry | null;
  sidebarMode: SidebarMode;
  routePlaces: SavedPlace[];
  activeRoute: Route | null;
}) => {
  const map = useMap();
  const boundsSetRef = useRef<string | null>(null);

  // Restrict map to selected country bounds
  React.useEffect(() => {
    if (!map || !selectedCountry) return;

    if (boundsSetRef.current === selectedCountry.code) return;

    const bounds = new google.maps.LatLngBounds(
      { lat: selectedCountry.southBound, lng: selectedCountry.westBound },
      { lat: selectedCountry.northBound, lng: selectedCountry.eastBound }
    );

    setTimeout(() => {
      map.fitBounds(bounds);

      map.setOptions({
        restriction: {
          latLngBounds: bounds,
          strictBounds: false,
        },
        minZoom: 5,
      });

      boundsSetRef.current = selectedCountry.code;
    }, 100);
  }, [map, selectedCountry]);

  React.useEffect(() => {
    boundsSetRef.current = null;
  }, [selectedCountry?.code]);

  // Selected place panning
  React.useEffect(() => {
    if (!map || !selectedPlace) return;

    map.panTo(selectedPlace.location);
    map.setZoom(14);
  }, [map, selectedPlace]);

  // Display route with polyline
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

const MapPage = () => {
  const { user, isAuthenticated } = useAuth();
  const searchParams = useSearchParams();
  const [selectedCountry, setSelectedCountry] =
    useState<SupportedCountry | null>(null);
  const [isLoadingCountry, setIsLoadingCountry] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const countryLoadedRef = useRef(false);

  // Sidebar state
  const [sidebarMode, setSidebarMode] = useState<SidebarMode>(
    SidebarMode.WELCOME
  );

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [placeToAdd, setPlaceToAdd] = useState<SavedPlace | null>(null);
  const [routeEditModalOpen, setRouteEditModalOpen] = useState(false);
  const [routeToEdit, setRouteToEdit] = useState<Route | null>(null);
  const [showRouteSelectionModal, setShowRouteSelectionModal] = useState(false);
  const [pendingPlace, setPendingPlace] = useState<SavedPlace | null>(null);

  const {
    places,
    selectedPlace,
    addPlace,
    removePlace,
    setSelectedPlaceId,
    isLoading,
    error,
  } = useSavedPlaces();

  const {
    routes,
    activeRoute,
    activeRouteId,
    loaded,
    syncing,
    unsyncedCount,
    setActiveRouteId,
    setUserId,
    createRoute,
    updateRoute,
    deleteRoute,
    addPlaceToRoute,
    removePlaceFromRoute,
    addDayToRoute,
    removeDayFromRoute,
    movePlaceInRoute,
    duplicateRoute,
    getRouteStats,
    syncAllRoutes,
  } = useRoutes();

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      setUserId(user.id);
    } else {
      // Clear user ID and routes when logged out
      setUserId(null);
    }
  }, [isAuthenticated, user?.id, setUserId]);

  // Load country data from URL parameters
  useEffect(() => {
    const loadCountryFromParams = async () => {
      const countryCode = searchParams.get("country");
      if (!countryCode || countryLoadedRef.current) return;

      setIsLoadingCountry(true);
      try {
        const response = await countriesService.getCountryByCode(countryCode);
        if (response.success && response.data) {
          setSelectedCountry(response.data);
          setSidebarMode(SidebarMode.COUNTRY_EXPLORATION);
          countryLoadedRef.current = true;
        }
      } catch (error) {
        console.error("Error loading country:", error);
      } finally {
        setIsLoadingCountry(false);
      }
    };

    loadCountryFromParams();
  }, [searchParams]);

  // Auto-switch to first route when entering planning mode
  useEffect(() => {
    if (
      sidebarMode === SidebarMode.ROUTE_PLANNING &&
      !activeRouteId &&
      routes.length > 0
    ) {
      setActiveRouteId(routes[0].id);
    }
  }, [sidebarMode, activeRouteId, routes, setActiveRouteId]);

  // Reset selected place when changing modes
  useEffect(() => {
    if (sidebarMode !== SidebarMode.COUNTRY_EXPLORATION) {
      setSelectedPlaceId(null);
    }
  }, [sidebarMode, setSelectedPlaceId]);

  const handlePlaceSelect = (place: google.maps.places.Place | null) => {
    if (!place) return;

    const savedPlace = convertGooglePlaceToSaved(place);
    if (!savedPlace) return;

    if (sidebarMode === SidebarMode.ROUTE_PLANNING && activeRouteId) {
      setPendingPlace(savedPlace);
      setShowRouteSelectionModal(true);
    } else {
      addPlace(savedPlace);
    }
  };

  const handleQuickAddToActiveRoute = (place: SavedPlace) => {
    if (activeRouteId && activeRoute) {
      const maxDay =
        activeRoute.places.length > 0
          ? Math.max(...activeRoute.places.map((p) => p.dayNumber))
          : 1;
      addPlaceToRoute(activeRouteId, place, maxDay);
    }
    setShowRouteSelectionModal(false);
    setPendingPlace(null);
  };

  const handleAddToRouteClick = (place: SavedPlace) => {
    setPlaceToAdd(place);
    setModalOpen(true);
  };

  const handleCreateNewRoute = async (name: string, place: SavedPlace) => {
    const newRoute = await createRoute(name);
    if (newRoute) {
      addPlaceToRoute(newRoute.id, place, 1);
      setSidebarMode(SidebarMode.ROUTE_PLANNING);
    }
  };

  const handleAddToExistingRoute = (routeId: string, place: SavedPlace) => {
    const route = routes.find((r) => r.id === routeId);
    const maxDay =
      route && route.places.length > 0
        ? Math.max(...route.places.map((p) => p.dayNumber))
        : 1;
    addPlaceToRoute(routeId, place, maxDay);
  };

  const handleEditRoute = (route: Route) => {
    setRouteToEdit(route);
    setRouteEditModalOpen(true);
  };

  const handleSaveRoute = async (routeId: string, updates: Partial<Route>) => {
    await updateRoute(routeId, updates);
    setRouteEditModalOpen(false);
    setRouteToEdit(null);
  };

  const handleRouteSelect = (routeId: string) => {
    setActiveRouteId(routeId);
    setSidebarMode(SidebarMode.ROUTE_PLANNING);
  };

  const handleCreateRoute = async () => {
    const name = prompt("Route name:");
    if (name) {
      const newRoute = await createRoute(name);
      if (newRoute) {
        setSidebarMode(SidebarMode.ROUTE_PLANNING);
        return newRoute;
      }
    }
    return null;
  };

  const handleDeleteRoute = async (routeId: string) => {
    if (confirm("Are you sure you want to delete this route?")) {
      await deleteRoute(routeId);
    }
  };

  const handleAddPlaceToRouteWithDay = (place: SavedPlace) => {
    if (activeRouteId) {
      const route = routes.find((r) => r.id === activeRouteId);
      if (!route) return;

      const targetDay =
        route.places.length > 0
          ? Math.max(...route.places.map((p) => p.dayNumber))
          : 1;

      addPlaceToRoute(activeRouteId, place, targetDay);
    } else {
      setPlaceToAdd(place);
      setModalOpen(true);
    }
  };

  const handleMovePlaceInRoute = (
    routeId: string,
    placeId: string,
    newDayNumber: number,
    newOrderInDay: number
  ) => {
    movePlaceInRoute(routeId, placeId, newDayNumber, newOrderInDay);
  };

  const handleOptimizeRouteDay = (routeId: string, dayNumber: number) => {
    const route = routes.find((r) => r.id === routeId);
    if (!route) return;

    const dayPlaces = route.places.filter((p) => p.dayNumber === dayNumber);
    const optimizedPlaces = optimizeRouteDay(dayPlaces);

    optimizedPlaces.forEach((place, index) => {
      movePlaceInRoute(routeId, place.placeId, dayNumber, index + 1);
    });
  };

  const handleGetRouteStats = (routeId: string) => {
    return getRouteStats(routeId);
  };

  const getRouteStatus = (route: Route) => {
    if (!route.startDate || !route.endDate)
      return { label: "Draft", color: "gray" };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (route.startDate > today) return { label: "Upcoming", color: "blue" };
    if (route.endDate < today) return { label: "Completed", color: "green" };
    return { label: "Active", color: "yellow" };
  };

  const handleSwitchMode = (mode: SidebarMode) => {
    setSidebarMode(mode);
    setSelectedPlaceId(null);

    if (
      mode === SidebarMode.ROUTE_PLANNING &&
      !activeRouteId &&
      routes.length > 0
    ) {
      setActiveRouteId(routes[0].id);
    }
  };

// Get places for active route
  const routePlaces: SavedPlace[] = React.useMemo(() => {
    if (!activeRoute) return [];

    return activeRoute.places.map((rp) => {
      const savedPlace = places.find((p) => p.placeId === rp.placeId);
      return (
        savedPlace || {
          placeId: rp.placeId,
          displayName: rp.displayName,
          formattedAddress: rp.formattedAddress,
          location: rp.location,
        }
      );
    });
  }, [activeRoute, places]);

  return (
    <div className="min-h-screen bg-gradient-to-r from-yellow/30 to-background/80">
      <Head>
        <title>Explore Destinations - Weylo</title>
        <meta
          name="description"
          content="Discover and save amazing travel destinations with Weylo"
        />
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <Navigation />

      {/* Hero Section */}
      <section className="relative pt-20 pb-8 md:pb-12 px-4">
        <div className="z-10 text-center max-w-4xl mx-auto">
          <h1 className="text-2xl md:text-4xl font-bold mb-3 md:mb-4 text-main-text">
            {sidebarMode === SidebarMode.ROUTE_PLANNING && activeRoute
              ? `Route: ${activeRoute.name}`
              : selectedCountry
              ? `Explore ${selectedCountry.name}`
              : "Explore Destinations"}
          </h1>
          <p className="text-base md:text-lg text-brown-text">
            {sidebarMode === SidebarMode.ROUTE_PLANNING
              ? "Plan your journey day by day"
              : selectedCountry
              ? `Discover amazing places in ${selectedCountry.name}`
              : "Create your perfect travel itinerary"}
          </p>
        </div>

        {/* Mode Switcher with Sync Indicator */}
        <div className="flex justify-center items-center gap-2 mt-4">
          <button
            onClick={() => handleSwitchMode(SidebarMode.COUNTRY_EXPLORATION)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              sidebarMode === SidebarMode.COUNTRY_EXPLORATION
                ? "bg-yellow text-white"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            🌍 Exploration
          </button>
          <button
            onClick={() => handleSwitchMode(SidebarMode.MY_ROUTES)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors relative ${
              sidebarMode === SidebarMode.MY_ROUTES ||
              sidebarMode === SidebarMode.ROUTE_PLANNING
                ? "bg-yellow text-white"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            📋 My Routes ({routes.length})
            {unsyncedCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {unsyncedCount}
              </span>
            )}
          </button>

          {/* Sync Button */}
          {unsyncedCount > 0 && (
            <button
              onClick={syncAllRoutes}
              disabled={syncing}
              className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                syncing
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-blue-500 text-white hover:bg-blue-600"
              }`}
              title={`Sync ${unsyncedCount} route${
                unsyncedCount > 1 ? "s" : ""
              }`}
            >
              {syncing ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Syncing...
                </span>
              ) : (
                `🔄 Sync (${unsyncedCount})`
              )}
            </button>
          )}
        </div>
      </section>

      {/* Loading indicator for country */}
      {isLoadingCountry && (
        <div className="text-center py-2 md:py-4">
          <div className="animate-spin rounded-full h-6 w-6 md:h-8 md:w-8 border-b-2 border-yellow mx-auto mb-2"></div>
          <p className="text-brown-text text-sm md:text-base">
            Loading country information...
          </p>
        </div>
      )}

      {/* Map Section */}
      <div className="flex flex-col md:flex-row h-[500px] md:h-[70vh] mx-2 md:mx-8 lg:mx-16 mb-4 md:mb-8 rounded-lg overflow-hidden shadow-lg bg-white">
        <div className="flex-1 min-h-[300px] md:min-h-0 relative rounded-lg overflow-hidden">
          {!mapLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow mx-auto mb-2"></div>
                <p className="text-brown-text text-sm">Loading map...</p>
              </div>
            </div>
          )}

          <APIProvider
            apiKey={API_KEY}
            version="beta"
            onLoad={() => setMapLoaded(true)}
          >
            <Map
              mapId="49ae42fed52588c3"
              defaultZoom={selectedCountry ? 6 : 3}
              defaultCenter={
                selectedCountry
                  ? {
                      lat:
                        (selectedCountry.northBound +
                          selectedCountry.southBound) /
                        2,
                      lng:
                        (selectedCountry.eastBound +
                          selectedCountry.westBound) /
                        2,
                    }
                  : { lat: 22.54992, lng: 0 }
              }
              gestureHandling="greedy"
              disableDefaultUI
              zoomControl
              mapTypeControl={false}
              scaleControl
              streetViewControl={false}
              rotateControl={false}
              fullscreenControl
              className="w-full h-full"
            >
              <AutocompleteControl
                controlPosition={ControlPosition.TOP}
                onPlaceSelect={handlePlaceSelect}
                selectedCountry={selectedCountry}
              />

              <MapWithMarkers
                places={places}
                selectedPlace={selectedPlace}
                selectedCountry={selectedCountry}
                sidebarMode={sidebarMode}
                routePlaces={routePlaces}
                activeRoute={activeRoute}
              />
            </Map>
          </APIProvider>
        </div>

        {/* Unified Sidebar */}
        <div className="w-full md:w-96 lg:w-[420px] bg-white rounded-lg md:rounded-l-none shadow-md md:ml-2 lg:ml-4 mt-2 md:mt-0 md:border-l md:border-gray-200">
          <div className="h-full max-h-[400px] md:max-h-none overflow-hidden">
            <UnifiedSidebar
              mode={sidebarMode}
              places={places}
              selectedPlaceId={selectedPlace?.placeId || null}
              onPlaceSelect={setSelectedPlaceId}
              onRemovePlace={removePlace}
              selectedCountry={selectedCountry}
              activeRoute={activeRoute}
              routes={routes}
              onSelectRoute={handleRouteSelect}
              onCreateRoute={handleCreateRoute}
              onEditRoute={handleEditRoute}
              onDeleteRoute={handleDeleteRoute}
              onDuplicateRoute={duplicateRoute}
              onAddPlaceToRoute={handleAddPlaceToRouteWithDay}
              onRemovePlaceFromRoute={(placeId: string) => {
                if (activeRouteId) {
                  removePlaceFromRoute(activeRouteId, placeId);
                }
              }}
              onMovePlaceInRoute={handleMovePlaceInRoute}
              onOptimizeRouteDay={handleOptimizeRouteDay}
              onAddDay={(routeId: string) => {
                addDayToRoute(routeId);
              }}
              onRemoveDay={(routeId: string, dayNumber: number) => {
                if (confirm(`Delete day ${dayNumber} and all its places?`)) {
                  removeDayFromRoute(routeId, dayNumber);
                }
              }}
              onGetRouteStats={handleGetRouteStats}
              onGetRouteStatus={getRouteStatus}
              onSwitchMode={handleSwitchMode}
              isLoading={isLoading || !loaded}
              error={error}
            />
          </div>
        </div>
      </div>

      {/* Add to Route Modal */}
      <AddToRouteModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        place={placeToAdd}
        routes={routes}
        onCreateNewRoute={handleCreateNewRoute}
        onAddToExistingRoute={handleAddToExistingRoute}
      />

      {/* Route Edit Modal */}
      <RouteEditModal
        isOpen={routeEditModalOpen}
        onClose={() => {
          setRouteEditModalOpen(false);
          setRouteToEdit(null);
        }}
        route={routeToEdit}
        onSave={handleSaveRoute}
      />

      {/* Mobile Tips */}
      <div className="md:hidden text-center px-4 mb-4">
        <p className="text-xs text-brown-text">
          💡 Pinch to zoom and drag to move the map
        </p>
      </div>
    </div>
  );
};

export default MapPage;