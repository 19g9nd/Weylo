import { BasePlace } from "../types/place";

export const transformCatalogPlace = (backendPlace: any): BasePlace => {
  return {
    backendId: backendPlace.id,
    placeId: backendPlace.googlePlaceId,
    displayName: backendPlace.name,
    location: {
      lat: backendPlace.latitude,
      lng: backendPlace.longitude,
    },
    formattedAddress: backendPlace.cachedAddress,
    rating: backendPlace.cachedRating
      ? Number(backendPlace.cachedRating)
      : null,
    googleType: backendPlace.googleType,
    category: backendPlace.category?.name,
    categoryValue: backendPlace.category?.name,
    photos: backendPlace.cachedImageUrl
      ? [{ getURI: () => backendPlace.cachedImageUrl }]
      : undefined,
    ...(backendPlace.city && {
      city: backendPlace.city.name,
      country: backendPlace.city.country?.name,
    }),
  };
};