"use client";

import React, { useEffect, useRef, useState } from "react";
import { AirQualityTelemetry } from "@/types/aqi";
import { getCategoryMetadata } from "@/lib/aqi-calculator";
import { Map as MapIcon, Layers, Key, ShieldCheck, ExternalLink, RefreshCw } from "lucide-react";

interface AqiMapViewProps {
  telemetry: AirQualityTelemetry;
  waqiToken: string;
  isWaqiActive: boolean;
  onOpenKeyModal: () => void;
}

type AqicnLayer = "usepa-aqi" | "usepa-pm25" | "usepa-pm10" | "usepa-no2" | "usepa-o3";

const LAYERS: { id: AqicnLayer; label: string; desc: string }[] = [
  { id: "usepa-aqi", label: "Overall AQI", desc: "Composite air quality index markers" },
  { id: "usepa-pm25", label: "PM2.5 Heatmap", desc: "Fine particulate matter" },
  { id: "usepa-pm10", label: "PM10 Dust", desc: "Coarse particulate matter" },
  { id: "usepa-no2", label: "NO2 Layer", desc: "Nitrogen dioxide vehicular exhaust" },
  { id: "usepa-o3", label: "O3 Ozone", desc: "Surface photochemical smog" },
];

export const AqiMapView: React.FC<AqiMapViewProps> = ({
  telemetry,
  waqiToken,
  isWaqiActive,
  onOpenKeyModal,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const aqicnTileLayerRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  const [activeLayer, setActiveLayer] = useState<AqicnLayer>("usepa-aqi");
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const { latitude, longitude, city, stationName } = telemetry.location;
  const meta = getCategoryMetadata(telemetry.cpcbCategory);

  // Initialize and update Leaflet Map on client
  useEffect(() => {
    if (!isClient || !mapContainerRef.current) return;

    let isCancelled = false;

    // Dynamically import Leaflet to avoid SSR window issues
    import("leaflet").then((L) => {
      if (isCancelled || !mapContainerRef.current) return;

      // Fix default Leaflet icon paths
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      // If map is not initialized yet, create it
      if (!mapInstanceRef.current) {
        const map = L.map(mapContainerRef.current, {
          center: [latitude, longitude],
          zoom: 11,
          zoomControl: true,
          scrollWheelZoom: false,
        });

        // Base OpenStreetMap tiles
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 18,
        }).addTo(map);

        mapInstanceRef.current = map;
      } else {
        // Pan/Fly to new coordinates when city changes
        mapInstanceRef.current.setView([latitude, longitude], 11);
      }

      const map = mapInstanceRef.current;

      // Update or create city marker & pulse circle
      if (markerRef.current) {
        markerRef.current.remove();
      }

      // Marker group
      const markerGroup = L.layerGroup().addTo(map);

      // Circle reflecting CPCB category severity
      const circleColor = meta.hex;

      L.circle([latitude, longitude], {
        color: circleColor,
        fillColor: circleColor,
        fillOpacity: 0.25,
        radius: 4000,
      }).addTo(markerGroup);

      const marker = L.marker([latitude, longitude]).addTo(markerGroup);
      marker.bindPopup(`
        <div style="font-family: inherit; padding: 4px;">
          <h4 style="font-weight: bold; margin: 0 0 4px 0; font-size: 13px;">${city}</h4>
          <div style="font-size: 11px; color: #64748b; margin-bottom: 6px;">${stationName || "Ground Monitoring Point"}</div>
          <div style="display: flex; align-items: baseline; gap: 6px;">
            <span style="font-size: 18px; font-weight: 800; color: #0f172a;">${telemetry.overallAqi}</span>
            <span style="font-size: 11px; font-weight: 700; color: ${circleColor}; text-transform: uppercase;">${telemetry.cpcbCategory}</span>
          </div>
          <div style="font-size: 10px; color: #94a3b8; margin-top: 4px;">Primary: ${telemetry.primaryPollutant}</div>
        </div>
      `);

      markerRef.current = markerGroup;

      // Handle AQICN Tile Layer
      if (aqicnTileLayerRef.current) {
        map.removeLayer(aqicnTileLayerRef.current);
        aqicnTileLayerRef.current = null;
      }

      if (isWaqiActive && waqiToken && waqiToken.trim().length > 0) {
        const tileUrl = `https://tiles.aqicn.org/tiles/${activeLayer}/{z}/{x}/{y}.png?token=${encodeURIComponent(waqiToken.trim())}`;
        const aqicnLayer = L.tileLayer(tileUrl, {
          attribution: 'Air Quality &copy; <a href="https://aqicn.org">AQICN.org</a> / WAQI',
          maxZoom: 18,
          opacity: 0.75,
        });

        aqicnLayer.addTo(map);
        aqicnTileLayerRef.current = aqicnLayer;
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [isClient, latitude, longitude, activeLayer, isWaqiActive, waqiToken, meta.hex, city, stationName, telemetry.overallAqi, telemetry.cpcbCategory, telemetry.primaryPollutant]);

  // Cleanup map instance on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      {/* Map Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/60">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
            <MapIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                AQICN / WAQI Geospatial Air Quality Map
              </h3>
              {isWaqiActive ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse" />
                  Live Tiles Active
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-800 border border-amber-200">
                  Preview Mode
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              {city} • Lat: {latitude.toFixed(2)}, Lon: {longitude.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Layer Selector or Connect Token Action */}
        <div className="flex items-center space-x-2">
          {isWaqiActive ? (
            <div className="flex items-center space-x-1.5 bg-white border border-slate-200 rounded-xl p-1 shadow-xs overflow-x-auto">
              <Layers className="w-3.5 h-3.5 text-slate-400 ml-1.5 flex-shrink-0" />
              {LAYERS.map((layer) => (
                <button
                  key={layer.id}
                  onClick={() => setActiveLayer(layer.id)}
                  title={layer.desc}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                    activeLayer === layer.id
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  {layer.label}
                </button>
              ))}
            </div>
          ) : (
            <button
              onClick={onOpenKeyModal}
              className="inline-flex items-center px-3 py-1.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold transition-colors shadow-xs"
            >
              <Key className="w-3.5 h-3.5 mr-1.5 text-amber-700" />
              Connect WAQI Token to Unlock Tiles
            </button>
          )}
        </div>
      </div>

      {/* Map Viewport */}
      <div className="relative w-full h-[360px] sm:h-[420px] bg-slate-100">
        {!isClient ? (
          <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
            <RefreshCw className="w-5 h-5 animate-spin mr-2 text-emerald-600" />
            Loading Map Viewport...
          </div>
        ) : (
          <div ref={mapContainerRef} className="w-full h-full" />
        )}

        {/* Token CTA Overlay when not active */}
        {!isWaqiActive && (
          <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 max-w-md bg-white/95 backdrop-blur-md p-3.5 rounded-2xl border border-slate-200 shadow-lg z-20">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-amber-100 text-amber-700 rounded-xl flex-shrink-0">
                <Key className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <h4 className="text-xs font-bold text-slate-900 mb-0.5">
                  Unlock Live AQICN Raster Heatmap Tiles
                </h4>
                <p className="text-[11px] text-slate-600 leading-relaxed mb-2">
                  Enter your free WAQI API Token in the Key Manager to overlay real-time satellite & CPCB ground station pollution tiles.
                </p>
                <button
                  onClick={onOpenKeyModal}
                  className="inline-flex items-center px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
                >
                  <Key className="w-3 h-3 mr-1" />
                  Enter WAQI Token
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Legend & Attribution Bar */}
      <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between text-[11px] text-slate-500 gap-2">
        <div className="flex items-center space-x-3 flex-wrap">
          <span className="font-bold text-slate-700">CPCB/WAQI Index Scale:</span>
          <div className="flex items-center space-x-1">
            <span className="inline-block w-3 h-3 rounded-sm bg-emerald-500" />
            <span>Good (0-50)</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="inline-block w-3 h-3 rounded-sm bg-amber-500" />
            <span>Satisfactory (51-100)</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="inline-block w-3 h-3 rounded-sm bg-orange-500" />
            <span>Moderate (101-200)</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="inline-block w-3 h-3 rounded-sm bg-rose-600" />
            <span>Poor (201-300)</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="inline-block w-3 h-3 rounded-sm bg-red-900" />
            <span>Severe (401+)</span>
          </div>
        </div>

        <div className="flex items-center space-x-1 text-slate-400">
          <span>Map Tiles: OpenStreetMap & aqicn.org</span>
        </div>
      </div>
    </div>
  );
};
