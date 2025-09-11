"use client";

import React from "react";
import {
  AdvancedMarker,
  APIProvider,
  ControlPosition,
  Map,
  Pin,
  useMap,
} from "@vis.gl/react-google-maps";
import { useSavedPlaces } from "../hooks/useSavedPlaces";
import { SavedPlace } from "../types/map";
import { convertGooglePlaceToSaved } from "../utils/placeUtils";
import Sidebar from "../components/sidebar/sidebar";
import AutocompleteControl from "../components/autocomplete/control";
import Head from "next/head";
import Navigation from "../components/ui/navigation";
// @ts-ignore
const API_KEY: string = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string;

const MapWithMarkers = ({
  places,
  selectedPlace,
}: {
  places: SavedPlace[];
  selectedPlace: SavedPlace | null;
}) => {
  const map = useMap();

  // Center map on selected place
  React.useEffect(() => {
    if (!map || !selectedPlace) return;

    map.panTo(selectedPlace.location);
    map.setZoom(14);
  }, [map, selectedPlace]);

  return (
    <>
      {places.map((place) => (
        <AdvancedMarker key={place.placeId} position={place.location}>
          <Pin
            background={
              selectedPlace?.placeId === place.placeId
                ? "#FFD514" // Weylo yellow
                : "#00BFA5" // Teal accent
            }
            borderColor="#1E3A8A" // Dark blue border
            glyphColor="#FFFFFF" // White glyph
          />
        </AdvancedMarker>
      ))}
    </>
  );
};

const MapPage = () => {
  const { places, selectedPlace, addPlace, removePlace, setSelectedPlaceId } =
    useSavedPlaces();

  const handlePlaceSelect = (place: google.maps.places.Place | null) => {
    if (!place) return;

    const savedPlace = convertGooglePlaceToSaved(place);
    if (savedPlace) {
      addPlace(savedPlace);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-yellow/30 to-background/80">
      <Head>
        <title>Explore Destinations - Weylo</title>
        <meta
          name="description"
          content="Discover and save amazing travel destinations with Weylo"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Navigation */}
      <Navigation />

      {/* Hero Section */}
      <section className="relative h-64 flex items-center justify-center">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0"></div>
        </div>
        <div className="z-10 text-center px-4">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-main-text">
            Explore Destinations
          </h1>
          <p className="text-lg text-brown-text max-w-2xl mx-auto">
            Discover amazing places around the world and save them to your
            travel plans
          </p>
        </div>
      </section>

      {/* Map Section */}
      <div className="flex flex-col md:flex-row h-[calc(100vh-16rem)] md:h-[70vh] mx-4 md:mx-16 mb-8 rounded-lg overflow-hidden shadow-lg">
        <APIProvider apiKey={API_KEY} version={"quarterly"}>
          <Map
            mapId={"49ae42fed52588c3"}
            defaultZoom={3}
            defaultCenter={{ lat: 22.54992, lng: 0 }}
            gestureHandling={"greedy"}
            disableDefaultUI={false}
            className="flex-1 rounded-lg"
            styles={[
              {
                elementType: "geometry",
                stylers: [{ color: "#f5f5f5" }],
              },
              {
                elementType: "labels.icon",
                stylers: [{ visibility: "off" }],
              },
              {
                elementType: "labels.text.fill",
                stylers: [{ color: "#616161" }],
              },
              {
                elementType: "labels.text.stroke",
                stylers: [{ color: "#f5f5f5" }],
              },
              {
                featureType: "administrative.land_parcel",
                stylers: [{ visibility: "off" }],
              },
              {
                featureType: "administrative.neighborhood",
                stylers: [{ visibility: "off" }],
              },
              {
                featureType: "poi",
                elementType: "labels.text",
                stylers: [{ visibility: "off" }],
              },
              {
                featureType: "road",
                elementType: "labels.icon",
                stylers: [{ visibility: "off" }],
              },
              {
                featureType: "transit",
                stylers: [{ visibility: "off" }],
              },
              {
                featureType: "water",
                elementType: "geometry",
                stylers: [{ color: "#c5e4f9" }],
              },
              {
                featureType: "water",
                elementType: "labels.text.fill",
                stylers: [{ color: "#9e9e9e" }],
              },
            ]}
          >
            <AutocompleteControl
              controlPosition={ControlPosition.TOP_LEFT}
              onPlaceSelect={handlePlaceSelect}
            />

            <MapWithMarkers places={places} selectedPlace={selectedPlace} />
          </Map>
        </APIProvider>

        <div className="w-full md:w-96 bg-white rounded-lg md:rounded-l-none shadow-md md:ml-4 mt-4 md:mt-0">
          <Sidebar
            places={places}
            selectedPlaceId={selectedPlace?.placeId || null}
            onPlaceSelect={setSelectedPlaceId}
            onPlaceRemove={removePlace}
          />
        </div>
      </div>
    </div>
  );
};

export default MapPage;
