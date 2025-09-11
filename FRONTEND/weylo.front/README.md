This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.


<!-- 
'use client';

import React, { useState, useRef } from 'react';
import {
  GoogleMap,
  LoadScript,
  Autocomplete,
  DirectionsService,
  DirectionsRenderer,
} from '@react-google-maps/api';

interface Location {
  lat: number;
  lng: number;
  address?: string;
}

interface RouteInfo {
  distance: string;
  duration: string;
}

const containerStyle = {
  width: '100%',
  height: '500px',
};

const center = {
  lat: 40.4093,
  lng: 49.8671, // Баку
};

export default function RoutePlanner() {
  const [startPoint, setStartPoint] = useState<Location | null>(null);
  const [endPoint, setEndPoint] = useState<Location | null>(null);
  const [isSelectingStart, setIsSelectingStart] = useState(true);
  const [directionsResult, setDirectionsResult] = useState<google.maps.DirectionsResult | null>(null);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);

  const startAutocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const endAutocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const onLoadStart = (autocomplete: google.maps.places.Autocomplete) => {
    startAutocompleteRef.current = autocomplete;
  };

  const onLoadEnd = (autocomplete: google.maps.places.Autocomplete) => {
    endAutocompleteRef.current = autocomplete;
  };

  const onPlaceChangedStart = () => {
    if (startAutocompleteRef.current !== null) {
      const place = startAutocompleteRef.current.getPlace();
      if (place.geometry?.location) {
        setStartPoint({
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
          address: place.formatted_address || place.name,
        });
      }
    }
  };

  const onPlaceChangedEnd = () => {
    if (endAutocompleteRef.current !== null) {
      const place = endAutocompleteRef.current.getPlace();
      if (place.geometry?.location) {
        setEndPoint({
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
          address: place.formatted_address || place.name,
        });
      }
    }
  };

  const directionsCallback = (response: google.maps.DirectionsResult | null, status: google.maps.DirectionsStatus) => {
    if (status === 'OK' && response) {
      setDirectionsResult(response);

      const route = response.routes[0];
      if (route.legs.length > 0) {
        setRouteInfo({
          distance: route.legs[0].distance?.text || 'N/A',
          duration: route.legs[0].duration?.text || 'N/A',
        });
      }
    } else {
      console.error('Directions request failed due to ' + status);
      setDirectionsResult(null);
      setRouteInfo(null);
    }
  };

  const resetAll = () => {
    setStartPoint(null);
    setEndPoint(null);
    setDirectionsResult(null);
    setRouteInfo(null);
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 20 }}>
      <LoadScript
        googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}
        libraries={['places']}
      >
        <div style={{ marginBottom: 10, display: 'flex', gap: 10 }}>
          <Autocomplete onLoad={onLoadStart} onPlaceChanged={onPlaceChangedStart}>
            <input
              type="text"
              placeholder="Введите точку старта"
              defaultValue={startPoint?.address || ''}
              style={{ width: '100%', padding: '8px', fontSize: '16px' }}
            />
          </Autocomplete>

          <Autocomplete onLoad={onLoadEnd} onPlaceChanged={onPlaceChangedEnd}>
            <input
              type="text"
              placeholder="Введите точку назначения"
              defaultValue={endPoint?.address || ''}
              style={{ width: '100%', padding: '8px', fontSize: '16px' }}
            />
          </Autocomplete>

          <button onClick={resetAll} style={{ padding: '8px 12px' }}>
            Очистить
          </button>
        </div>

        <GoogleMap
          mapContainerStyle={containerStyle}
          center={center}
          zoom={12}
        >
          {/* Запрос маршрута */}
          {startPoint && endPoint && !directionsResult && (
            <DirectionsService
              options={{
                origin: startPoint,
                destination: endPoint,
                travelMode: google.maps.TravelMode.DRIVING,
              }}
              callback={directionsCallback}
            />
          )}

          {/* Отображение маршрута */}
          {directionsResult && (
            <DirectionsRenderer
              options={{
                directions: directionsResult,
                polylineOptions: {
                  strokeColor: '#4285F4',
                  strokeWeight: 5,
                },
                suppressMarkers: false,
              }}
            />
          )}
        </GoogleMap>

        <div style={{ marginTop: 20, fontSize: '18px' }}>
          {routeInfo ? (
            <>
              <div><strong>Расстояние:</strong> {routeInfo.distance}</div>
              <div><strong>Время в пути:</strong> {routeInfo.duration}</div>
            </>
          ) : (
            <div>Введите точки маршрута для расчёта пути</div>
          )}
        </div>
      </LoadScript>
    </div>
  );
} -->
