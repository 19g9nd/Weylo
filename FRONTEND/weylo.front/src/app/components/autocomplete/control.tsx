import React from "react";
import { ControlPosition, MapControl } from "@vis.gl/react-google-maps";
import { AutocompleteCustom } from "./custom";

type CustomAutocompleteControlProps = {
  controlPosition: ControlPosition;
  onPlaceSelect: (place: google.maps.places.Place | null) => void;
};

const AutocompleteControl = ({
  controlPosition,
  onPlaceSelect,
}: CustomAutocompleteControlProps) => {
  return (
    <MapControl position={controlPosition}>
      <div className="autocomplete-control">
        <AutocompleteCustom onPlaceSelect={onPlaceSelect} />
      </div>
    </MapControl>
  );
};

export default React.memo(AutocompleteControl);
