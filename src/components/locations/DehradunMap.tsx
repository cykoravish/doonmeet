"use client";

import { useEffect, useRef } from "react";

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

export default function DehradunMap({ pins, currentUserId }: DehradunMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<unknown>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Dynamically import leaflet — avoids SSR issues
    import("leaflet").then((L) => {
      // Fix default marker icons
      // @ts-expect-error — leaflet internal
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      // Dehradun center coords
      const map = L.map(mapRef.current!, {
        center: [30.3165, 78.0322],
        zoom: 13,
        zoomControl: true,
      });

      mapInstanceRef.current = map;

      // OpenStreetMap tiles — free, no API key
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);

      // Add user pins
      pins.forEach((pin) => {
        const isCurrentUser = pin.userId === currentUserId;

        const icon = L.divIcon({
          className: "",
          html: `
            <div style="
              display: flex;
              flex-direction: column;
              align-items: center;
              cursor: pointer;
            ">
              <div style="
                width: 40px;
                height: 40px;
                border-radius: 50%;
                border: 3px solid ${isCurrentUser ? "rgb(34 120 80)" : "white"};
                background: ${isCurrentUser ? "rgb(34 120 80)" : "#333"};
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: bold;
                font-size: 16px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                overflow: hidden;
              ">
                ${pin.avatar
                  ? `<img src="${pin.avatar}" style="width:100%;height:100%;object-fit:cover;border-radius:50%"/>`
                  : `<span>${pin.name[0].toUpperCase()}</span>`
                }
              </div>
              <div style="
                width: 0;
                height: 0;
                border-left: 6px solid transparent;
                border-right: 6px solid transparent;
                border-top: 8px solid ${isCurrentUser ? "rgb(34 120 80)" : "white"};
                margin-top: -1px;
              "></div>
            </div>
          `,
          iconSize: [40, 52],
          iconAnchor: [20, 52],
        });

        const checkedInTime = new Date(pin.checkedInAt).toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
        });

        const marker = L.marker([pin.coords.lat, pin.coords.lng], { icon });

        marker.bindPopup(`
          <div style="min-width:140px;font-family:sans-serif">
            <p style="font-weight:700;margin:0 0 2px">${pin.name}</p>
            ${pin.label ? `<p style="font-size:12px;color:#666;margin:0 0 4px">${pin.label}</p>` : ""}
            <p style="font-size:11px;color:#999;margin:0">📍 Checked in at ${checkedInTime}</p>
            ${isCurrentUser ? `<p style="font-size:11px;color:rgb(34 120 80);font-weight:600;margin:4px 0 0">That's you!</p>` : ""}
          </div>
        `);

        marker.addTo(map);
      });

      // Popular Dehradun spots as reference markers
      const spots = [
        { name: "Clock Tower", lat: 30.3254, lng: 78.0435 },
        { name: "Rajpur Road", lat: 30.3397, lng: 78.0650 },
        { name: "FRI", lat: 30.3415, lng: 77.9993 },
        { name: "Robber's Cave", lat: 30.3798, lng: 78.0158 },
      ];

      const spotIcon = L.divIcon({
        className: "",
        html: `<div style="
          background: rgb(194 140 74);
          color: white;
          padding: 3px 8px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
          white-space: nowrap;
          box-shadow: 0 2px 6px rgba(0,0,0,0.2);
          font-family: sans-serif;
        ">📍</div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      spots.forEach((spot) => {
        L.marker([spot.lat, spot.lng], { icon: spotIcon })
          .bindPopup(`<b>${spot.name}</b><br><small>Popular spot</small>`)
          .addTo(map);
      });
    });

    // Load leaflet CSS
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);

    return () => {
      if (mapInstanceRef.current) {
        // @ts-expect-error — leaflet map remove
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [pins, currentUserId]);

  return (
    <div
      ref={mapRef}
      className="h-full w-full rounded-2xl overflow-hidden"
      style={{ minHeight: "500px" }}
    />
  );
}