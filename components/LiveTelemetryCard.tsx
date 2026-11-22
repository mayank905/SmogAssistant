"use client";

import React, { useState, useEffect } from "react";
import { AirQualityTelemetry } from "@/types/aqi";
import { getCategoryMetadata } from "@/lib/aqi-calculator";
import { AlertCircle, Clock, MapPin, Radio, Activity, CheckCircle2 } from "lucide-react";

interface LiveTelemetryCardProps {
  telemetry: AirQualityTelemetry;
  isLoading?: boolean;
  isWaqiActive?: boolean;
}

export const LiveTelemetryCard: React.FC<LiveTelemetryCardProps> = ({
  telemetry,
  isLoading,
  isWaqiActive = false,
}) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const meta = getCategoryMetadata(telemetry.cpcbCategory);

  const formattedTime = isMounted
    ? new Date(telemetry.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "Live Feed";

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 overflow-hidden relative">
      {isLoading && (
        <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-10">
          <div className="flex items-center space-x-2 text-sm font-medium text-slate-700">
            <Activity className="w-5 h-5 animate-spin text-emerald-600" />
            <span>Updating real-time telemetry...</span>
          </div>
        </div>
      )}

      {/* Top Meta Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4 mb-5">
        <div className="flex items-center space-x-2">
          <MapPin className="w-4 h-4 text-emerald-600" />
          <h2 className="text-base font-bold text-slate-900">
            {telemetry.location.city}
          </h2>
          {telemetry.location.stationName && (
            <span className="text-xs text-slate-500 hidden sm:inline">
              • {telemetry.location.stationName}
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2 flex-wrap">
          {isWaqiActive ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
              WAQI Ground Station Active
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700">
              <Radio className="w-3 h-3 mr-1 text-emerald-500 animate-pulse" />
              {telemetry.isSimulated ? "Scenario Mode" : "Open-Meteo & CPCB Model"}
            </span>
          )}
          <span 
            className="text-xs text-slate-400 flex items-center font-mono"
            suppressHydrationWarning
          >
            <Clock className="w-3 h-3 mr-1" />
            {formattedTime}
          </span>
        </div>
      </div>

      {/* Main Metric Spotlight */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        <div className="md:col-span-5 flex flex-col items-center sm:items-start">
          <div className="flex items-baseline space-x-3">
            <span className="text-6xl sm:text-7xl font-extrabold tracking-tighter text-slate-900">
              {telemetry.overallAqi}
            </span>
            <div className="flex flex-col">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                CPCB AQI
              </span>
              <span className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wide ${meta.badgeBg} ${meta.badgeText} shadow-sm mt-1`}>
                {meta.label}
              </span>
            </div>
          </div>

          <div className="mt-3 flex items-center space-x-2 text-xs text-slate-600">
            <span className="font-semibold">Dominant Hazard:</span>
            <span className="px-2 py-0.5 bg-slate-100 font-mono font-bold rounded text-slate-800">
              {telemetry.primaryPollutant}
            </span>
            <span>(Scale: {meta.cpcbRange})</span>
          </div>
        </div>

        {/* Health Impact & Context */}
        <div className="md:col-span-7 bg-slate-50 rounded-xl p-4 border border-slate-100">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Health Impact Synopsis
              </h4>
              <p className="text-sm text-slate-700 leading-relaxed">
                {meta.healthImpact}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Hourly Trend Bar */}
      {telemetry.hourlyForecast && telemetry.hourlyForecast.length > 0 && (
        <div className="mt-6 pt-5 border-t border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Hourly Smog Trajectory (Next 12 Hours)
            </span>
            <span className="text-[11px] text-slate-400">
              Values indicate predicted AQI
            </span>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-12 gap-1.5">
            {telemetry.hourlyForecast.map((hour, idx) => {
              const category = hour.aqi > 400 ? "bg-red-900" : hour.aqi > 300 ? "bg-rose-600" : hour.aqi > 200 ? "bg-orange-500" : hour.aqi > 100 ? "bg-amber-500" : "bg-emerald-500";
              return (
                <div key={idx} className="flex flex-col items-center bg-slate-50 p-1.5 rounded-lg border border-slate-100 text-center">
                  <span className="text-[10px] text-slate-500 font-mono">{hour.time}</span>
                  <div className={`w-full h-1.5 rounded-full my-1 ${category}`} />
                  <span className="text-xs font-bold text-slate-800">{hour.aqi}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
