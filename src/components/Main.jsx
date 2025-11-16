// src/components/Main.jsx
import React, { useEffect, useRef, useState } from "react";
import Sidebar from "./Sidebar";
import MapView from "./Mapview";
import { SPEED_OF_LIGHT, formatMeters } from "../utils";

/**
 * Main: Holds application state and handlers; composes Sidebar + MapView.
 */
export default function Main() {
  const [towers, setTowers] = useState([]); // {id, lat, lng, freqGHz}
  const [selected, setSelected] = useState(null); // tower id (for linking)
  const [links, setLinks] = useState([]); // {id, a, b, dist?, r_mid?, lambda?}
  const [activeLink, setActiveLink] = useState(null); // link id selected to show Fresnel
  const [message, setMessage] = useState("Click map to add towers — default 5 GHz");
  const idRef = useRef(1);

  useEffect(() => {
    const t = setTimeout(() => setMessage(""), 2200);
    return () => clearTimeout(t);
  }, []);

  function addTower(latlng) {
    const id = idRef.current++;
    const t = { id, lat: latlng.lat, lng: latlng.lng, freqGHz: 5.0 };
    setTowers((p) => [...p, t]);
    setMessage(`Added tower #${id}`);
  }

  function updateTower(id, patch) {
    setTowers((p) => p.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }

  function removeTower(id) {
    setTowers((p) => p.filter((t) => t.id !== id));
    setLinks((p) => p.filter((l) => l.a !== id && l.b !== id));
    if (selected === id) setSelected(null);
  }

  function tryMakeLink(id) {
    if (!selected) {
      setSelected(id);
      setMessage("Select second tower to complete link");
      return;
    }
    if (selected === id) {
      setSelected(null);
      return;
    }
    const A = towers.find((t) => t.id === selected);
    const B = towers.find((t) => t.id === id);
    if (!A || !B) {
      setSelected(null);
      return;
    }
    if (A.freqGHz !== B.freqGHz) {
      setMessage("Cannot link towers with different frequencies");
      setSelected(null);
      return;
    }
    const exists = links.some(
      (l) => (l.a === A.id && l.b === B.id) || (l.a === B.id && l.b === A.id)
    );
    if (exists) {
      setMessage("Link already exists");
      setSelected(null);
      return;
    }
    const lid = `L${Date.now()}`;
    setLinks((p) => [...p, { id: lid, a: A.id, b: B.id }]);
    setMessage(`Created link ${A.id} ↔ ${B.id}`);
    setSelected(null);
  }

  function removeLink(id) {
    setLinks((p) => p.filter((l) => l.id !== id));
    if (activeLink === id) setActiveLink(null);
  }

   async function computeLink(link) {
    // compute distance, lambda, r_mid and attempt elevation fetch (optional)
    const A = towers.find((t) => t.id === link.a);
    const B = towers.find((t) => t.id === link.b);
    if (!A || !B) return;

    // Haversine distance
    const R = 6371000;
    const toRad = (x) => (x * Math.PI) / 180;
    const dLat = toRad(B.lat - A.lat);
    const dLon = toRad(B.lng - A.lng);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(A.lat)) * Math.cos(toRad(B.lat)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const dist = R * c;

    const freqHz = (A.freqGHz || 1) * 1e9;
    const lambda = SPEED_OF_LIGHT / freqHz;
    const r_mid = Math.sqrt((lambda * (dist / 2) * (dist / 2)) / dist);

    // optimistic local update first — ensures Fresnel renders immediately with r_mid
    setLinks((p) =>
      p.map((l) => (l.id === link.id ? { ...l, dist, r_mid, lambda } : l))
    );

    // set active link after we've updated the link with r_mid
    setActiveLink(link.id);

    // optional elevation fetch (best-effort)
    let elevations = null;
    try {
      const midLat = (A.lat + B.lat) / 2;
      const midLng = (A.lng + B.lng) / 2;
      const locations = `${A.lat},${A.lng}|${midLat},${midLng}|${B.lat},${B.lng}`;
      const resp = await fetch(
        `https://api.open-elevation.com/api/v1/lookup?locations=${encodeURIComponent(locations)}`
      );
      if (resp.ok) {
        const data = await resp.json();
        if (data && Array.isArray(data.results)) elevations = data.results.map((r) => r.elevation);
      }
    } catch (e) {
      // ignore elevation errors
    }

    // if we got elevations, write them back into the link object (keeps r_mid/dist already set)
    if (elevations) {
      setLinks((p) => p.map((l) => (l.id === link.id ? { ...l, elevations } : l)));
    }

    setMessage(`${link.a}↔${link.b} ${formatMeters(dist)} — r_mid ≈ ${r_mid.toFixed(2)} m`);
  }


  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "system-ui, sans-serif" }}>
      <Sidebar
        towers={towers}
        links={links}
        onAddTower={addTower}
        onUpdateTower={updateTower}
        onRemoveTower={removeTower}
        selectedForLink={selected}
        onTryMakeLink={tryMakeLink}
        onRemoveLink={removeLink}
        onComputeLink={computeLink}
        activeLink={activeLink}
        message={message}
      />

      <MapView
        towers={towers}
        links={links}
        activeLink={activeLink}
        onMapClick={addTower}
        onTryMakeLink={tryMakeLink}
        onLinkClick={computeLink}
      />
    </div>
  );
}
