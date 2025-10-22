import { FavouritePlace } from "../types/place";

export const transformFavouritePlace = (
  backendFavourite: any
): FavouritePlace => {
  const destination = backendFavourite.destination;

  return {
    // BasePlace fields
    backendId: destination.id,
    placeId: destination.googlePlaceId,
    displayName: destination.name,
    location: {
      lat: destination.latitude,
      lng: destination.longitude,
    },
    formattedAddress: destination.cachedAddress,
    rating: destination.cachedRating ? Number(destination.cachedRating) : null,
    googleType: destination.googleType,
    category: destination.category?.name,
    categoryValue: destination.category?.name,
    photos: destination.cachedImageUrl
      ? [{ getURI: () => destination.cachedImageUrl }]
      : undefined,
    ...(destination.city && {
      city: destination.city.name,
      country: destination.city.country?.name,
    }),

    // FavouritePlace specific fields
    userFavouriteId: backendFavourite.id,
    personalNotes: backendFavourite.personalNotes,
    savedAt: new Date(backendFavourite.savedAt),
  };
};