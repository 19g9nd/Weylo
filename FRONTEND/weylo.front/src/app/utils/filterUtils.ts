import { PLACE_CATEGORIES } from "../config/placeCategories";
import { Place } from "../types/place";

export const matchesCategory = (place: Place, categoryId: string): boolean => {
  const category = PLACE_CATEGORIES.find((c) => c.id === categoryId);
  if (!category || !place.types) return false;

  return place.types.some((placeType: string) =>
    category.googleTypes.some((categoryType: string) =>
      placeType.toLowerCase().includes(categoryType.toLowerCase())
    )
  );
};

export const matchesRating = (
  place: Place,
  minRating: number | null
): boolean => {
  if (minRating === null) return true;
  return (place.rating || 0) >= minRating;
};

export const matchesSearch = (place: Place, query: string): boolean => {
  if (!query) return true;
  const searchLower = query.toLowerCase();
  return (
    place.displayName?.toLowerCase().includes(searchLower) ||
    place.formattedAddress?.toLowerCase().includes(searchLower) ||
    place.types?.some((type: string) =>
      type.toLowerCase().includes(searchLower)
    ) ||
    false
  );
};

export const getPrimaryCategory = (place: Place) => {
  if (!place.types) return null;

  for (const category of PLACE_CATEGORIES) {
    if (matchesCategory(place, category.id)) {
      return category;
    }
  }
  return null;
};