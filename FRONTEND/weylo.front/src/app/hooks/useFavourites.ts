import { useState, useEffect } from "react";
import { Place } from "../types/place";
import { favouritesService } from "../services/favouritesService";
import { transformBackendToFrontendPlace } from "../utils/transformers";

export const useFavourites = () => {
  const [favourites, setFavourites] = useState<Place[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFavourites();
  }, []);

  const loadFavourites = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await favouritesService.getFavourites();
      const transformedFavourites = data.map(transformBackendToFrontendPlace);
      setFavourites(transformedFavourites);
    } catch (err) {
      console.error("Error loading favourites:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load favourites"
      );
      // Fallback to localStorage
      const saved = localStorage.getItem("weylo-favourites");
      if (saved) {
        try {
          setFavourites(JSON.parse(saved));
        } catch (parseError) {
          console.error("Error parsing local favourites:", parseError);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const addToFavourites = async (place: Place) => {
    try {
      if (!place.backendId) {
        throw new Error("Place is not from catalogue - missing backendId");
      }

      await favouritesService.addToFavourites(place.backendId);

      setFavourites((prev) => {
        const updated = [...prev, place];
        localStorage.setItem("weylo-favourites", JSON.stringify(updated));
        return updated;
      });
    } catch (err) {
      console.error("Error adding to favourites:", err);
      throw err;
    }
  };

  const removeFromFavourites = async (place: Place) => {
    try {
      if (!place.backendId) {
        throw new Error("Place is not from catalogue - missing backendId");
      }

      await favouritesService.removeFromFavourites(place.backendId);

      setFavourites((prev) => {
        const updated = prev.filter((p) => p.placeId !== place.placeId);
        localStorage.setItem("weylo-favourites", JSON.stringify(updated));
        return updated;
      });
    } catch (err) {
      console.error("Error removing from favourites:", err);
      throw err;
    }
  };

  const isFavourite = (placeId: string) => {
    return favourites.some((p) => p.placeId === placeId);
  };

  return {
    favourites,
    isLoading,
    error,
    addToFavourites,
    removeFromFavourites,
    isFavourite,
    refetch: loadFavourites,
  };
};
