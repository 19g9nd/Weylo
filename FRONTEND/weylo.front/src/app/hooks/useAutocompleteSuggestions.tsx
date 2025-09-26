import { useMapsLibrary } from "@vis.gl/react-google-maps";
import { useEffect, useRef, useState } from "react";
import { SupportedCountry } from "../services/countriesService";

export type UseAutocompleteSuggestionsReturn = {
  suggestions: google.maps.places.AutocompleteSuggestion[];
  isLoading: boolean;
  resetSession: () => void;
};

export function useAutocompleteSuggestions(
  inputString: string,
  requestOptions: Partial<google.maps.places.AutocompleteRequest> = {},
  selectedCountry?: SupportedCountry | null
): UseAutocompleteSuggestionsReturn {
  const placesLib = useMapsLibrary("places");

  const sessionTokenRef =
    useRef<google.maps.places.AutocompleteSessionToken | null>(null);

  const [suggestions, setSuggestions] = useState<
    google.maps.places.AutocompleteSuggestion[]
  >([]);

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!placesLib) return;

    const { AutocompleteSessionToken, AutocompleteSuggestion } = placesLib;

    if (!sessionTokenRef.current) {
      sessionTokenRef.current = new AutocompleteSessionToken();
    }

    // Build the request with country restrictions
    const request: google.maps.places.AutocompleteRequest = {
      ...requestOptions,
      input: inputString,
      sessionToken: sessionTokenRef.current,
    };

    // Add location restriction if country is selected
    if (selectedCountry) {
      request.locationRestriction = {
        south: selectedCountry.southBound,
        west: selectedCountry.westBound,
        north: selectedCountry.northBound,
        east: selectedCountry.eastBound,
      };
    }

    if (selectedCountry) {
      request.includedRegionCodes = [selectedCountry.code.toLowerCase()];
    }

    if (inputString === "") {
      if (suggestions.length > 0) setSuggestions([]);
      return;
    }

    setIsLoading(true);
    AutocompleteSuggestion.fetchAutocompleteSuggestions(request)
      .then((res) => {
        setSuggestions(res.suggestions);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching autocomplete suggestions:", error);
        setSuggestions([]);
        setIsLoading(false);
      });
  }, [placesLib, inputString, selectedCountry, requestOptions]);

  return {
    suggestions,
    isLoading,
    resetSession: () => {
      sessionTokenRef.current = null;
      setSuggestions([]);
    },
  };
}
