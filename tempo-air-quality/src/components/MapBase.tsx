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

  useEffect(() => {
    if (!mapContainer.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: `https://api.maptiler.com/maps/streets-v2/style.json?key=${process.env.NEXT_PUBLIC_MAPTILER_KEY}`,
      center: [-98, 39],
      zoom: 3.5,
    });

    map.on("load", () => {
      onMapReady(map);
    });

    return () => map.remove();
  }, [onMapReady]);

  return <div ref={mapContainer} className="w-full h-full" />;
}
