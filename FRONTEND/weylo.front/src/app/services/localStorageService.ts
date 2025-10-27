import { IPlaceStorage } from "./interfaces/IPlaceStorage";
import { BasePlace, FavouritePlace, RoutePlace } from "../types/place";

const STORAGE_KEYS = {
  CATALOGUE: "savedPlaces",
  FAVOURITES: "favouritePlaces",
  ROUTE_PLACES: "routePlaces",
};

export class LocalStorageService implements IPlaceStorage {
  private userId: number | null = null;

  setUser(userId: number | null) {
    this.userId = userId;
  }

  async clearCurrentUserData(): Promise<void> {
    if (!this.userId) return;

    const userKeys = [
      `${STORAGE_KEYS.FAVOURITES}_${this.userId}`,
      `${STORAGE_KEYS.ROUTE_PLACES}_${this.userId}`,
    ];

    for (const key of userKeys) {
      localStorage.removeItem(key);
    }

    this.userId = null;
  }

  async getAll(): Promise<BasePlace[]> {
    return this._getFromStorage<BasePlace>(STORAGE_KEYS.CATALOGUE);
  }

  async getFavourites(): Promise<FavouritePlace[]> {
    if (!this.userId) return [];
    return this._getFromStorage<FavouritePlace>(
      `${STORAGE_KEYS.FAVOURITES}_${this.userId}`
    );
  }

  async addFavourite(favourite: FavouritePlace): Promise<FavouritePlace> {
    if (!this.userId) throw new Error("User not set");

    const favourites = await this.getFavourites();

    if (favourites.some((f) => f.placeId === favourite.placeId)) {
      throw new Error(
        `Place with ID ${favourite.placeId} already in favourites`
      );
    }

    const updatedFavourites = [...favourites, favourite];
    await this._save(
      `${STORAGE_KEYS.FAVOURITES}_${this.userId}`,
      updatedFavourites
    );
    return favourite;
  }

  async saveFavourites(favourites: FavouritePlace[]): Promise<void> {
    if (!this.userId) throw new Error("User not set");
    await this._save(`${STORAGE_KEYS.FAVOURITES}_${this.userId}`, favourites);
  }

  async removeFavourite(placeId: string): Promise<void> {
    if (!this.userId) throw new Error("User not set");

    const favourites = await this.getFavourites();
    const filteredFavourites = favourites.filter((f) => f.placeId !== placeId);

    if (filteredFavourites.length === favourites.length) {
      throw new Error(`Favourite with place ID ${placeId} not found`);
    }

    await this._save(
      `${STORAGE_KEYS.FAVOURITES}_${this.userId}`,
      filteredFavourites
    );
  }

  async getRoutePlaces(): Promise<RoutePlace[]> {
    if (!this.userId) return [];
    return this._getFromStorage<RoutePlace>(
      `${STORAGE_KEYS.ROUTE_PLACES}_${this.userId}`
    );
  }

  async addRoutePlace(routePlace: RoutePlace): Promise<RoutePlace> {
    if (!this.userId) throw new Error("User not set");

    const routePlaces = await this.getRoutePlaces();
    const updatedRoutePlaces = [...routePlaces, routePlace];
    await this._save(
      `${STORAGE_KEYS.ROUTE_PLACES}_${this.userId}`,
      updatedRoutePlaces
    );
    return routePlace;
  }

  async saveRoutePlaces(routePlaces: RoutePlace[]): Promise<void> {
    if (!this.userId) throw new Error("User not set");
    await this._save(
      `${STORAGE_KEYS.ROUTE_PLACES}_${this.userId}`,
      routePlaces
    );
  }

  async removeRoutePlace(placeId: string): Promise<void> {
    if (!this.userId) throw new Error("User not set");

    const routePlaces = await this.getRoutePlaces();
    const filteredRoutePlaces = routePlaces.filter(
      (rp) => rp.placeId !== placeId
    );
    await this._save(
      `${STORAGE_KEYS.ROUTE_PLACES}_${this.userId}`,
      filteredRoutePlaces
    );
  }

  async getById(placeId: string): Promise<BasePlace | null> {
    const places = await this.getAll();
    return places.find((p) => p.placeId === placeId) || null;
  }

  async add(place: BasePlace): Promise<BasePlace> {
    const places = await this.getAll();
    if (places.some((p) => p.placeId === place.placeId)) {
      throw new Error(`Place with ID ${place.placeId} already exists`);
    }
    const updatedPlaces = [...places, place];
    await this._save(STORAGE_KEYS.CATALOGUE, updatedPlaces);
    return place;
  }

  async update(
    placeId: string,
    updates: Partial<BasePlace>
  ): Promise<BasePlace> {
    const places = await this.getAll();
    const index = places.findIndex((p) => p.placeId === placeId);
    if (index === -1) throw new Error(`Place with ID ${placeId} not found`);

    const updatedPlace = { ...places[index], ...updates };
    places[index] = updatedPlace;
    await this._save(STORAGE_KEYS.CATALOGUE, places);
    return updatedPlace;
  }

  async remove(placeId: string): Promise<void> {
    const places = await this.getAll();
    const filteredPlaces = places.filter((p) => p.placeId !== placeId);
    if (filteredPlaces.length === places.length) {
      throw new Error(`Place with ID ${placeId} not found`);
    }
    await this._save(STORAGE_KEYS.CATALOGUE, filteredPlaces);
  }

  async saveCatalogue(places: BasePlace[]): Promise<void> {
    await this._save(STORAGE_KEYS.CATALOGUE, places);
  }

  // Helpers
  private async _getFromStorage<T>(key: string): Promise<T[]> {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error(`Error loading from localStorage (${key}):`, error);
      return [];
    }
  }

  private async _save<T>(key: string, data: T[]): Promise<void> {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`Error saving to localStorage (${key}):`, error);
      throw error;
    }
  }
}

export const localStorageService = new LocalStorageService();
