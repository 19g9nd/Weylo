import { IPlaceStorage } from './interfaces/IPlaceStorage';
import { Place } from '../types/place';

const STORAGE_KEY = 'savedPlaces';

export class LocalStorageService implements IPlaceStorage {
  async getAll(): Promise<Place[]> {
    if (typeof window === 'undefined') return [];
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      return [];
    }
  }

  async getById(placeId: string): Promise<Place | null> {
    const places = await this.getAll();
    return places.find(p => p.placeId === placeId) || null;
  }

  async add(place: Place): Promise<Place> {
    const places = await this.getAll();
    
    if (places.some(p => p.placeId === place.placeId)) {
      throw new Error(`Place with ID ${place.placeId} already exists`);
    }

    const updatedPlaces = [...places, place];
    await this._save(updatedPlaces);
    return place;
  }

  async update(placeId: string, updates: Partial<Place>): Promise<Place> {
    const places = await this.getAll();
    const index = places.findIndex(p => p.placeId === placeId);
    
    if (index === -1) {
      throw new Error(`Place with ID ${placeId} not found`);
    }

    const updatedPlace = { ...places[index], ...updates };
    places[index] = updatedPlace;
    
    await this._save(places);
    return updatedPlace;
  }

  async remove(placeId: string): Promise<void> {
    const places = await this.getAll();
    const filteredPlaces = places.filter(p => p.placeId !== placeId);
    
    if (filteredPlaces.length === places.length) {
      throw new Error(`Place with ID ${placeId} not found`);
    }

    await this._save(filteredPlaces);
  }

  async clear(): Promise<void> {
    await this._save([]);
  }

  private async _save(places: Place[]): Promise<void> {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(places));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
      throw error;
    }
  }
}