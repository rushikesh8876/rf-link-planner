// src/components/FresnelSVG.jsx
import React from "react";

/**
 * FresnelSVG overlay component
 * Expects window._rfMapInstance to exist (set by MapView).
 *
 * Link object should have r_mid (meters) computed by Main.
 */
export default function FresnelSVG({ link, towers = [] }) {
  if (!link) return null;
  const A = towers.find((t) => t.id === link.a);
  const B = towers.find((t) => t.id === link.b);
  if (!A || !B) return null;

  const map = window._rfMapInstance;
  if (!map) return null;

  const p1 = map.latLngToLayerPoint([A.lat, A.lng]);
  const p2 = map.latLngToLayerPoint([B.lat, B.lng]);
  const cx = (p1.x + p2.x) / 2;
  const cy = (p1.y + p2.y) / 2;
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

  // estimate meters-per-pixel near A
  let metersPerPixel = 1;
  try {
    const deltaLng = 0.0005;
    const pRefA = map.latLngToLayerPoint([A.lat, A.lng]);
    const pRefB = map.latLngToLayerPoint([A.lat, A.lng + deltaLng]);
    const pxDelta = Math.abs(pRefB.x - pRefA.x) || 1;
    const metersDelta = map.distance([A.lat, A.lng], [A.lat, A.lng + deltaLng]);
    metersPerPixel = metersDelta / pxDelta;
    if (!isFinite(metersPerPixel) || metersPerPixel <= 0) metersPerPixel = 1;
  } catch (e) {
    metersPerPixel = 1;
  }

  const semiMajor = length / 2;
  const semiMinor = (link.r_mid || 0) / metersPerPixel;

  const svgWidth = map.getSize().x;
  const svgHeight = map.getSize().y;

  return (
    <svg width={svgWidth} height={svgHeight} style={{ position: "absolute", left: 0, top: 0, pointerEvents: "none" }}>
      <g transform={`translate(${cx},${cy}) rotate(${angle})`}>
        <ellipse cx={0} cy={0} rx={semiMajor} ry={semiMinor} fill="#ffaaaa" fillOpacity={0.15} stroke="#ff3333" strokeWidth={2} />
      </g>
    </svg>
  );
}
