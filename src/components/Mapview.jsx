// src/components/MapView.jsx
import React from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import MapControls from "./MapControls";
import FresnelSVG from "./FresnelSVG";

/** tiny helper: grabs the map instance via useMap() and stores it globally */
function MapSetter() {
  const map = useMap();
  // store on window so your existing FresnelSVG can pick it up
  // this will run once the map context is available
  React.useEffect(() => {
    if (map) window._rfMapInstance = map;
  }, [map]);
  return null;
}

/**
 * MapView: renders leaflet map, markers and polylines.
 */
export default function MapView({ towers = [], links = [], activeLink, onMapClick, onTryMakeLink, onLinkClick }) {
  return (
    <div style={{ flex: 1, position: "relative" }}>
      <MapContainer center={[19.07, 72.87]} zoom={6} style={{ height: "100%", width: "100%" }}>
        <MapSetter />
        <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <MapControls onMapClick={onMapClick} />

        {towers.map((t) => (
          <Marker key={t.id} position={[t.lat, t.lng]} eventHandlers={{ click: () => onTryMakeLink(t.id) }}>
            <Popup>
              <div style={{ minWidth: 180 }}>
                <div style={{ fontWeight: 700 }}>Tower #{t.id}</div>
                <div style={{ fontSize: 13, marginTop: 6 }}>Lat {t.lat.toFixed(5)}, Lng {t.lng.toFixed(5)}</div>
                <div style={{ marginTop: 8 }}>
                  <div style={{ fontSize: 13 }}>Freq (GHz):</div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{t.freqGHz} GHz</div>
                </div>
                <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                  <button onClick={() => onTryMakeLink(t.id)} style={{ flex: 1 }}>Link</button>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {links.map((l) => {
          const A = towers.find((t) => t.id === l.a);
          const B = towers.find((t) => t.id === l.b);
          if (!A || !B) return null;
          return (
            <Polyline
              key={l.id}
              pathOptions={{ color: activeLink === l.id ? "#cc2222" : "#1273d5", weight: 4 }}
              positions={[
                [A.lat, A.lng],
                [B.lat, B.lng],
              ]}
              eventHandlers={{ click: () => onLinkClick(l) }}
            />
          );
        })}
      </MapContainer>

      {/* render Fresnel overlay when activeLink set */}
      {activeLink && <FresnelSVG link={links.find((x) => x.id === activeLink)} towers={towers} />}
    </div>
  );
}
