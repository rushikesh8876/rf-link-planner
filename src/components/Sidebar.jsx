// src/components/Sidebar.jsx
import React from "react";
import { formatMeters } from "../utils";

/**
 * Sidebar: shows towers and links, and controls for editing
 * Props:
 * - towers, links
 * - onUpdateTower(id, patch)
 * - onRemoveTower(id)
 * - onTryMakeLink(id)  // used for initiating links from a tower
 * - onRemoveLink(id)
 * - onComputeLink(link) // select a link to compute Fresnel
 * - selectedForLink
 * - activeLink
 * - message
 */
export default function Sidebar({
  towers = [],
  links = [],
  onUpdateTower,
  onRemoveTower,
  onTryMakeLink,
  onRemoveLink,
  onComputeLink,
  selectedForLink,
  activeLink,
  message,
}) {
  return (
    <div style={{ width: 340, padding: 16, boxSizing: "border-box", borderRight: "1px solid #eee", overflowY: "auto" }}>
      <h2 style={{ margin: "4px 0 8px 0" }}>RF Link Planner</h2>
      <div style={{ color: "#555", fontSize: 13, marginBottom: 10 }}>Refactor: components</div>

      <div style={{ marginBottom: 12, padding: 10, background: "#fafafa", border: "1px solid #f0f0f0", borderRadius: 6 }}>
        <div style={{ fontSize: 13, marginBottom: 6 }}>{message}</div>
        <div style={{ fontSize: 12, color: "#777" }}>
          Click the map to add towers. Click a tower 'Link' then click another tower (same freq required).
        </div>
      </div>

      <section>
        <h3 style={{ marginBottom: 8 }}>Towers</h3>
        <div style={{ maxHeight: 300, overflowY: "auto" }}>
          {towers.length === 0 && <div style={{ color: "#888", padding: 8 }}>No towers yet. Click map to add one.</div>}
          {towers.map((t) => (
            <div key={t.id} style={{ padding: 10, border: "1px solid #e6e6e6", borderRadius: 8, marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontWeight: 700 }}>#{t.id}</div>
                <div>
                  <button onClick={() => onRemoveTower(t.id)} style={{ fontSize: 12 }}>Delete</button>
                </div>
              </div>

              <div style={{ fontSize: 12, color: "#444", marginTop: 6 }}>{t.lat.toFixed(5)}, {t.lng.toFixed(5)}</div>

              <label style={{ display: "block", marginTop: 8, fontSize: 13 }}>
                Freq (GHz)
                <input
                  type="number"
                  step="0.1"
                  value={t.freqGHz}
                  onChange={(e) => onUpdateTower(t.id, { freqGHz: parseFloat(e.target.value) || 0 })}
                  style={{ width: "100%", marginTop: 6 }}
                />
              </label>

              <div style={{ marginTop: 8 }}>
                <button onClick={() => onTryMakeLink(t.id)} style={{ width: "100%" }}>
                  {selectedForLink === t.id ? "Cancel" : "Link from here"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ marginTop: 12 }}>
        <h3 style={{ marginBottom: 8 }}>Links</h3>
        <div style={{ maxHeight: 220, overflowY: "auto" }}>
          {links.length === 0 && <div style={{ color: "#888", padding: 8 }}>No links yet.</div>}
          {links.map((l) => {
            const A = towers.find((t) => t.id === l.a);
            const B = towers.find((t) => t.id === l.b);
            return (
              <div key={l.id} style={{ padding: 10, marginBottom: 8, border: "1px solid #e6e6e6", borderRadius: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontWeight: 700 }}>{A ? A.id : "?"} ↔ {B ? B.id : "?"}</div>
                  <div>
                    <button onClick={() => onComputeLink(l)} style={{ fontSize: 12 }}>Select</button>
                    <button onClick={() => onRemoveLink(l.id)} style={{ marginLeft: 8, fontSize: 12 }}>Delete</button>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: "#444", marginTop: 6 }}>
                  {l.dist ? formatMeters(l.dist) : ""} {A ? ` @ ${A.freqGHz} GHz` : ""}
                </div>
                {activeLink === l.id && <div style={{ marginTop: 6, fontSize: 12, color: "#b00" }}>Active</div>}
              </div>
            );
          })}
        </div>
      </section>

      <section style={{ marginTop: 12 }}>
        <h3 style={{ marginBottom: 8 }}>Notes</h3>
        <ul style={{ marginTop: 0, paddingLeft: 18, color: "#555", fontSize: 13 }}>
          <li>Only towers on the same frequency (GHz) can be linked.</li>
          <li>Click a link's Select button to compute/display the first Fresnel zone (simplified).</li>
        </ul>
      </section>
    </div>
  );
}
