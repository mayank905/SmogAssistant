"use client";

import React, { useState } from "react";
import { AIRecommendationResponse } from "@/types/recommendations";
import { calculatePlantRequirements } from "@/lib/indoor-plants";
import { Flower2, Wrench, Wind, ShieldAlert, Sparkles, CheckCircle2, ChevronRight } from "lucide-react";

interface IndoorMitigationGuideProps {
  indoorMitigation: AIRecommendationResponse["indoorMitigation"];
  initialRoomSqFt: number;
}

export const IndoorMitigationGuide: React.FC<IndoorMitigationGuideProps> = ({
  indoorMitigation,
  initialRoomSqFt,
}) => {
  const [roomSqFt, setRoomSqFt] = useState(initialRoomSqFt);
  const dynamicPlants = calculatePlantRequirements(roomSqFt);

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-8">
      {/* Section Header */}
      <div className="border-b border-slate-100 pb-5">
        <div className="flex items-center space-x-2 mb-1">
          <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
            <Flower2 className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-700">
            Indoor Air Defense
          </span>
        </div>
        <h3 className="text-xl font-black text-slate-900 tracking-tight">
          Phytoremediation & Low-Cost Air Purifying Hacks
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          NASA Clean Air study calculations combined with proven DIY indoor air cleaning strategies
        </p>
      </div>

      {/* Purifier & Ventilation Strategy Box */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-emerald-50/60 rounded-2xl p-4 border border-emerald-100">
          <div className="flex items-center space-x-2 text-emerald-800 font-bold text-xs uppercase tracking-wider mb-2">
            <Wind className="w-4 h-4 text-emerald-600" />
            <span>Ventilation Guidance</span>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed font-medium">
            {indoorMitigation.ventilationAdvice}
          </p>
        </div>

        <div className="bg-indigo-50/60 rounded-2xl p-4 border border-indigo-100">
          <div className="flex items-center space-x-2 text-indigo-800 font-bold text-xs uppercase tracking-wider mb-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>Air Purifier Operation Protocol</span>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed font-medium">
            {indoorMitigation.purifierStrategy}
          </p>
        </div>
      </div>

      {/* NASA Plants Module with Interactive Room Resizer */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <span>NASA-Backed Air-Purifying Plants</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                Bio-Filtering
              </span>
            </h4>
            <p className="text-xs text-slate-500">
              Optimal plant quantities calculated for your specific room area
            </p>
          </div>

          <div className="flex items-center space-x-3 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200">
            <span className="text-xs text-slate-600 font-medium">Room Size:</span>
            <span className="text-xs font-bold text-emerald-700">{roomSqFt} sq ft</span>
            <input
              type="range"
              min={100}
              max={600}
              step={50}
              value={roomSqFt}
              onChange={(e) => setRoomSqFt(Number(e.target.value))}
              className="w-24 accent-emerald-600"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {dynamicPlants.map((plant, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-emerald-300 hover:shadow-xs transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-900 line-clamp-1">
                    {plant.name}
                  </span>
                  <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    {plant.countNeeded} pots
                  </span>
                </div>
                <span className="text-[10px] italic text-slate-400 block mb-2 font-serif">
                  {plant.botanicalName}
                </span>

                <div className="space-y-1 mb-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                    Targeted VOCs:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {plant.targetedPollutants.map((t, tIdx) => (
                      <span
                        key={tIdx}
                        className="text-[9px] font-semibold bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-600"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/60 mt-2 text-[10px] text-slate-500">
                <span className="font-semibold text-slate-700">Placement: </span>
                {plant.placementTip}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Low-Cost DIY Filtration Hacks */}
      <div>
        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 mb-3">
          <Wrench className="w-4 h-4 text-amber-600" />
          <span>Frugal & DIY Smog Mitigation Hacks</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {indoorMitigation.diyLowCostHacks.map((hack, hIdx) => {
            const [title, desc] = hack.includes(":") ? hack.split(":") : ["Actionable Hack", hack];
            return (
              <div
                key={hIdx}
                className="p-3.5 rounded-2xl border border-slate-200 bg-amber-50/30 flex items-start space-x-3"
              >
                <div className="p-1.5 rounded-lg bg-amber-100 text-amber-800 flex-shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-slate-900 mb-0.5">
                    {title.trim()}
                  </h5>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {desc?.trim()}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
