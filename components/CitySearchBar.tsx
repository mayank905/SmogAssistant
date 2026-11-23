"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, MapPin, Loader2, Navigation } from "lucide-react";
import { GeocodingResult } from "@/lib/api/open-meteo";

interface CitySearchBarProps {
  currentCity: string;
  onSelectLocation: (lat: number, lon: number, name: string) => void;
  isLoading?: boolean;
}

export const CitySearchBar: React.FC<CitySearchBarProps> = ({
  currentCity,
  onSelectLocation,
  isLoading,
}) => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<GeocodingResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/aqi?search=${encodeURIComponent(query.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.results || []);
          setIsOpen(true);
        }
      } catch (err) {
        console.error("City search failed:", err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleUseCurrentLocation = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onSelectLocation(pos.coords.latitude, pos.coords.longitude, "Your Current Location");
        setIsOpen(false);
        setQuery("");
      },
      (err) => {
        alert("Unable to retrieve location: " + err.message);
      }
    );
  };

  return (
    <div ref={wrapperRef} className="relative w-full max-w-lg">
      <div className="relative flex items-center">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search city or district (Current: ${currentCity})...`}
          className="w-full pl-10 pr-24 py-2.5 bg-white border border-slate-300 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm transition-all"
        />
        <div className="absolute inset-y-0 right-0 pr-2 flex items-center space-x-1">
          {(isSearching || isLoading) && <Loader2 className="w-4 h-4 animate-spin text-slate-400 mr-1" />}
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            title="Use Current GPS Coordinates"
            aria-label="Use Current GPS Coordinates"
            className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
          >
            <Navigation className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isOpen && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-slate-200 z-50 overflow-hidden max-h-64 overflow-y-auto">
          {suggestions.map((item) => (
            <button
              key={`${item.id}-${item.name}`}
              onClick={() => {
                const displayName = `${item.name}${item.admin1 ? `, ${item.admin1}` : ""}, ${item.country}`;
                onSelectLocation(item.latitude, item.longitude, displayName);
                setIsOpen(false);
                setQuery("");
              }}
              className="w-full px-4 py-2.5 text-left text-sm hover:bg-slate-50 flex items-center justify-between border-b border-slate-100 last:border-0 transition-colors"
            >
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span className="font-medium text-slate-800">{item.name}</span>
                {item.admin1 && <span className="text-xs text-slate-500">({item.admin1})</span>}
              </div>
              <span className="text-xs text-slate-400 uppercase tracking-wider">{item.country}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
