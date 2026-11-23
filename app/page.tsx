"use client";

import React from "react";
import Link from "next/link";
import { useAppContext } from "@/context/AppContext";
import { ScenarioSwitcher } from "@/components/ScenarioSwitcher";
import { CitySearchBar } from "@/components/CitySearchBar";
import { LiveTelemetryCard } from "@/components/LiveTelemetryCard";
import { PollutantGrid } from "@/components/PollutantGrid";
import { MorningBriefingCard } from "@/components/MorningBriefingCard";
import { VulnerableAlertsBanner } from "@/components/VulnerableAlertsBanner";
import { 
  Map, 
  Users, 
  Sliders, 
  Sparkles, 
  Leaf, 
  ArrowRight, 
  Bookmark, 
  Key, 
  RefreshCw, 
  ChevronDown, 
  CheckCircle2, 
  Cpu, 
  ShieldCheck, 
  Activity
} from "lucide-react";

export default function Home() {
  const {
    isMounted,
    activeScenarioId,
    telemetry,
    context,
    keysState,
    recommendations,
    isLoading,
    householdMembers,
    setIsProfilerOpen,
    setIsKeyModalOpen,
    selectScenario,
    selectLocation,
    refreshRecommendations,
  } = useAppContext();

  // Quick navigation cards linking to dedicated pages
  const featureHubs = [
    {
      title: "Geospatial AQI Map",
      href: "/map",
      icon: Map,
      color: "from-blue-600 to-cyan-500",
      accentBg: "bg-blue-50 text-blue-700 border-blue-200",
      badge: keysState.isWaqiValid ? "Live WAQI Active" : "Interactive Leaflet",
      description: "Interactive regional sensor map with AQICN.org live heatmap overlays and CPCB ground stations.",
      stat: `${telemetry.location.city} Station: AQI ${telemetry.overallAqi}`,
    },
    {
      title: "Household Defense",
      href: "/household",
      icon: Users,
      color: "from-emerald-600 to-teal-500",
      accentBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
      badge: `${householdMembers.length} Family Members`,
      description: "Synchronized dual-level protection: household window/purifier strategy + age-specific personal schedules.",
      stat: `Active Schedules: ${householdMembers.reduce((acc, m) => acc + m.schedule.length, 0)}`,
    },
    {
      title: "Consequence Simulator",
      href: "/simulator",
      icon: Sliders,
      color: "from-amber-600 to-orange-500",
      accentBg: "bg-amber-50 text-amber-700 border-amber-200",
      badge: "Real-time PM2.5 & CO2",
      description: "Simulate consequences of daily departure times and commute modes on personal PM2.5 inhaled & carbon footprint.",
      stat: "Diurnal Inversion Model Active",
    },
    {
      title: "GenAI Copilot Chat",
      href: "/copilot",
      icon: Sparkles,
      color: "from-indigo-600 to-purple-500",
      accentBg: "bg-indigo-50 text-indigo-700 border-indigo-200",
      badge: keysState.isGeminiValid ? "Gemini 3.6+ Connected" : "Guardrail Protected",
      description: "Domain-guarded environmental health assistant powered by Gemini 3.6/3.5 Flash waterfall.",
      stat: "Strict Air Quality Redirection",
    },
    {
      title: "Indoor Shield & Transit",
      href: "/mitigation",
      icon: Leaf,
      color: "from-emerald-600 to-green-500",
      accentBg: "bg-green-50 text-green-700 border-green-200",
      badge: "NASA Phytoremediation",
      description: "Calculate optimal air-purifying plant counts for your room area and compare low-emission commute choices.",
      stat: `${recommendations.indoorMitigation?.recommendedPlants?.length || 4} NASA Species Curated`,
    },
  ];

  return (
    <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Benchmark Scenario Switcher */}
      <ScenarioSwitcher
        activeScenarioId={activeScenarioId}
        onSelectScenario={selectScenario}
        isLoading={isLoading}
      />

      {/* Location Search Bar & Quick Context Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <CitySearchBar
          currentCity={telemetry.location.city}
          onSelectLocation={selectLocation}
          isLoading={isLoading}
        />

        <div className="flex items-center space-x-2 flex-wrap">
          {/* Quick Profile Selector Button */}
          <button
            onClick={() => setIsProfilerOpen(true)}
            aria-label="Manage Personalized Profiles"
            title="Manage Personalized Profiles"
            className="inline-flex items-center justify-center px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-xs transition-colors"
          >
            <Bookmark className="w-3.5 h-3.5 mr-1.5 text-indigo-600" />
            <span className="max-w-[140px] sm:max-w-[180px] truncate">
              {context.profileName || "Personal Profile"}
            </span>
            <ChevronDown className="w-3 h-3 ml-1 text-slate-400" />
            {context.hasAsthmaOrRespiratory && (
              <span className="ml-1.5 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            )}
          </button>

          {/* API Key Modal Button */}
          <button
            onClick={() => setIsKeyModalOpen(true)}
            aria-label="API Key Settings (Gemini and WAQI)"
            title="API Key Settings (Gemini & WAQI)"
            className={`p-2.5 rounded-xl border text-xs font-bold transition-colors ${
              keysState.isGeminiValid || keysState.isWaqiValid
                ? "border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                : "border-slate-300 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900"
            }`}
          >
            <Key className="w-4 h-4 text-indigo-600" />
          </button>

          {/* Refresh AI Synthesis */}
          <button
            onClick={() => refreshRecommendations()}
            disabled={isLoading}
            aria-label="Refresh AI synthesis"
            title="Refresh AI synthesis"
            className="p-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-emerald-600" : ""}`} />
          </button>
        </div>
      </div>

      {/* Feature Unlocked Banner */}
      {isMounted && (keysState.isGeminiValid || keysState.isWaqiValid) && (
        <div className="bg-gradient-to-r from-emerald-50 to-indigo-50 border border-emerald-200 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span className="text-slate-700 font-medium">
              Live Features Activated:{" "}
              {keysState.isGeminiValid && (
                <strong className="text-indigo-800 mr-2" title="Waterfall sequence: gemini-3.6-flash → gemini-3.5-flash → gemini-3.5-flash-lite → gemini-3.1-flash-lite → gemini-2.5-flash">
                  ✓ Gemini Waterfall Active (3.6 → 3.5 → Lite → 2.5)
                </strong>
              )}
              {keysState.isWaqiValid && (
                <strong className="text-emerald-800">✓ AQICN Map Heatmap Tiles & Sensors</strong>
              )}
            </span>
          </div>
          <button
            onClick={() => setIsKeyModalOpen(true)}
            className="text-[11px] font-bold text-indigo-700 hover:underline"
          >
            Manage Keys
          </button>
        </div>
      )}

      {/* Real-Time Telemetry & Pollutant Profile */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-12">
          <LiveTelemetryCard 
            telemetry={telemetry} 
            isLoading={isLoading} 
            isWaqiActive={keysState.isWaqiValid}
          />
        </div>
        <div className="lg:col-span-12">
          <PollutantGrid telemetry={telemetry} />
        </div>
      </div>

      {/* Executive Multi-Page Feature Hubs */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center">
              <Activity className="w-5 h-5 mr-2 text-indigo-600" />
              Smog Defense Command Modules
            </h2>
            <p className="text-xs text-slate-500">
              Access dedicated multi-page intelligence hubs for geospatial mapping, household schedules, and simulation
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {featureHubs.map((hub) => {
            const Icon = hub.icon;
            return (
              <Link
                key={hub.href}
                href={hub.href}
                className="group relative bg-white rounded-3xl p-5 border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2.5 rounded-2xl bg-gradient-to-br ${hub.color} text-white shadow-sm group-hover:scale-105 transition-transform`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${hub.accentBg}`}>
                      {hub.badge}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 text-base mb-1 transition-colors flex items-center justify-between">
                    <span>{hub.title}</span>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed mb-4">
                    {hub.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                  <span className="truncate">{hub.stat}</span>
                  <span className="text-indigo-600 font-bold group-hover:underline">Open &rarr;</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Proactive Morning Briefing (Up-Ahead Plan) */}
      <MorningBriefingCard
        briefing={recommendations.morningBriefing}
        cityName={telemetry.location.city}
      />

      {/* Vulnerable Alerts Banner */}
      <VulnerableAlertsBanner alerts={recommendations.vulnerableAlerts} />

      {/* Engine Metadata Badge */}
      <div className="bg-slate-100 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2 border border-slate-200">
        <div className="flex items-center space-x-2">
          <Cpu className="w-4 h-4 text-emerald-600" />
          <span>
            Active Recommendation Engine:{" "}
            <strong className="text-slate-800">
              {recommendations.meta?.engine === "gemini-genai" 
                ? "Google Gemini Multi-Model Waterfall (3.6 Flash → 3.5 Flash → 3.5 Flash-Lite → 3.1 Flash-Lite → 2.5 Flash)" 
                : "Deterministic Heuristic Engine (100% Offline-Resilient)"}
            </strong>
          </span>
        </div>
        <div className="flex items-center space-x-1.5 text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Telemetry validated against CPCB & Copernicus CAMS Standards</span>
        </div>
      </div>
    </main>
  );
}
