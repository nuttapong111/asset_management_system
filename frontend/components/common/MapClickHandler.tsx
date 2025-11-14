'use client';

import { useEffect } from 'react';
import { useMapEvents } from 'react-leaflet';

interface MapClickHandlerProps {
  onClick: (lat: number, lng: number) => void;
  enabled: boolean;
}

export default function MapClickHandler({ onClick, enabled }: MapClickHandlerProps) {
  const map = useMapEvents({
    click: (e) => {
      if (enabled) {
        onClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });

  useEffect(() => {
    if (enabled) {
      map.getContainer().style.cursor = 'crosshair';
    } else {
      map.getContainer().style.cursor = '';
    }
  }, [enabled, map]);

  return null;
}
