"use client";

import { useEffect, useRef, useState } from "react";

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

// Dehradun bounds — users cannot pan outside this area
const DEHRADUN_BOUNDS = {
  north: 30.55,
  south: 30.15,
  east: 78.25,
  west: 77.85,
};

const DEHRADUN_CENTER: [number, number] = [30.3165, 78.0322];

export default function DehradunMap({ pins, currentUserId }: DehradunMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<unknown>(null);
  const [scrollEnabled, setScrollEnabled] = useState(false);

  useEffect(() => {
    console.log("DehradunMap pins:", pins);
    if (!mapRef.current) return;
    let cancelled = false;

    if (mapInstanceRef.current) {
      // @ts-expect-error — leaflet
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    if (!document.querySelector('link[href*="leaflet"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    import("leaflet").then((L) => {
      if (cancelled || !mapRef.current) return;
      const container = mapRef.current as HTMLElement & { _leaflet_id?: number };
      if (container._leaflet_id) return;

      // @ts-expect-error — leaflet internal
      delete L.Icon.Default.prototype._getIconUrl;

      const map = L.map(mapRef.current!, {
        center: DEHRADUN_CENTER,
        zoom: 13,
        minZoom: 11,       // can't zoom out past city level
        maxZoom: 17,       // can't zoom in past street level
        zoomControl: false, // we add custom positioned control
        scrollWheelZoom: false, // disabled by default — enable on click
        // Lock to Dehradun bounds
        maxBounds: [
          [DEHRADUN_BOUNDS.south, DEHRADUN_BOUNDS.west],
          [DEHRADUN_BOUNDS.north, DEHRADUN_BOUNDS.east],
        ],
        maxBoundsViscosity: 1.0, // hard lock — can't drag outside bounds
      });

      mapInstanceRef.current = map;

      // Custom zoom control — bottom right
      L.control.zoom({ position: "bottomright" }).addTo(map);

      // CartoDB Voyager — clean modern style, works in light/dark
      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
        {
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/">CARTO</a>',
          subdomains: "abcd",
          maxZoom: 19,
        }
      ).addTo(map);

      // Dehradun city boundary circle — visual marker of the city
      L.circle(DEHRADUN_CENTER, {
        radius: 8000,          // ~8km radius covers most of Dehradun
        color: "rgb(34 120 80)",
        weight: 1.5,
        opacity: 0.25,
        fillColor: "rgb(34 120 80)",
        fillOpacity: 0.04,
        dashArray: "6 4",
      }).addTo(map);

      // City label at center
      L.divIcon({
        className: "",
        html: `<div style="
          background: rgba(34,120,80,0.9);
          color: white;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 700;
          white-space: nowrap;
          font-family: sans-serif;
          letter-spacing: 0.05em;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        ">📍 Dehradun</div>`,
        iconSize: [100, 24],
        iconAnchor: [50, 12],
      });

      // Popular Dehradun spots
      const spots = [
        { name: "Clock Tower", lat: 30.3254, lng: 78.0435, emoji: "🏛️" },
        { name: "Rajpur Road", lat: 30.3397, lng: 78.0650, emoji: "☕" },
        { name: "FRI Campus", lat: 30.3415, lng: 77.9993, emoji: "🌲" },
        { name: "Robber's Cave", lat: 30.3798, lng: 78.0158, emoji: "🏔️" },
        { name: "Paltan Bazaar", lat: 30.3230, lng: 78.0430, emoji: "🛍️" },
        { name: "Mussoorie Road", lat: 30.4200, lng: 78.0600, emoji: "⛰️" },
      ];

      spots.forEach((spot) => {
        const spotIcon = L.divIcon({
          className: "",
          html: `<div style="
            background: white;
            border: 1.5px solid rgba(194,140,74,0.4);
            padding: 3px 8px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: 600;
            white-space: nowrap;
            box-shadow: 0 2px 6px rgba(0,0,0,0.12);
            font-family: sans-serif;
            color: #444;
            display: flex;
            align-items: center;
            gap: 4px;
          ">${spot.emoji} ${spot.name}</div>`,
          iconAnchor: [50, 12],
        });

        L.marker([spot.lat, spot.lng], { icon: spotIcon })
          .bindPopup(`
            <div style="font-family:sans-serif;padding:4px">
              <p style="font-weight:700;margin:0 0 2px">${spot.emoji} ${spot.name}</p>
              <p style="font-size:11px;color:#999;margin:0">Popular spot in Dehradun</p>
            </div>
          `)
          .addTo(map);
      });

      // User pins
      pins.forEach((pin) => {
        const isCurrentUser = pin.userId === currentUserId;
        const primary = "rgb(34,120,80)";
        const checkedInTime = new Date(pin.checkedInAt).toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
        });

        const icon = L.divIcon({
          className: "",
          html: `
            <div style="display:flex;flex-direction:column;align-items:center;cursor:pointer;filter:drop-shadow(0 4px 6px rgba(0,0,0,0.25))">
              <div style="
                width:44px;height:44px;border-radius:50%;
                border:3px solid ${isCurrentUser ? primary : "white"};
                background:${isCurrentUser ? primary : "#1a1a2e"};
                display:flex;align-items:center;justify-content:center;
                color:white;font-weight:800;font-size:17px;
                overflow:hidden;position:relative;
              ">
                ${pin.avatar
                  ? `<img src="${pin.avatar}" style="width:100%;height:100%;object-fit:cover;border-radius:50%"/>`
                  : `<span style="font-family:sans-serif">${(pin.name?.charAt(0) || "?").toUpperCase()}</span>`
                }
                ${isCurrentUser ? `<div style="position:absolute;bottom:1px;right:1px;width:10px;height:10px;border-radius:50%;background:#4ade80;border:2px solid white"></div>` : ""}
              </div>
              <div style="
                width:0;height:0;
                border-left:7px solid transparent;
                border-right:7px solid transparent;
                border-top:9px solid ${isCurrentUser ? primary : "white"};
                margin-top:-1px;
              "></div>
            </div>
          `,
          iconSize: [44, 56],
          iconAnchor: [22, 56],
        });

        const marker = L.marker([pin.coords.lat, pin.coords.lng], { icon });

        marker.bindPopup(`
          <div style="min-width:160px;font-family:sans-serif;padding:4px">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
              <div style="
                width:32px;height:32px;border-radius:50%;
                background:${isCurrentUser ? primary : "#1a1a2e"};
                display:flex;align-items:center;justify-content:center;
                color:white;font-weight:700;font-size:13px;overflow:hidden;flex-shrink:0
              ">
                ${pin.avatar
                  ? `<img src="${pin.avatar}" style="width:100%;height:100%;object-fit:cover"/>`
                  : (pin.name?.charAt(0) || "?").toUpperCase()
                }
              </div>
              <div>
                <p style="font-weight:700;margin:0;font-size:13px">${pin.name}</p>
                ${isCurrentUser ? `<p style="font-size:10px;color:${primary};font-weight:600;margin:0">You</p>` : ""}
              </div>
            </div>
            ${pin.label ? `<p style="font-size:12px;color:#555;margin:0 0 4px;padding:4px 8px;background:#f5f5f5;border-radius:8px">${pin.label}</p>` : ""}
            <p style="font-size:11px;color:#999;margin:0">⏰ Checked in at ${checkedInTime}</p>
          </div>
        `, { maxWidth: 220 });

        marker.addTo(map);
      });

      // Scroll zoom — enable on map click, disable when mouse leaves
      map.on("click", () => {
        map.scrollWheelZoom.enable();
        setScrollEnabled(true);
      });

      map.getContainer().addEventListener("mouseleave", () => {
        map.scrollWheelZoom.disable();
        setScrollEnabled(false);
      });
    });

    return () => {
      cancelled = true;
      if (mapInstanceRef.current) {
        // @ts-expect-error — leaflet
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [pins, currentUserId]);

  return (
    <div className="relative h-full w-full">
      <div
        ref={mapRef}
        className="h-full w-full rounded-2xl overflow-hidden"
        style={{ minHeight: "500px" }}
      />

      {/* Scroll hint overlay */}
      {!scrollEnabled && (
        <div
          className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full px-3 py-1.5 text-xs font-medium text-white"
          style={{ backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
        >
          Click map to enable scroll zoom
        </div>
      )}
    </div>
  );
}