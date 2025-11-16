// src/components/MapControls.jsx
import { useEffect } from "react";
import { useMap } from "react-leaflet";

/**
 * Attaches click handler to map and forwards latlng
 */
export default function MapControls({ onMapClick }) {
  const map = useMap();
  useEffect(() => {
    function handler(e) {
      if (onMapClick) onMapClick(e.latlng);
    }
    map.on("click", handler);
    return () => map.off("click", handler);
  }, [map, onMapClick]);
  return null;
}
