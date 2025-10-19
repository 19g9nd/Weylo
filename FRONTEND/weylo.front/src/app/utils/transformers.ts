import { Place } from "../types/place";

export const transformBackendToFrontendPlace = (
  backendFavourite: any
): Place => {
  const destination = backendFavourite.destination;

  return {
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
    // From connected data
    note: backendFavourite.personalNotes, // notes from UserFavourite
    category: destination.category?.name,
    categoryValue: destination.category?.name,
    photos: destination.cachedImageUrl
      ? [{ getURI: () => destination.cachedImageUrl }]
      : undefined,
    // Additional info
    ...(destination.city && {
      city: destination.city.name,
      country: destination.city.country?.name,
    }),
  };
};