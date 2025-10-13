import { useMapsLibrary } from "@vis.gl/react-google-maps";
import { useEffect, useRef, useState } from "react";
import { SupportedCountry } from "../types/country";
import { useDebounce } from "./useDebounce";

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
  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const lastRequestRef = useRef<string>("");
  const [isRequesting, setIsRequesting] = useState(false);
  const requestCountRef = useRef(0);
  const MAX_REQUESTS_PER_MINUTE = 20; 

  const [suggestions, setSuggestions] = useState<
    google.maps.places.AutocompleteSuggestion[]
  >([]);

  const [isLoading, setIsLoading] = useState(false);

  const debouncedInput = useDebounce(inputString, 800);

  useEffect(() => {
    if (!placesLib) return;

    const { AutocompleteSessionToken, AutocompleteSuggestion } = placesLib;

    const normalizedInput = debouncedInput?.trim().toLowerCase() || "";

    if (!normalizedInput || normalizedInput.length < 3) {
      if (suggestions.length > 0) setSuggestions([]);
      return;
    }

    if (lastRequestRef.current === normalizedInput || isRequesting) {
      return;
    }

    if (requestCountRef.current >= MAX_REQUESTS_PER_MINUTE) {
      console.warn('Autocomplete rate limit exceeded');
      return;
    }

    if (!sessionTokenRef.current) {
      sessionTokenRef.current = new AutocompleteSessionToken();
    }

    const request: google.maps.places.AutocompleteRequest = {
      ...requestOptions,
      input: debouncedInput, 
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
      request.includedRegionCodes = [selectedCountry.code.toLowerCase()];
    }

    lastRequestRef.current = normalizedInput;
    requestCountRef.current++;
    setIsRequesting(true);
    setIsLoading(true);

    console.log(`🔄 Autocomplete request #${requestCountRef.current}: "${debouncedInput}"`);

    AutocompleteSuggestion.fetchAutocompleteSuggestions(request)
      .then((res) => {
        setSuggestions(res.suggestions);
      })
      .catch((error) => {
        console.error("Error fetching autocomplete suggestions:", error);
        setSuggestions([]);
      })
      .finally(() => {
        setIsLoading(false);
        setIsRequesting(false);
        
        setTimeout(() => {
          requestCountRef.current = 0;
        }, 60000);
      });
  }, [
    placesLib, 
    debouncedInput,
    selectedCountry?.code,
  ]);

  return {
    suggestions,
    isLoading,
    resetSession: () => {
      sessionTokenRef.current = null;
      lastRequestRef.current = "";
      requestCountRef.current = 0;
      setSuggestions([]);
    },
  };
}