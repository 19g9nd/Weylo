import { BasePlace, FavouritePlace, RoutePlace } from "../../types/place";

export interface IPlaceStorage {
  getAll(): Promise<BasePlace[]>;
  getById(placeId: string): Promise<BasePlace | null>;
  add(place: BasePlace): Promise<BasePlace>;
  update(placeId: string, updates: Partial<BasePlace>): Promise<BasePlace>;
  remove(placeId: string): Promise<void>;
  saveCatalogue(places: BasePlace[]): Promise<void>;

  getFavourites(): Promise<FavouritePlace[]>;
  addFavourite(favourite: FavouritePlace): Promise<FavouritePlace>;
  removeFavourite(placeId: string): Promise<void>;
  saveFavourites(favourites: FavouritePlace[]): Promise<void>;

  getRoutePlaces(): Promise<RoutePlace[]>;
  addRoutePlace(routePlace: RoutePlace): Promise<RoutePlace>;
  removeRoutePlace(placeId: string): Promise<void>;
  saveRoutePlaces(routePlaces: RoutePlace[]): Promise<void>;

  clearCurrentUserData(): Promise<void>;
}