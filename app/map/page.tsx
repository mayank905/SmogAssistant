"use client";

import React from "react";
import dynamic from "next/dynamic";
import { useAppContext } from "@/context/AppContext";
import { CitySearchBar } from "@/components/CitySearchBar";
import { ScenarioSwitcher } from "@/components/ScenarioSwitcher";
import { Map, MapPin, Key, Layers, Info, ShieldCheck } from "lucide-react";

const AqiMapView = dynamic(
  () => import("@/components/AqiMapView").then((mod) => mod.AqiMapView),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[360px] sm:h-[420px] rounded-2xl bg-slate-100 border border-slate-200 animate-pulse flex flex-col items-center justify-center p-6 text-slate-400">
        <Map className="w-10 h-10 mb-2 opacity-50 animate-bounce" />
        <p className="text-xs font-semibold">Loading High-Resolution Geospatial Map Engine...</p>
      </div>
    ),
  }
);

export default function MapPage() {
  const {
    telemetry,
    keysState,
    isLoading,
    activeScenarioId,
    selectScenario,
    selectLocation,
    setIsKeyModalOpen,
  } = useAppContext();

  return (
    <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-2xl text-white shadow-sm">
            <Map className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Geospatial Air Quality & Sensor Map
              </h1>
              {keysState.isWaqiValid ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  WAQI Tiles Active
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                  Interactive Leaflet
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Real-time regional pollution plumes, AQICN sensor grids, and CPCB continuous monitoring stations
            </p>
          </div>
        </div>

        {/* WAQI Token Status Action */}
        {!keysState.isWaqiValid && (
          <button
            onClick={() => setIsKeyModalOpen(true)}
            className="inline-flex items-center px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors shadow-xs"
          >
            <Key className="w-3.5 h-3.5 mr-1.5" />
            Authenticate WAQI Token for Live Tiles
          </button>
        )}
      </div>

      {/* Scenario Switcher & Search Bar */}
      <div className="space-y-3">
        <ScenarioSwitcher
          activeScenarioId={activeScenarioId}
          onSelectScenario={selectScenario}
          isLoading={isLoading}
        />

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <CitySearchBar
            currentCity={telemetry.location.city}
            onSelectLocation={selectLocation}
            isLoading={isLoading}
          />

          <div className="flex items-center space-x-2 text-xs text-slate-500 bg-white px-3.5 py-2 rounded-xl border border-slate-200">
            <MapPin className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
            <span>
              Target: <strong className="text-slate-900">{telemetry.location.city}</strong> ({telemetry.location.latitude.toFixed(3)}°N, {telemetry.location.longitude.toFixed(3)}°E)
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Map View */}
      <div className="w-full">
        <AqiMapView
          telemetry={telemetry}
          waqiToken={keysState.waqiToken}
          isWaqiActive={keysState.isWaqiValid}
          onOpenKeyModal={() => setIsKeyModalOpen(true)}
        />
      </div>

      {/* Map Information & Legend Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 space-y-2">
          <div className="flex items-center space-x-2 text-indigo-700 font-bold text-xs">
            <Layers className="w-4 h-4" />
            <span>Heatmap Overlay Layer</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            When WAQI API is authenticated, real-time pollution tiles from the World Air Quality Index project project ground-level PM2.5 concentrations over regional terrain.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 space-y-2">
          <div className="flex items-center space-x-2 text-emerald-700 font-bold text-xs">
            <ShieldCheck className="w-4 h-4" />
            <span>CPCB Sensor Calibration</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Station markers reflect India Central Pollution Control Board standard breakpoint formulas with continuous micro-particle gravimetric analysis.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 space-y-2">
          <div className="flex items-center space-x-2 text-amber-700 font-bold text-xs">
            <Info className="w-4 h-4" />
            <span>Thermal Inversion & Plumes</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Winter air stagnation traps aerosols beneath low-level nocturnal boundaries, driving elevated localized readings around vehicular choke points.
          </p>
        </div>
      </div>
    </main>
  );
}
