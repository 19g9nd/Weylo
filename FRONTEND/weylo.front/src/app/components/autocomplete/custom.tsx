import React, { FormEvent, useCallback, useState } from "react";
import { useAutocompleteSuggestions } from "../../hooks/useAutocompleteSuggestions";
import { useMapsLibrary } from "@vis.gl/react-google-maps";
import { SupportedCountry } from "../../types/country";

interface Props {
  onPlaceSelect: (place: google.maps.places.Place | null) => void;
  selectedCountry?: SupportedCountry | null;
}

export const AutocompleteCustom = ({
  onPlaceSelect,
  selectedCountry,
}: Props) => {
  const places = useMapsLibrary("places");
  const [inputValue, setInputValue] = useState<string>("");

  const { suggestions, resetSession } = useAutocompleteSuggestions(
    inputValue,
    {},
    selectedCountry
  );

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
            "userRatingCount",
            "internationalPhoneNumber",
            "regularOpeningHours",
            "editorialSummary", // Enterprise+?
            "svgIconMaskURI",
            "iconBackgroundColor",
            "photos",
            "priceLevel", // Enterprise+?
          ],
        });

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
        placeholder={
          selectedCountry
            ? `Search places in ${selectedCountry.name}`
            : "Search for a place"
        }
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
