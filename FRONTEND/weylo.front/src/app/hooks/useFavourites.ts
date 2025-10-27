import { useState, useEffect } from "react";
import { FavouritePlace } from "../types/place";
import { favouritesService } from "../services/favouritesService";
import { localStorageService } from "../services/localStorageService";
import { useAuth } from "../context/AuthContext";

export const useFavourites = () => {
  const { user } = useAuth();
  const [favourites, setFavourites] = useState<FavouritePlace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      localStorageService.setUser(user.id);
    }
    loadFavourites();
  }, [user?.id]);

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

      // Fallback к localStorage через сервис
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

      // Добавляем на бекенд
      await favouritesService.addToFavourites(place.backendId);

      // Обновляем локальное состояние
      setFavourites((prev) => {
        const updated = [...prev, place];
        // Сохраняем через сервис
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

      // Удаляем с бекенда
      await favouritesService.removeFromFavourites(place.backendId);

      // Обновляем локальное состояние
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
