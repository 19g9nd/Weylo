import { Place } from "../../types/map";

export interface IPlaceStorage {
  getAll(): Promise<Place[]>;
  add(place: Place): Promise<Place>;
  remove(placeId: string): Promise<void>;
  clear(): Promise<void>;
}

