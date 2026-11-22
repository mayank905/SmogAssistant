"use client";

import React from "react";
import { AIRecommendationResponse } from "@/types/recommendations";
import { Car, Train, ArrowRight, Leaf, Shield, CheckCircle } from "lucide-react";

interface SustainableTransitComparatorProps {
  commute: AIRecommendationResponse["sustainableCommute"];
}

export const SustainableTransitComparator: React.FC<SustainableTransitComparatorProps> = ({
  commute,
}) => {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
      {/* Header */}
      <div className="border-b border-slate-100 pb-5">
        <div className="flex items-center space-x-2 mb-1">
          <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
            <Leaf className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-700">
            Clean Commute Impact
          </span>
        </div>
        <h3 className="text-xl font-black text-slate-900 tracking-tight">
          Sustainable Transit & Exposure Avoidance Justifier
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Quantified emission offsets and personal respiratory particulate reduction metrics
        </p>
      </div>

      {/* Transit Transition Banner */}
      <div className="grid grid-cols-1 md:grid-cols-11 gap-4 items-center">
        {/* Current Mode */}
        <div className="md:col-span-5 bg-slate-50 rounded-2xl p-4 border border-slate-200">
          <div className="flex items-center space-x-2 text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">
            <Car className="w-4 h-4 text-slate-400" />
            <span>Current Commute Mode</span>
          </div>
          <span className="text-base font-extrabold text-slate-900 block">
            {commute.currentMode}
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            High direct particulate exposure in roadside stagnation
          </span>
        </div>

        {/* Transition Arrow */}
        <div className="md:col-span-1 flex justify-center">
          <div className="p-2 rounded-full bg-emerald-100 text-emerald-800 shadow-xs">
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>

        {/* Recommended Mode */}
        <div className="md:col-span-5 bg-emerald-50/70 rounded-2xl p-4 border border-emerald-200">
          <div className="flex items-center space-x-2 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-1">
            <Train className="w-4 h-4 text-emerald-600" />
            <span>Recommended Sustainable Transit</span>
          </div>
          <span className="text-base font-extrabold text-emerald-950 block">
            {commute.suggestedMode}
          </span>
          <span className="text-[11px] text-emerald-700 font-medium mt-0.5 block">
            Clean, climate-controlled, low particulate exposure
          </span>
        </div>
      </div>

      {/* Impact Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white shadow-md shadow-emerald-500/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase tracking-wider font-bold text-emerald-100">
              Personal Exposure Offset
            </span>
            <Shield className="w-5 h-5 text-emerald-200" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-4xl font-black tracking-tight">
              -{commute.pm25InhalationSavedPct}%
            </span>
            <span className="text-xs text-emerald-100 font-medium">
              PM2.5 Inhalation Saved
            </span>
          </div>
          <p className="text-[11px] text-emerald-100/90 mt-2">
            Massive reduction in alveolar particle deposition compared to street-level transit.
          </p>
        </div>

        <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-2xl p-5 text-white shadow-md shadow-slate-900/20 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase tracking-wider font-bold text-indigo-300">
              Urban Carbon Abatement
            </span>
            <Leaf className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-4xl font-black tracking-tight text-emerald-400">
              {commute.estimatedCo2SavedKg} kg
            </span>
            <span className="text-xs text-slate-300 font-medium">
              CO₂ Abated per One-Way Trip
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Multiplies to ~{Math.round(commute.estimatedCo2SavedKg * 2 * 22 * 10) / 10} kg of greenhouse gas prevented each month!
          </p>
        </div>
      </div>

      {/* Clear Justification Box */}
      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1 flex items-center gap-1.5">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          Scientific & Practical Justification
        </h4>
        <p className="text-xs text-slate-700 leading-relaxed font-medium">
          {commute.impactJustification || commute.actionableAdvice}
        </p>
      </div>
    </div>
  );
};
