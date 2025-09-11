import { SavedPlace } from "../../types/map";

export interface IPlaceStorage {
  getAll(): Promise<SavedPlace[]>;
  add(place: SavedPlace): Promise<SavedPlace>;
  remove(placeId: string): Promise<void>;
  clear(): Promise<void>;
}

