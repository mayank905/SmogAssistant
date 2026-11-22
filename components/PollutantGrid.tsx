import React from "react";
import { AirQualityTelemetry } from "@/types/aqi";
import { ShieldCheck, AlertTriangle } from "lucide-react";

interface PollutantGridProps {
  telemetry: AirQualityTelemetry;
}

export const PollutantGrid: React.FC<PollutantGridProps> = ({ telemetry }) => {
  const { pollutants } = telemetry;

  const pollutantItems = [
    {
      code: "PM2.5",
      name: "Fine Particulate Matter",
      value: pollutants.pm25.value,
      unit: pollutants.pm25.unit,
      subIndex: pollutants.pm25.subIndex,
      safeLimit: "30 µg/m³ (24h standard)",
      hazard: "Penetrates deep into alveolar air sacs and bloodstream.",
      critical: pollutants.pm25.value > 60,
    },
    {
      code: "PM10",
      name: "Coarse Particulates",
      value: pollutants.pm10.value,
      unit: pollutants.pm10.unit,
      subIndex: pollutants.pm10.subIndex,
      safeLimit: "50 µg/m³ (24h standard)",
      hazard: "Irritates upper airways, eyes, and causes heavy coughing.",
      critical: pollutants.pm10.value > 100,
    },
    {
      code: "NO2",
      name: "Nitrogen Dioxide",
      value: pollutants.no2?.value ?? 0,
      unit: pollutants.no2?.unit ?? "µg/m³",
      safeLimit: "80 µg/m³",
      hazard: "Traffic exhaust byproduct inflaming lung lining.",
      critical: (pollutants.no2?.value ?? 0) > 80,
    },
    {
      code: "SO2",
      name: "Sulphur Dioxide",
      value: pollutants.so2?.value ?? 0,
      unit: pollutants.so2?.unit ?? "µg/m³",
      safeLimit: "80 µg/m³",
      hazard: "Emitted from coal and heavy industrial fuel combustion.",
      critical: (pollutants.so2?.value ?? 0) > 80,
    },
    {
      code: "O3",
      name: "Ground-Level Ozone",
      value: pollutants.o3?.value ?? 0,
      unit: pollutants.o3?.unit ?? "µg/m³",
      safeLimit: "100 µg/m³ (8h standard)",
      hazard: "Photochemical oxidant triggering acute asthma attacks.",
      critical: (pollutants.o3?.value ?? 0) > 100,
    },
    {
      code: "CO",
      name: "Carbon Monoxide",
      value: pollutants.co?.value ?? 0,
      unit: pollutants.co?.unit ?? "mg/m³",
      safeLimit: "2.0 mg/m³",
      hazard: "Incomplete combustion gas reducing oxygen carrying capacity.",
      critical: (pollutants.co?.value ?? 0) > 2.0,
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            Pollutant Chemical Profile
          </h3>
          <p className="text-xs text-slate-500">
            Real-time atmospheric constituent concentrations against CPCB thresholds
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {pollutantItems.map((p) => (
          <div
            key={p.code}
            className={`p-3.5 rounded-xl border transition-all ${
              p.critical
                ? "bg-rose-50/50 border-rose-200 text-rose-950"
                : "bg-slate-50/60 border-slate-200 text-slate-800"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-xs uppercase tracking-wide">
                {p.code}
              </span>
              {p.critical ? (
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              ) : (
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              )}
            </div>

            <div className="my-1.5">
              <div className="flex items-baseline space-x-1">
                <span className="text-xl font-extrabold tracking-tight">
                  {p.value}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {p.unit}
                </span>
              </div>
              {p.subIndex !== undefined && (
                <span className="text-[10px] font-medium text-slate-500 block">
                  Sub-Index: {p.subIndex}
                </span>
              )}
            </div>

            <p className="text-[10px] text-slate-500 line-clamp-2 mt-1">
              {p.hazard}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
