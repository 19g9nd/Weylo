"use client";
import { useState, useEffect } from "react";
import { Place } from "../types/place";
import { placesService } from "../services/placesService";

export const usePlacesCatalogue = () => {
  const [places, setPlaces] = useState<Place[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPlaces();
  }, []);

  const loadPlaces = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await placesService.getPlaces();

      if (result.success && result.data) {
        setPlaces(result.data);
      } else {
        setError(result.error || "Failed to load catalogue");
      }
    } catch (err) {
      console.error("Error loading catalogue:", err);
      setError("Failed to load catalogue");
    } finally {
      setIsLoading(false);
    }
  };

  // Should be admin only
  const deleteFromCatalogue = async (backendId: number) => {
    try {
      const result = await placesService.deletePlace(backendId);

      if (result.success) {
        setPlaces((prev) => prev.filter((p) => p.backendId !== backendId));
        setError(null);
      } else {
        setError(result.error || "Failed to delete place");
      }
    } catch (err) {
      console.error("Error deleting from catalogue:", err);
      setError("Failed to delete place");
    }
  };

  return {
    cataloguePlaces: places,
    isLoading,
    error,
    refresh: loadPlaces,
    deleteFromCatalogue,
  };
};