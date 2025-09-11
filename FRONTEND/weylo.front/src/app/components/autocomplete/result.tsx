"use client";

import React, { useEffect } from "react";
import { useMap, AdvancedMarker, Pin } from "@vis.gl/react-google-maps";

interface Props {
  place: google.maps.places.Place | null;
}

const AutocompleteResult = ({ place }: Props) => {
  const map = useMap();

  useEffect(() => {
    if (!map || !place) return;
    if (place.viewport) map.fitBounds(place.viewport);
  }, [map, place]);

  if (!place) return null;

  return (
    <AdvancedMarker position={place.location}>
      <Pin
        background={"#FFD514"}
        borderColor={"#a11e1eff"}
        glyphColor={"#eb7200ff"}
      />
    </AdvancedMarker>
  );
};

export default React.memo(AutocompleteResult);
