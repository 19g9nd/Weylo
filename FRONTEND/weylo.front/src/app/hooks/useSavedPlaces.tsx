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
      return stored ? JSON.parse(stored) as SavedPlace[] : [];
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
  }
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
        const apiResult = await placesService.getMyPlaces();
        
        if (apiResult.success && apiResult.data) {
          setPlaces(apiResult.data);
          if (apiResult.data.length > 0) {
            setSelectedPlaceId(apiResult.data[apiResult.data.length - 1].placeId);
          }
        } else {
          console.warn("API unavailable, loading from localStorage:", apiResult.error);
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
    if (!loaded) return;
    localStorageService.save(places);
  }, [places, loaded]);

  const addPlace = useCallback(async (place: SavedPlace) => {
    if (places.some(p => p.placeId === place.placeId)) {
      setSelectedPlaceId(place.placeId);
      return;
    }

    setPlaces(prev => {
      const updated = [...prev, place];
      setSelectedPlaceId(place.placeId);
      return updated;
    });

    try {
      const result = await placesService.savePlace(place);
      if (!result.success) {
        console.error("Failed to save place to API:", result.error);
        setError(`Warning: Place saved locally but failed to sync: ${result.error}`);
        
        setTimeout(() => setError(null), 5000);
      } else {
        setError(null);
      }
    } catch (error) {
      console.error("Error saving place:", error);
      setError("Failed to save place to server");
      setTimeout(() => setError(null), 5000);
    }
  }, [places]);

  const removePlace = useCallback((placeId: string) => {
    setPlaces(prev => {
      const updated = prev.filter(p => p.placeId !== placeId);
      if (selectedPlaceId === placeId) {
        setSelectedPlaceId(updated.length > 0 ? updated[updated.length - 1].placeId : null);
      }
      return updated;
    });

    // TODO: Добавить API вызов для удаления с сервера
    // placesService.deletePlace(placeId);
  }, [selectedPlaceId]);

  const clearAllPlaces = useCallback(() => {
    setPlaces([]);
    setSelectedPlaceId(null);
    
    // TODO: Добавить API вызов для очистки всех мест
  }, []);

  const selectedPlace = places.find(p => p.placeId === selectedPlaceId) || null;

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