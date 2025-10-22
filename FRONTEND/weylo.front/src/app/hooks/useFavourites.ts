import { useState, useEffect } from "react";
import { FavouritePlace } from "../types/place";
import { favouritesService } from "../services/favouritesService";
import { localStorageService } from "../services/localStorageService";

export const useFavourites = () => {
  const [favourites, setFavourites] = useState<FavouritePlace[]>([]);
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
      setFavourites(data);

      await localStorageService.saveFavourites(data);
    } catch (err) {
      console.error("Error loading favourites from backend:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load favourites"
      );

      // Fallback localStorage
      try {
        const localFavourites = await localStorageService.getFavourites();
        setFavourites(localFavourites);
      } catch (localError) {
        console.error(
          "Error loading favourites from localStorage:",
          localError
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const addToFavourites = async (place: FavouritePlace) => {
    try {
      if (!place.backendId) {
        throw new Error("Place is not from catalogue - missing backendId");
      }
      await favouritesService.addToFavourites(place.backendId);
      setFavourites((prev) => {
        const updated = [...prev, place];
        localStorageService.saveFavourites(updated);
        return updated;
      });
    } catch (err) {
      console.error("Error adding to favourites:", err);
      throw err;
    }
  };

  const removeFromFavourites = async (place: FavouritePlace) => {
    try {
      if (!place.backendId) {
        throw new Error("Place is not from catalogue - missing backendId");
      }
      await favouritesService.removeFromFavourites(place.backendId);

      setFavourites((prev) => {
        const updated = prev.filter((p) => p.placeId !== place.placeId);
        // Сохраняем через сервис
        localStorageService.saveFavourites(updated);
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