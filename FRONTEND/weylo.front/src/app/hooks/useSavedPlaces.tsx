"use client";
import { useState, useEffect, useCallback } from "react";
import { SavedPlace } from "../types/map";

const STORAGE_KEY = "savedPlaces";

const placeService = {
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

  useEffect(() => {
    if (loaded) return;
    placeService.load().then(parsedPlaces => {
      if (parsedPlaces.length > 0) {
        setPlaces(parsedPlaces);
        setSelectedPlaceId(parsedPlaces[parsedPlaces.length - 1].placeId);
      }
      setLoaded(true);
    });
  }, [loaded]);

  //save with places change
  useEffect(() => {
    if (!loaded) return;
    placeService.save(places);
  }, [places, loaded]);

  const addPlace = useCallback((place: SavedPlace) => {
    setPlaces(prev => {
      if (prev.some(p => p.placeId === place.placeId)) return prev;
      const updated = [...prev, place];
      setSelectedPlaceId(place.placeId);
      return updated;
    });
  }, []);

  const removePlace = useCallback((placeId: string) => {
    setPlaces(prev => {
      const updated = prev.filter(p => p.placeId !== placeId);
      if (selectedPlaceId === placeId) {
        setSelectedPlaceId(updated.length > 0 ? updated[updated.length - 1].placeId : null);
      }
      return updated;
    });
  }, [selectedPlaceId]);

  const clearAllPlaces = useCallback(() => {
    setPlaces([]);
    setSelectedPlaceId(null);
  }, []);

  const selectedPlace = places.find(p => p.placeId === selectedPlaceId) || null;

  return {
    places,
    selectedPlace,
    addPlace,
    removePlace,
    clearAllPlaces,
    setSelectedPlaceId,
  };
};
