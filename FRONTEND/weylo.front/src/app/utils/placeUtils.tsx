import { SavedPlace } from "../types/map";

export const convertGooglePlaceToSaved = (place: google.maps.places.Place): SavedPlace | null => {
  if (!place || !place.location) {
    console.error("Invalid place object or missing location");
    return null;
  }

  try {
    return {
      placeId: place.id || "",
      location: {
        lat: place.location.lat(),
        lng: place.location.lng(),
      },
      displayName: place.displayName || "",
      formattedAddress: place.formattedAddress || "",
      rating: place.rating,
      userRatingsTotal: place.userRatingCount,
      types: place.types,
    };
  } catch (error) {
    console.error("Error converting Google Place to SavedPlace:", error);
    return null;
  }
};