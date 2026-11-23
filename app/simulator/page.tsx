"use client";

import React from "react";
import { useAppContext } from "@/context/AppContext";
import { DecisionSimulator } from "@/components/DecisionSimulator";
import { Sliders, Activity, Wind, Flame } from "lucide-react";

export default function SimulatorPage() {
  const {
    telemetry,
    householdMembers,
    updateMemberScheduleFromSimulator,
    keysState,
  } = useAppContext();

  return (
    <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-to-br from-amber-600 to-orange-500 rounded-2xl text-white shadow-sm">
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Daily Decision & Climate Consequence Simulator
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                Interactive Physics Model
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Visualize how departure timing and transit mode impact pulmonary PM2.5 inhalation & CO2 emissions
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 text-xs bg-slate-50 px-4 py-2.5 rounded-2xl border border-slate-200">
          <div>
            <span className="text-slate-400 block text-[10px]">Ambient AQI</span>
            <strong className="text-slate-900 font-bold">{telemetry.overallAqi} ({telemetry.cpcbCategory})</strong>
          </div>
          <div className="h-6 w-px bg-slate-200" />
          <div>
            <span className="text-slate-400 block text-[10px]">PM2.5 Concentration</span>
            <strong className="text-indigo-600 font-bold">{telemetry.pollutants.pm25.value} µg/m³</strong>
          </div>
        </div>
      </div>

      {/* Task 3: Interactive Decision & Climate Consequence Simulator */}
      <DecisionSimulator
        currentAqi={telemetry.overallAqi}
        ambientPm25={telemetry.pollutants.pm25.value}
        householdMembers={householdMembers}
        onUpdateMemberSchedule={updateMemberScheduleFromSimulator}
        geminiKey={keysState.geminiKey}
        isGeminiValid={keysState.isGeminiValid}
      />

      {/* Scientific Explanations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 space-y-2">
          <div className="flex items-center space-x-2 text-indigo-700 font-bold text-xs">
            <Wind className="w-4 h-4" />
            <span>Diurnal Thermal Inversion Factor</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            During winter nights, radiational cooling traps dense, cold air beneath warm layers. The inversion factor peaks between 05:00 AM – 08:30 AM (up to 1.7x), trapping vehicular exhaust near ground level before midday solar heating disperses it.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 space-y-2">
          <div className="flex items-center space-x-2 text-rose-700 font-bold text-xs">
            <Activity className="w-4 h-4" />
            <span>Minute Ventilation Inhaled Particulates</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            High-intensity exercise expands respiratory minute ventilation from ~7 L/min at rest to &gt;45 L/min. Coupled with high PM2.5, this deposits thousands of micro-particles directly into deep pulmonary alveoli.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 space-y-2">
          <div className="flex items-center space-x-2 text-emerald-700 font-bold text-xs">
            <Flame className="w-4 h-4" />
            <span>Decarbonization Tradeoffs</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Switching a single 15 km commute from a solo petrol car (192 g CO2/km) to an electric underground metro (18 g CO2/km) prevents 2.6 kg of CO2 and cuts personal aerosol inhalation by over 70%.
          </p>
        </div>
      </div>
    </main>
  );
}
