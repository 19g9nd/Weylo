"use client";
import { useState, useEffect, useCallback } from "react";
import { Place } from "../types/place";
import { placesService } from "../services/placesService";

const STORAGE_KEY = "myPlaces";

const localStorageService = {
  load: async (): Promise<Place[]> => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? (JSON.parse(stored) as Place[]) : [];
    } catch (error) {
      console.error("Error loading places from localStorage:", error);
      return [];
    }
  },
  save: async (places: Place[]): Promise<void> => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(places));
    } catch (error) {
      console.error("Error saving places to localStorage:", error);
    }
  },
};

export const useMyPlaces = () => {
  const [places, setPlaces] = useState<Place[]>([]);
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
        const apiResult = await placesService.getMyPlaces();

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
        console.error("Error loading my places:", error);
        setError("Failed to load places");

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

  // Добавить место из каталога к себе
  const addPlaceFromCatalogue = useCallback(
    async (cataloguePlace: Place) => {
      if (!cataloguePlace.backendId) {
        setError("Invalid place: missing backend ID");
        return;
      }

      if (places.some((p) => p.placeId === cataloguePlace.placeId)) {
        setSelectedPlaceId(cataloguePlace.placeId);
        return;
      }

      // Оптимистичное обновление UI
      setPlaces((prev) => {
        const updated = [...prev, cataloguePlace];
        setSelectedPlaceId(cataloguePlace.placeId);
        return updated;
      });

      try {
        const result = await placesService.addPlaceToUser(
          cataloguePlace.backendId
        );

        if (!result.success) {
          // Откатываем изменения при ошибке
          setPlaces((prev) =>
            prev.filter((p) => p.placeId !== cataloguePlace.placeId)
          );
          setError(`Failed to add place: ${result.error}`);
          setTimeout(() => setError(null), 5000);
        } else {
          setError(null);
        }
      } catch (error) {
        console.error("Error adding place:", error);
        setPlaces((prev) =>
          prev.filter((p) => p.placeId !== cataloguePlace.placeId)
        );
        setError("Failed to add place to your collection");
        setTimeout(() => setError(null), 5000);
      }
    },
    [places]
  );

  // Create place (from Google Places) and add to user's places
  const createAndAddPlace = useCallback(
    async (place: Place) => {
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
          // Update place with backendId returned from API
          if (result.data && result.data.id) {
            setPlaces((prev) =>
              prev.map((p) =>
                p.placeId === place.placeId && result.data
                  ? { ...p, backendId: result.data.id }
                  : p
              )
            );
          }
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
    async (place: Place) => {
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
    },
    [selectedPlaceId]
  );

  const addPlace = useCallback(
    (place: Place) => {
      if (place.backendId) {
        return addPlaceFromCatalogue(place);
      } else {
        return createAndAddPlace(place);
      }
    },
    [addPlaceFromCatalogue, createAndAddPlace]
  );

  const clearAllPlaces = useCallback(() => {
    setPlaces([]);
    setSelectedPlaceId(null);
    // TODO: add API call to clear all places
  }, []);

  const selectedPlace =
    places.find((p) => p.placeId === selectedPlaceId) || null;

  return {
    myPlaces: places,
    selectedPlace,
    addPlaceFromCatalogue,
    createAndAddPlace,
    removePlace,
    clearAllPlaces,
    addPlace,
    setSelectedPlaceId,
    isLoading,
    error,
  };
};
