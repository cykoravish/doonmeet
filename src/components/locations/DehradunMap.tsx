"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useTheme } from "@/providers/theme-provider";

interface LocationPin {
  userId: string;
  name: string;
  avatar: string | null;
  coords: { lat: number; lng: number };
  label: string | null;
  checkedInAt: string;
}

interface DehradunMapProps {
  pins: LocationPin[];
  currentUserId?: string;
}

// Free, no-key vector tiles — OSM data via OpenFreeMap (OpenMapTiles schema)
const STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";

const DEHRADUN_CENTER: [number, number] = [78.0322, 30.3165]; // [lng, lat]
const DEHRADUN_BOUNDS: [[number, number], [number, number]] = [
  [77.82, 30.12],
  [78.28, 30.58],
];

// Rough organic outline of the Doon valley urban belt (NW → SE), used purely
// as a visual "spotlight" — not an official administrative boundary.
const DEHRADUN_OUTLINE: [number, number][] = [
  [78.02, 30.5],
  [78.1, 30.47],
  [78.16, 30.42],
  [78.2, 30.36],
  [78.22, 30.3],
  [78.18, 30.24],
  [78.1, 30.19],
  [78.0, 30.17],
  [77.92, 30.19],
  [77.87, 30.24],
  [77.88, 30.32],
  [77.93, 30.4],
  [77.98, 30.46],
  [78.02, 30.5],
];

// Huge outer ring so the "outside" fill covers the whole visible world
const WORLD_RING: [number, number][] = [
  [-180, -85],
  [180, -85],
  [180, 85],
  [-180, 85],
  [-180, -85],
];

const SPOTS = [
  { name: "Clock Tower", lat: 30.3254, lng: 78.0435, emoji: "🏛️" },
  { name: "Rajpur Road", lat: 30.3397, lng: 78.065, emoji: "☕" },
  { name: "FRI Campus", lat: 30.3415, lng: 77.9993, emoji: "🌲" },
  { name: "Robber's Cave", lat: 30.3798, lng: 78.0158, emoji: "🏔️" },
  { name: "Paltan Bazaar", lat: 30.323, lng: 78.043, emoji: "🛍️" },
  { name: "Mussoorie Road", lat: 30.42, lng: 78.06, emoji: "⛰️" },
];

type Palette = ReturnType<typeof getPalette>;

function getPalette(isNight: boolean) {
  return isNight
    ? {
        primary: "rgb(40,160,100)",
        primaryLight: "rgb(72,210,140)",
        accent: "rgb(194,140,74)",
        background: "rgb(10,14,12)",
        surface: "rgb(16,22,18)",
        text: "rgb(230,240,234)",
        muted: "rgb(140,165,150)",
        water: "rgb(22,40,42)",
        park: "rgb(20,36,26)",
        building: "rgb(24,32,27)",
        roadMinor: "rgb(48,64,54)",
        roadMajor: "rgb(60,90,74)",
        dim: "rgba(4,6,5,0.65)",
      }
    : {
        primary: "rgb(34,120,80)",
        primaryLight: "rgb(52,168,110)",
        accent: "rgb(194,140,74)",
        background: "rgb(245,248,245)",
        surface: "rgb(255,255,255)",
        text: "rgb(20,40,30)",
        muted: "rgb(100,130,115)",
        water: "rgb(197,222,224)",
        park: "rgb(214,232,210)",
        building: "rgb(232,236,230)",
        roadMinor: "rgb(255,255,255)",
        roadMajor: "rgb(255,255,255)",
        dim: "rgba(180,196,186,0.55)",
      };
}

// Re-theme the vector style once loaded — matches roads/water/parks/labels
// to the DoonMeet palette instead of the default Liberty look.
function restyleMap(map: maplibregl.Map, p: Palette) {
  const layers = map.getStyle()?.layers ?? [];

  for (const layer of layers) {
    const id = layer.id;
    const sourceLayer = "source-layer" in layer ? layer["source-layer"] : undefined;

    try {
      if (layer.type === "background") {
        map.setPaintProperty(id, "background-color", p.background);
      } else if (sourceLayer === "water" && layer.type === "fill") {
        map.setPaintProperty(id, "fill-color", p.water);
      } else if (
        (sourceLayer === "landcover" || sourceLayer === "landuse" || sourceLayer === "park") &&
        layer.type === "fill"
      ) {
        map.setPaintProperty(id, "fill-color", p.park);
        map.setPaintProperty(id, "fill-opacity", 0.6);
      } else if (sourceLayer === "building" && layer.type === "fill") {
        map.setPaintProperty(id, "fill-color", p.building);
        map.setPaintProperty(id, "fill-opacity", 0.5);
      } else if (sourceLayer === "transportation" && layer.type === "line") {
        const major = /motorway|trunk|primary/.test(id);
        const mid = /secondary|tertiary/.test(id);
        if (major) {
          map.setPaintProperty(id, "line-color", p.accent);
        } else if (mid) {
          map.setPaintProperty(id, "line-color", p.primary);
        } else {
          map.setPaintProperty(id, "line-color", p.roadMajor);
        }
      } else if (layer.type === "symbol" && /label|place|poi/.test(id)) {
        if (map.getLayoutProperty(id, "text-field") !== undefined) {
          map.setPaintProperty(id, "text-color", p.text);
          map.setPaintProperty(id, "text-halo-color", p.surface);
          map.setPaintProperty(id, "text-halo-width", 1.2);
        }
      }
    } catch {
      // Some layers won't support every property — safe to skip.
    }
  }
}

function addSpotlight(map: maplibregl.Map, p: Palette) {
  const outerRing = WORLD_RING;
  const innerRing = [...DEHRADUN_OUTLINE].reverse();

  map.addSource("dehradun-spotlight", {
    type: "geojson",
    data: {
      type: "Feature",
      properties: {},
      geometry: { type: "Polygon", coordinates: [outerRing, innerRing] },
    },
  });

  map.addSource("dehradun-outline", {
    type: "geojson",
    data: {
      type: "Feature",
      properties: {},
      geometry: { type: "LineString", coordinates: DEHRADUN_OUTLINE },
    },
  });

  // Dim everything outside the valley
  map.addLayer({
    id: "spotlight-dim",
    type: "fill",
    source: "dehradun-spotlight",
    paint: { "fill-color": p.dim },
  });

  // Soft outer glow (wide, blurred, faint)
  map.addLayer({
    id: "boundary-glow-outer",
    type: "line",
    source: "dehradun-outline",
    paint: {
      "line-color": p.primaryLight,
      "line-width": 22,
      "line-blur": 18,
      "line-opacity": 0.35,
    },
  });

  // Mid glow
  map.addLayer({
    id: "boundary-glow-mid",
    type: "line",
    source: "dehradun-outline",
    paint: {
      "line-color": p.primaryLight,
      "line-width": 10,
      "line-blur": 6,
      "line-opacity": 0.45,
    },
  });

  // Crisp boundary line on top
  map.addLayer({
    id: "boundary-line",
    type: "line",
    source: "dehradun-outline",
    paint: {
      "line-color": p.primary,
      "line-width": 2,
      "line-opacity": 0.9,
      "line-dasharray": [2, 1.5],
    },
  });
}

export default function DehradunMap({ pins, currentUserId }: DehradunMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const [scrollEnabled, setScrollEnabled] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const { resolvedTheme } = useTheme();
  const isNight = resolvedTheme === "night";

  // Init map once
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = new maplibregl.Map({
      container: mapRef.current,
      style: STYLE_URL,
      center: DEHRADUN_CENTER,
      zoom: 12.5,
      minZoom: 11,
      maxZoom: 18,
      maxBounds: DEHRADUN_BOUNDS,
      scrollZoom: false,
      attributionControl: { compact: true },
    });

    mapInstanceRef.current = map;

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");

    map.on("load", () => {
      const p = getPalette(isNight);
      restyleMap(map, p);
      addSpotlight(map, p);

      // Popular spots — small themed pins
      SPOTS.forEach((spot) => {
        const el = document.createElement("div");
        el.className = "doon-spot-pin";
        el.innerHTML = `<span>${spot.emoji}</span><b>${spot.name}</b>`;
        new maplibregl.Marker({ element: el, anchor: "bottom" })
          .setLngLat([spot.lng, spot.lat])
          .setPopup(
            new maplibregl.Popup({ offset: 18, className: "doon-popup" }).setHTML(
              `<div class="doon-popup-inner"><p class="doon-popup-title">${spot.emoji} ${spot.name}</p><p class="doon-popup-sub">Popular spot in Dehradun</p></div>`
            )
          )
          .addTo(map);
      });

      setMapReady(true);
    });

    map.on("click", () => {
      map.scrollZoom.enable();
      setScrollEnabled(true);
    });
    map.getContainer().addEventListener("mouseleave", () => {
      map.scrollZoom.disable();
      setScrollEnabled(false);
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-theme on theme change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapReady) return;
    const p = getPalette(isNight);
    restyleMap(map, p);
    ["spotlight-dim", "boundary-glow-outer", "boundary-glow-mid", "boundary-line"].forEach((id) => {
      if (!map.getLayer(id)) return;
      if (id === "spotlight-dim") map.setPaintProperty(id, "fill-color", p.dim);
      if (id === "boundary-glow-outer" || id === "boundary-glow-mid")
        map.setPaintProperty(id, "line-color", p.primaryLight);
      if (id === "boundary-line") map.setPaintProperty(id, "line-color", p.primary);
    });
  }, [isNight, mapReady]);

  // Sync people pins whenever they change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapReady) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    pins.forEach((pin) => {
      const isCurrentUser = pin.userId === currentUserId;
      const checkedInTime = new Date(pin.checkedInAt).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      });

      const el = document.createElement("div");
      el.className = `doon-pin ${isCurrentUser ? "doon-pin--me" : ""}`;
      el.innerHTML = `
        ${isCurrentUser ? '<span class="doon-pin-pulse"></span>' : ""}
        <div class="doon-pin-avatar">
          ${
            pin.avatar
              ? `<img src="${pin.avatar}" alt="${pin.name}" />`
              : `<span>${(pin.name?.charAt(0) || "?").toUpperCase()}</span>`
          }
          ${isCurrentUser ? '<i class="doon-pin-dot"></i>' : ""}
        </div>
        <div class="doon-pin-tail"></div>
      `;

      const popupHtml = `
        <div class="doon-popup-inner">
          <div class="doon-popup-head">
            <div class="doon-popup-avatar">
              ${
                pin.avatar
                  ? `<img src="${pin.avatar}" alt="${pin.name}" />`
                  : (pin.name?.charAt(0) || "?").toUpperCase()
              }
            </div>
            <div>
              <p class="doon-popup-title">${pin.name}</p>
              ${isCurrentUser ? `<p class="doon-popup-you">You</p>` : ""}
            </div>
          </div>
          ${pin.label ? `<p class="doon-popup-label">${pin.label}</p>` : ""}
          <p class="doon-popup-sub">⏰ Checked in at ${checkedInTime}</p>
        </div>
      `;

      const marker = new maplibregl.Marker({ element: el, anchor: "bottom" })
        .setLngLat([pin.coords.lng, pin.coords.lat])
        .setPopup(new maplibregl.Popup({ offset: 28, className: "doon-popup" }).setHTML(popupHtml))
        .addTo(map);

      markersRef.current.push(marker);
    });
  }, [pins, currentUserId, mapReady]);

  return (
    <div className="relative h-full w-full">
      <div ref={mapRef} className="h-full w-full rounded-2xl overflow-hidden" style={{ minHeight: "500px" }} />

      {!scrollEnabled && (
        <div
          className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full px-3 py-1.5 text-xs font-medium text-white"
          style={{ backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
        >
          Click map to enable scroll zoom
        </div>
      )}

      <style jsx global>{`
        .doon-pin {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          cursor: pointer;
        }
        .doon-pin-avatar {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          border: 3px solid white;
          background: #1a1a2e;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 800;
          font-size: 16px;
          overflow: hidden;
          position: relative;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
          transition: transform 0.15s ease;
        }
        .doon-pin:hover .doon-pin-avatar {
          transform: scale(1.08);
        }
        .doon-pin-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .doon-pin--me .doon-pin-avatar {
          border-color: rgb(var(--primary));
          background: rgb(var(--primary));
        }
        .doon-pin-dot {
          position: absolute;
          bottom: 1px;
          right: 1px;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #4ade80;
          border: 2px solid white;
        }
        .doon-pin-tail {
          width: 0;
          height: 0;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-top: 8px solid white;
          margin-top: -1px;
        }
        .doon-pin--me .doon-pin-tail {
          border-top-color: rgb(var(--primary));
        }
        .doon-pin-pulse {
          position: absolute;
          top: 3px;
          width: 42px;
          height: 42px;
          border-radius: 50%;
          background: rgb(var(--primary) / 0.45);
          animation: doon-pulse 2s ease-out infinite;
        }
        @keyframes doon-pulse {
          0% {
            transform: scale(0.8);
            opacity: 0.7;
          }
          100% {
            transform: scale(2.1);
            opacity: 0;
          }
        }
        .doon-spot-pin {
          display: flex;
          align-items: center;
          gap: 4px;
          background: rgb(var(--surface));
          border: 1.5px solid rgb(var(--accent) / 0.4);
          padding: 3px 9px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
          white-space: nowrap;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
          color: rgb(var(--text));
        }
        .doon-popup .maplibregl-popup-content {
          background: rgb(var(--surface));
          color: rgb(var(--text));
          border-radius: 14px;
          padding: 10px 12px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
          border: 1px solid rgb(var(--border));
        }
        .doon-popup .maplibregl-popup-tip {
          border-top-color: rgb(var(--surface));
        }
        .doon-popup-inner {
          min-width: 150px;
          font-family: inherit;
        }
        .doon-popup-head {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 6px;
        }
        .doon-popup-avatar {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: rgb(var(--primary));
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 12px;
          overflow: hidden;
          flex-shrink: 0;
        }
        .doon-popup-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .doon-popup-title {
          font-weight: 700;
          margin: 0;
          font-size: 13px;
        }
        .doon-popup-you {
          font-size: 10px;
          font-weight: 600;
          color: rgb(var(--primary));
          margin: 0;
        }
        .doon-popup-label {
          font-size: 12px;
          margin: 0 0 4px;
          padding: 4px 8px;
          background: rgb(var(--background));
          border-radius: 8px;
        }
        .doon-popup-sub {
          font-size: 11px;
          color: rgb(var(--muted));
          margin: 0;
        }
        .maplibregl-ctrl-group {
          background: rgb(var(--surface)) !important;
          border-radius: 12px !important;
          overflow: hidden;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.15) !important;
        }
        .maplibregl-ctrl-group button {
          background: transparent !important;
        }
        .maplibregl-ctrl-attrib {
          background: rgb(var(--surface) / 0.7) !important;
          color: rgb(var(--muted)) !important;
        }
      `}</style>
    </div>
  );
}