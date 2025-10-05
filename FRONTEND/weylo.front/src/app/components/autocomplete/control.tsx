import React from "react";
import { ControlPosition, MapControl } from "@vis.gl/react-google-maps";
import { AutocompleteCustom } from "./custom";
import { SupportedCountry } from "../../types/country";

type CustomAutocompleteControlProps = {
  controlPosition: ControlPosition;
  onPlaceSelect: (place: google.maps.places.Place | null) => void;
  selectedCountry?: SupportedCountry | null; 
};

const AutocompleteControl = ({
  controlPosition,
  onPlaceSelect,
  selectedCountry, 
}: CustomAutocompleteControlProps) => {
  return (
    <MapControl position={controlPosition}>
      <div className="autocomplete-control">
        <AutocompleteCustom 
          onPlaceSelect={onPlaceSelect} 
          selectedCountry={selectedCountry} 
        />
      </div>
    </MapControl>
  );
};

export default React.memo(AutocompleteControl);