// src/components/FresnelSVG.jsx
import React, { useEffect, useState } from "react";

/**
 * FresnelSVG
 * - uses map.latLngToContainerPoint so SVG coordinates line up with absolute container SVG
 * - subscribes to map 'move resize zoom' to re-render overlay while map moves
 * - clamps semiMinor (ry) to a small visible pixel minimum
 *
 * Props:
 * - link (object with a, b, r_mid maybe)
 * - towers (array)
 *
 * Requires window._rfMapInstance to be set (your MapView sets this in whenCreated).
 */
export default function FresnelSVG({ link, towers = [] }) {
  const [, tick] = useState(0); // trigger re-renders on map events
  const [mapReady, setMapReady] = useState(false);

  if (!link) return null;
  const A = towers.find((t) => t.id === link.a);
  const B = towers.find((t) => t.id === link.b);
  if (!A || !B) return null;

  const map = window._rfMapInstance;
  if (!map) return null;

  // ensure we re-render when the map moves / zooms / resizes
  useEffect(() => {
    function onMove() {
      tick((n) => n + 1);
    }
    // map might not be ready immediately
    if (!map) return;
    setMapReady(true);
    map.on("move resize zoom viewreset", onMove);
    return () => {
      map.off("move resize zoom viewreset", onMove);
    };
  }, [map, link?.id]);

  // container points (pixels relative to map container's top-left)
  const p1 = map.latLngToContainerPoint([A.lat, A.lng]);
  const p2 = map.latLngToContainerPoint([B.lat, B.lng]);

  const cx = (p1.x + p2.x) / 2;
  const cy = (p1.y + p2.y) / 2;
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

  // estimate meters-per-pixel near midpoint using container points (safer)
  let metersPerPixel = 1;
  try {
    const deltaLng = 0.0005;
    const pRefA = map.latLngToContainerPoint([A.lat, A.lng]);
    const pRefB = map.latLngToContainerPoint([A.lat, A.lng + deltaLng]);
    const pxDelta = Math.abs(pRefB.x - pRefA.x) || 1;
    const metersDelta = map.distance([A.lat, A.lng], [A.lat, A.lng + deltaLng]);
    metersPerPixel = metersDelta / pxDelta;
    if (!isFinite(metersPerPixel) || metersPerPixel <= 0) metersPerPixel = 1;
  } catch (e) {
    metersPerPixel = 1;
  }

  const semiMajor = Math.max(length / 2, 2); // horizontal radius in px (at least 2 px)
  const semiMinor = Math.max((link.r_mid || 0) / metersPerPixel, 4); // clamp to >=4 px so visible

  const size = map.getSize();
  const svgWidth = size.x;
  const svgHeight = size.y;

  // small guard: if radii are NaN or zero, don't render
  if (!isFinite(semiMajor) || !isFinite(semiMinor) || semiMinor <= 0 || semiMajor <= 0) return null;

  return (
    <svg
      width={svgWidth}
      height={svgHeight}
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        pointerEvents: "none",
        overflow: "visible",
        zIndex: 1000,
      }}
    >
      <g transform={`translate(${cx},${cy}) rotate(${angle})`}>
        <ellipse
          cx={0}
          cy={0}
          rx={semiMajor}
          ry={semiMinor}
          fill="#ffaaaa"
          fillOpacity={0.15}
          stroke="#ff3333"
          strokeWidth={2}
        />
      </g>
    </svg>
  );
}
