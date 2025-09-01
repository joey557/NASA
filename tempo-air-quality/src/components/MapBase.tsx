"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

export default function MapBase({
  onMapReady,
}: {
  onMapReady: (map: maplibregl.Map) => void;
}) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: `https://api.maptiler.com/maps/streets-v2/style.json?key=${process.env.NEXT_PUBLIC_MAPTILER_KEY}`,
      center: [-98, 39],
      zoom: 3.5,
    });

    mapRef.current = map;

    map.on("load", () => {
      onMapReady(map);
    });

    return () => map.remove();
  }, [onMapReady]);

  const handleLocateMe = () => {
    if (!mapRef.current) return;

    // Request user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;

          // Fly to user location
          mapRef.current!.flyTo({
            center: [longitude, latitude],
            zoom: 12,
            duration: 2000,
          });

          // Add user location marker
          const userMarker = new maplibregl.Marker({
            color: "#3B82F6",
            scale: 1.2,
          })
            .setLngLat([longitude, latitude])
            .addTo(mapRef.current!);

          // Create popup
          const popup = new maplibregl.Popup({ offset: 12 }).setHTML(`
              <div class="p-2">
                <h3 class="font-semibold text-blue-600 flex items-center">
                  <img src="/maps.png" alt="Location" class="w-4 h-4 mr-1 object-contain" />
                  Your Location
                </h3>
                <p class="text-sm text-gray-600">Latitude: ${latitude.toFixed(
                  4
                )}</p>
                <p class="text-sm text-gray-600">Longitude: ${longitude.toFixed(
                  4
                )}</p>
              </div>
            `);

          userMarker.setPopup(popup);

          // Remove marker after 10 seconds
          setTimeout(() => {
            userMarker.remove();
          }, 10000);
        },
        (error) => {
          console.error("Location failed:", error);
          alert(
            "Failed to get your location. Please check your browser permissions."
          );
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        }
      );
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  };

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />

      {/* Location button on map */}
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={handleLocateMe}
          className="bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900 p-3 rounded-lg shadow-lg border border-gray-200 transition-all duration-200 hover:shadow-xl transform hover:scale-105"
          title="Locate my position"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
