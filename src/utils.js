// src/utils.js
export const SPEED_OF_LIGHT = 3e8;

export function formatMeters(m) {
  if (!isFinite(m)) return "";
  if (m >= 1000) return (m / 1000).toFixed(2) + " km";
  return Math.round(m) + " m";
}
