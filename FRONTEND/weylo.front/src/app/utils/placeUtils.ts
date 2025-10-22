import { BasePlace } from "../types/place";

export const convertGooglePlaceToSaved = (
  place: google.maps.places.Place
): BasePlace | null => {
  if (!place || !place.location) {
    console.error("Invalid place object or missing location");
    return null;
  }

  try {
    return {
      backendId: 0,
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
      googleType: place.types?.[0], // first type

      // Google-specific fields
      primaryTypeDisplayName: place.displayName
        ? { text: place.displayName }
        : undefined,
    };
  } catch (error) {
    console.error("Error converting Google Place to Place:", error);
    return null;
  }
};

export const extractLocationInfo = (
  address: string = ""
): { cityName: string; countryName: string } => {
  const parts = address.split(", ");
  const countryName = parts.length > 0 ? parts[parts.length - 1] : "Unknown";
  const cityName = parts.length > 1 ? parts[parts.length - 2] : "Unknown";
  return { cityName, countryName };
};