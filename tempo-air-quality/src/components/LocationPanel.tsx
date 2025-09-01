"use client";

import { useState, useRef } from "react";
import type { Map } from "maplibre-gl";
import maplibregl from "maplibre-gl";
import Image from "next/image";

interface LocationPanelProps {
  mapRef: Map | null;
}

interface CitySuggestion {
  name: string;
  state: string;
  coordinates: [number, number];
  isZIP?: boolean;
  isAddress?: boolean;
  isPOI?: boolean;
  isCity?: boolean;
  fullName?: string;
  placeType?: string;
}

interface GeocodingFeature {
  center: [number, number];
  place_name: string;
  text: string;
  place_type: string[];
  context?: Array<{
    id: string;
    text: string;
  }>;
}

export default function LocationPanel({ mapRef }: LocationPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<CitySuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Helper function to get OpenMoji SVG
  const getOpenMojiSVG = (hexcode: string) => {
    return `/openmoji/${hexcode}.svg`;
  };

  const handleSearchInput = (value: string) => {
    setSearchQuery(value);

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (value.trim().length === 0) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Show suggestions area when user is typing
    setShowSuggestions(true);

    // For single characters, show some common suggestions
    if (value.trim().length === 1) {
      // Don't make API call for single character, but keep suggestions area open
      setSuggestions([]);
      return;
    }

    // Only search if query is at least 2 characters long
    if (value.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // If the current value looks like a selected result (contains comma),
    // extract the main part for searching
    let searchValue = value;
    if (value.includes(",")) {
      searchValue = value.split(",")[0].trim();
    }

    // Debounce API calls to avoid too many requests
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        // Use MapTiler Geocoding API for dynamic search with broader types
        const response = await fetch(
          `https://api.maptiler.com/geocoding/${encodeURIComponent(
            searchValue
          )}.json?key=${
            process.env.NEXT_PUBLIC_MAPTILER_KEY
          }&limit=10&country=US&types=place,postal_code,address,poi,locality,municipality`
        );

        if (response.ok) {
          const data = await response.json();

          if (data.features && data.features.length > 0) {
            const apiSuggestions = data.features.map(
              (feature: GeocodingFeature) => {
                const [longitude, latitude] = feature.center;
                const placeName = feature.place_name || feature.text;
                const placeType = feature.place_type?.[0];
                const isZIP = placeType === "postal_code";
                const isAddress = placeType === "address";
                const isPOI = placeType === "poi";
                const isCity =
                  placeType === "place" ||
                  placeType === "locality" ||
                  placeType === "municipality";

                // Get state from context
                const state =
                  feature.context?.find((ctx) => ctx.id?.startsWith("region"))
                    ?.text || "US";

                // Format display name based on type
                let displayName = placeName;
                if (isZIP) {
                  displayName = feature.text; // Just show the ZIP code number
                } else if (isAddress) {
                  displayName = feature.place_name || feature.text;
                } else if (isPOI) {
                  displayName = feature.text;
                }

                return {
                  name: displayName,
                  state: state,
                  coordinates: [longitude, latitude],
                  isZIP: isZIP,
                  isAddress: isAddress,
                  isPOI: isPOI,
                  isCity: isCity,
                  fullName: feature.place_name,
                  placeType: placeType,
                };
              }
            );

            setSuggestions(apiSuggestions);
            setShowSuggestions(true);
          } else {
            // No results from API
            setSuggestions([]);
            setShowSuggestions(false);
          }
        } else {
          // API error - show empty state
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } catch (error) {
        console.error("Geocoding API error:", error);
        // API error - show empty state
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300); // 300ms debounce
  };

  const handleCitySelect = (city: CitySuggestion) => {
    if (!mapRef) return;

    // Check if this is a ZIP code selection
    if (city.isZIP) {
      const zipCode = city.name; // No need to remove prefix anymore
      setSearchQuery(zipCode);
      setShowSuggestions(false);
      setSuggestions([]);

      // Use the coordinates we already have from the suggestion
      mapRef.flyTo({
        center: city.coordinates,
        zoom: 12,
        duration: 2000,
      });

      // Add ZIP code marker
      const zipMarker = new maplibregl.Marker({
        color: "#10B981",
        scale: 1.2,
      })
        .setLngLat(city.coordinates)
        .addTo(mapRef);

      // Create popup
      const popup = new maplibregl.Popup({ offset: 12 }).setHTML(`
           <div class="p-2">
             <h3 class="font-semibold text-green-600 flex items-center">
               <img src="/maps.png" alt="ZIP Code" class="w-4 h-4 mr-1 object-contain" />
               ZIP Code: ${zipCode}
             </h3>
             <p class="text-sm text-gray-600">Latitude: ${city.coordinates[1].toFixed(
               4
             )}</p>
             <p class="text-sm text-gray-600">Longitude: ${city.coordinates[0].toFixed(
               4
             )}</p>
           </div>
         `);

      zipMarker.setPopup(popup);

      // Remove marker after 10 seconds
      setTimeout(() => {
        zipMarker.remove();
      }, 10000);

      return;
    }

    setSearchQuery(`${city.name}, ${city.state}`);
    setShowSuggestions(false);
    setSuggestions([]);

    // Fly to city
    mapRef.flyTo({
      center: city.coordinates,
      zoom: 10,
      duration: 2000,
    });

    // Add city marker
    const cityMarker = new maplibregl.Marker({
      color: "#EF4444",
      scale: 1.2,
    })
      .setLngLat(city.coordinates)
      .addTo(mapRef);

    // Create popup
    const popup = new maplibregl.Popup({ offset: 12 }).setHTML(`
         <div class="p-2">
           <h3 class="font-semibold text-red-600 flex items-center">
             <img src="/maps.png" alt="Search" class="w-4 h-4 mr-1 object-contain" />
             ${city.name}, ${city.state}
           </h3>
           <p class="text-sm text-gray-600">Latitude: ${city.coordinates[1].toFixed(
             4
           )}</p>
           <p class="text-sm text-gray-600">Longitude: ${city.coordinates[0].toFixed(
             4
           )}</p>
         </div>
       `);

    cityMarker.setPopup(popup);

    // Remove marker after 10 seconds
    setTimeout(() => {
      cityMarker.remove();
    }, 10000);
  };

  const handleZipCodeSearch = async (zipCode?: string) => {
    const codeToSearch = zipCode || searchQuery.trim();
    if (!codeToSearch || !mapRef) return;

    // Check if input looks like a zip code (5 digits)
    const zipCodePattern = /^\d{5}$/;
    if (!zipCodePattern.test(codeToSearch)) {
      return; // Not a zip code, let city search handle it
    }

    try {
      // Use MapTiler's geocoding API for zip code
      const response = await fetch(
        `https://api.maptiler.com/geocoding/${encodeURIComponent(
          codeToSearch
        )}.json?key=${
          process.env.NEXT_PUBLIC_MAPTILER_KEY
        }&limit=1&country=US&types=postal_code`
      );

      if (!response.ok) {
        throw new Error("Zip code search failed");
      }

      const data = await response.json();

      if (data.features && data.features.length > 0) {
        const [longitude, latitude] = data.features[0].center;

        // Fly to zip code location
        mapRef.flyTo({
          center: [longitude, latitude],
          zoom: 12,
          duration: 2000,
        });

        // Add zip code marker
        const zipMarker = new maplibregl.Marker({
          color: "#10B981",
          scale: 1.2,
        })
          .setLngLat([longitude, latitude])
          .addTo(mapRef);

        // Create popup
        const popup = new maplibregl.Popup({ offset: 12 }).setHTML(`
             <div class="p-2">
                                <h3 class="font-semibold text-green-600 flex items-center">
                   <img src="/maps.png" alt="ZIP Code" class="w-4 h-4 mr-1 object-contain" />
                   ZIP Code: ${codeToSearch}
                 </h3>
               <p class="text-sm text-gray-600">Latitude: ${latitude.toFixed(
                 4
               )}</p>
               <p class="text-sm text-gray-600">Longitude: ${longitude.toFixed(
                 4
               )}</p>
             </div>
           `);

        zipMarker.setPopup(popup);

        // Remove marker after 10 seconds
        setTimeout(() => {
          zipMarker.remove();
        }, 10000);

        setSearchQuery("");
      } else {
        alert("ZIP code not found. Please try a different ZIP code.");
      }
    } catch (error) {
      console.error("ZIP code search failed:", error);
      alert("Failed to search ZIP code. Please try again.");
    }
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) return;

    // Check if it's a zip code first
    const zipCodePattern = /^\d{5}$/;
    if (zipCodePattern.test(searchQuery.trim())) {
      handleZipCodeSearch();
      return;
    }

    // If no suggestions match, try geocoding
    const exactMatch = suggestions.find(
      (city) =>
        city.name.toLowerCase() === searchQuery.toLowerCase() ||
        `${city.name}, ${city.state}`.toLowerCase() ===
          searchQuery.toLowerCase()
    );

    if (exactMatch) {
      handleCitySelect(exactMatch);
    } else {
      // Try geocoding for other cities
      handleZipCodeSearch(); // Reuse the geocoding function
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 mb-4 relative border border-blue-100 shadow-sm">
      {/* Map icon positioned on the component border */}
      <div className="absolute -bottom-2 -right-3 z-10">
        <Image
          src="/maps.png"
          alt="Map"
          width={60}
          height={80}
          className="object-contain"
        />
      </div>

      <div className="flex items-end space-x-0">
        {/* Left side - Title and Input */}
        <div className="flex-1">
          {/* Title */}
          <div className="mb-2">
            <span className="text-sm font-medium text-gray-700">
              Search for cities & locations
            </span>
          </div>

          {/* Search Input */}
          <div className="relative">
            <div className="flex items-center border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent h-10 w-52">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchInput(e.target.value)}
                placeholder="Search city or ZIP code..."
                className="flex-1 px-3 py-2 focus:outline-none text-sm rounded-lg h-full"
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                onFocus={() => {
                  // If there's text in the input, show suggestions
                  if (searchQuery.trim().length > 0) {
                    setShowSuggestions(true);
                  }
                }}
                onClick={() => {
                  // If the input contains a selected result (with comma), clear it for new search
                  if (searchQuery.includes(",")) {
                    setSearchQuery("");
                    setSuggestions([]);
                    setShowSuggestions(false);
                  }
                }}
              />

              {/* Clear button */}
              {searchQuery.length > 0 && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSuggestions([]);
                    setShowSuggestions(false);
                  }}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Clear search"
                >
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                {suggestions.map((city, index) => (
                  <button
                    key={index}
                    onClick={() => handleCitySelect(city)}
                    className="w-full px-3 py-2 text-left hover:bg-blue-50 focus:bg-blue-50 focus:outline-none border-b border-gray-100 last:border-b-0 transition-colors duration-150"
                  >
                    <div className="font-medium text-gray-900">
                      {city.isZIP ? (
                        <span className="text-green-600 flex items-center">
                          <Image
                            src={getOpenMojiSVG("1F4EE")}
                            alt="ZIP"
                            width={16}
                            height={16}
                            className="mr-1"
                          />
                          {city.name}
                        </span>
                      ) : city.isCity ? (
                        <span className="text-orange-600 flex items-center">
                          <Image
                            src={getOpenMojiSVG("1F3D9")}
                            alt="City"
                            width={16}
                            height={16}
                            className="mr-1"
                          />
                          {city.name}
                        </span>
                      ) : city.isAddress ? (
                        <span className="text-blue-600 flex items-center">
                          <Image
                            src={getOpenMojiSVG("1F4CD")}
                            alt="Address"
                            width={16}
                            height={16}
                            className="mr-1"
                          />
                          {city.name}
                        </span>
                      ) : city.isPOI ? (
                        <span className="text-purple-600 flex items-center">
                          <Image
                            src={getOpenMojiSVG("1F3E2")}
                            alt="POI"
                            width={16}
                            height={16}
                            className="mr-1"
                          />
                          {city.name}
                        </span>
                      ) : (
                        <span className="text-gray-800 flex items-center">
                          <Image
                            src={getOpenMojiSVG("1F3D9")}
                            alt="Place"
                            width={16}
                            height={16}
                            className="mr-1"
                          />
                          {city.name}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      {city.isZIP
                        ? "ZIP Code"
                        : city.isCity
                        ? "City"
                        : city.isAddress
                        ? "Address"
                        : city.isPOI
                        ? "Point of Interest"
                        : city.state}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Show message when searching but no results */}
            {showSuggestions &&
              searchQuery.trim().length >= 2 &&
              suggestions.length === 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 p-3 text-center text-gray-500">
                  No results found for &quot;{searchQuery}&quot;
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}
