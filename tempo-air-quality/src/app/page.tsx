"use client";

import MapBase from "@/components/MapBase";

export default function Home() {
  return (
    <main className="flex h-screen pt-16">
      <div className="flex-1 relative">
        <MapBase onMapReady={() => {}} />
      </div>

      <aside className="w-80 bg-gray-100 p-4">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Air Quality Panel
        </h2>
        <div className="bg-white rounded-lg p-4 space-y-2">
          <div className="flex justify-between">
            <span>Status:</span>
            <span className="font-semibold">Ready</span>
          </div>
          <div className="flex justify-between">
            <span>Map:</span>
            <span className="font-semibold">United States</span>
          </div>
        </div>
      </aside>
    </main>
  );
}
