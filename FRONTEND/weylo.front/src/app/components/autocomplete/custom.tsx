import React, { FormEvent, useCallback, useState } from "react";
import { useAutocompleteSuggestions } from "../../hooks/useAutocompleteSuggestions";
import { useMapsLibrary } from "@vis.gl/react-google-maps";

interface Props {
  onPlaceSelect: (place: google.maps.places.Place | null) => void;
}

// const savePlaceToBackend = async (place: google.maps.places.Place) => {
//   try {
//     const name = place.displayName || "";
//     const address = place.formattedAddress || "";
//     const location = place.location;
//     const types = place.types || [];

//     const response = await fetch("http://localhost:5041/Trips/SavePlace", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         name: name,
//         address: address,
//         latitude: location?.lat() || null,
//         longitude: location?.lng() || null,
//         type: types.length > 0 ? types[0] : "unknown",
//         placeId: place.id,
//       }),
//     });

//     if (!response.ok) {
//       throw new Error("Failed to save place");
//     }

//     return await response.json();
//   } catch (error) {
//     console.error("Error saving place:", error);
//     throw error;
//   }
// };

export const AutocompleteCustom = ({ onPlaceSelect }: Props) => {
  const places = useMapsLibrary("places");
  const [inputValue, setInputValue] = useState<string>("");
  const { suggestions, resetSession } = useAutocompleteSuggestions(inputValue);

  const handleInput = useCallback((event: FormEvent<HTMLInputElement>) => {
    setInputValue((event.target as HTMLInputElement).value);
  }, []);

  const handleSuggestionClick = useCallback(
    async (suggestion: google.maps.places.AutocompleteSuggestion) => {
      if (!places) return;
      if (!suggestion.placePrediction) return;

      try {
        const place = await suggestion.placePrediction.toPlace();

        await place.fetchFields({
          fields: [
            "displayName",
            "formattedAddress",
            "location",
            "types",
            "viewport",
            "rating",
            "svgIconMaskURI",
            "iconBackgroundColor",
          ],
        });

        // await savePlaceToBackend(place);

        setInputValue("");
        resetSession();
        onPlaceSelect(place);
      } catch (error) {
        console.error("Error handling place selection:", error);
      }
    },
    [places, onPlaceSelect, resetSession]
  );

  return (
    <div className="autocomplete-container">
      <input
        value={inputValue}
        onInput={handleInput}
        placeholder="Search for a place"
        className="autocomplete-input border-gray-300 rounded-lg bg-white text-main-text focus:ring-2 focus:ring-yellow focus:border-transparent"
      />

      {suggestions.length > 0 && (
        <ul className="custom-list">
          {suggestions.map((suggestion, index) => (
            <li
              key={index}
              className="custom-list-item"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              {suggestion.placePrediction?.text.text}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
