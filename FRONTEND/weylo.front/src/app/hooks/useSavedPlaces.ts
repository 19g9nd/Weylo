"use client";
import { useState, useEffect, useCallback } from "react";
import { SavedPlace } from "../types/map";
import { placesService } from "../services/placesService";

const STORAGE_KEY = "savedPlaces";

// Localstorage fallback
const localStorageService = {
  load: async (): Promise<SavedPlace[]> => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? (JSON.parse(stored) as SavedPlace[]) : [];
    } catch (error) {
      console.error("Error loading places from localStorage:", error);
      return [];
    }
  },
  save: async (places: SavedPlace[]): Promise<void> => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(places));
    } catch (error) {
      console.error("Error saving places to localStorage:", error);
    }
  },
};

export const useSavedPlaces = () => {
  const [places, setPlaces] = useState<SavedPlace[]>([]);
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
        const apiResult = await placesService.getPlaces();

        if (apiResult.success && apiResult.data) {
          setPlaces(apiResult.data);
          if (apiResult.data.length > 0) {
            setSelectedPlaceId(
              apiResult.data[apiResult.data.length - 1].placeId
            );
          }
        } else {
          console.warn(
            "API unavailable, loading from localStorage:",
            apiResult.error
          );
          const localPlaces = await localStorageService.load();
          setPlaces(localPlaces);
          if (localPlaces.length > 0) {
            setSelectedPlaceId(localPlaces[localPlaces.length - 1].placeId);
          }
        }
      } catch (error) {
        console.error("Error loading places:", error);
        setError("Failed to load places");

        // Localsorage Fallback
        const localPlaces = await localStorageService.load();
        setPlaces(localPlaces);
      } finally {
        setIsLoading(false);
        setLoaded(true);
      }
    };

    loadPlaces();
  }, [loaded]);

  useEffect(() => {
    if (loaded) {
      localStorageService.save(places);
    }
  }, [places, loaded]);

  const addPlace = useCallback(
    async (place: SavedPlace) => {
      if (places.some((p) => p.placeId === place.placeId)) {
        setSelectedPlaceId(place.placeId);
        return;
      }

      setPlaces((prev) => {
        const updated = [...prev, place];
        setSelectedPlaceId(place.placeId);
        return updated;
      });

      try {
        const result = await placesService.savePlace(place);
        if (!result.success) {
          console.error("Failed to save place to API:", result.error);
          setError(
            `Warning: Place saved locally but failed to sync: ${result.error}`
          );

          setTimeout(() => setError(null), 5000);
        } else {
          setError(null);
        }
      } catch (error) {
        console.error("Error saving place:", error);
        setError("Failed to save place to server");
        setTimeout(() => setError(null), 5000);
      }
    },
    [places]
  );

  const removePlace = useCallback(
  async (place: SavedPlace) => {
    setPlaces((prev) => prev.filter((p) => p.placeId !== place.placeId));

    if (selectedPlaceId === place.placeId) {
      setSelectedPlaceId(null);
    }

    if (place.backendId) {
      try {
        const result = await placesService.deletePlace(place.backendId);
        if (!result.success) {
          console.error("Failed to delete place from API:", result.error);
          setError(
            `⚠️ Warning: Place removed locally but failed to sync: ${result.error}`
          );
          setTimeout(() => setError(null), 5000);
        } else {
          setError(null);
        }
      } catch (error) {
        console.error("Error deleting place:", error);
        setError("Failed to delete place from server");
        setTimeout(() => setError(null), 5000);
      }
    }

    console.log(
      `Place ${place.placeId} removed locally (backendId: ${place.backendId})`
    );
  },
  [selectedPlaceId]
);

  const clearAllPlaces = useCallback(() => {
    setPlaces([]);
    setSelectedPlaceId(null);

    // TODO: add API call to clear all places
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
