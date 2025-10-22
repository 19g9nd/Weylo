"use client";
import { useState, useEffect, useCallback } from "react";
import { BasePlace } from "../types/place";
import { placesService } from "../services/placesService";
import { localStorageService } from "../services/localStorageService"; // ← используем единый сервис
import { extractLocationInfo } from "../utils/placeUtils";

export const useSavedPlaces = () => {
  const [places, setPlaces] = useState<BasePlace[]>([]);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loaded) return;

    const loadPlaces = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const apiPlaces = await placesService.getCatalogue();
        setPlaces(apiPlaces);
        await localStorageService.saveCatalogue(apiPlaces);

        if (apiPlaces.length > 0) {
          setSelectedPlaceId(apiPlaces[apiPlaces.length - 1].placeId);
        }
      } catch (error) {
        console.error("Error loading places from API:", error);
        setError("Failed to load places from server");

        // Fallback localStorage
        try {
          const localPlaces = await localStorageService.getAll();
          setPlaces(localPlaces);
          if (localPlaces.length > 0) {
            setSelectedPlaceId(localPlaces[localPlaces.length - 1].placeId);
          }
        } catch (localError) {
          console.error("Error loading places from localStorage:", localError);
        }
      } finally {
        setIsLoading(false);
        setLoaded(true);
      }
    };

    loadPlaces();
  }, [loaded]);

 const addPlace = useCallback(
  async (place: BasePlace) => {
    if (places.some((p) => p.placeId === place.placeId)) {
      setSelectedPlaceId(place.placeId);
      return;
    }

    try {
      const { cityName, countryName } = extractLocationInfo(place.formattedAddress);

      const savedPlace = await placesService.savePlace({
        googlePlaceId: place.placeId,
        name: place.displayName,
        latitude: place.location.lat,
        longitude: place.location.lng,
        address: place.formattedAddress,
        rating: place.rating || undefined,
        imageUrl: place.photos?.[0]?.getURI(),
        googleTypes: place.types || [place.googleType || "general"],
        cityName,
        countryName,
      });

      if (!savedPlace) {
        throw new Error("Failed to save place to backend");
      }

      const placeWithBackendId = {
        ...place,
        backendId: savedPlace.backendId
      };

      setPlaces((prev) => {
        const updated = [...prev, placeWithBackendId];
        return updated;
      });
      setSelectedPlaceId(place.placeId);

      const updatedPlaces = [...places, placeWithBackendId];
      await localStorageService.saveCatalogue(updatedPlaces);
      setError(null);
    } catch (error) {
      console.error("Error saving place:", error);
      setError("Failed to save place to server");
    }
  },
  [places]
);

  const removePlace = useCallback(
    async (place: BasePlace) => {
      setPlaces((prev) => prev.filter((p) => p.placeId !== place.placeId));

      if (selectedPlaceId === place.placeId) {
        setSelectedPlaceId(null);
      }

      try {
        if (place.backendId) {
          await placesService.deletePlace(place.backendId);
        }
        const updatedPlaces = places.filter((p) => p.placeId !== place.placeId);
        await localStorageService.saveCatalogue(updatedPlaces);

        setError(null);
      } catch (error) {
        console.error("Error deleting place:", error);
        setError("Failed to delete place from server");

        setPlaces((prev) => [...prev, place]);
        setTimeout(() => setError(null), 5000);
      }
    },
    [places, selectedPlaceId]
  );

  const clearAllPlaces = useCallback(async () => {
    setPlaces([]);
    setSelectedPlaceId(null);

    try {
      await localStorageService.saveCatalogue([]);
      // TODO: добавить вызов API для очистки всех мест
    } catch (error) {
      console.error("Error clearing places:", error);
    }
  }, []);

  const selectedPlace =
    places.find((p) => p.placeId === selectedPlaceId) || null;

  return {
    places,
    selectedPlace,
    addPlace,
    removePlace,
    clearAllPlaces,
    setSelectedPlaceId,
    isLoading,
    error,
  };
};
