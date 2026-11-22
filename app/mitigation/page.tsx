"use client";

import React from "react";
import { useAppContext } from "@/context/AppContext";
import { IndoorMitigationGuide } from "@/components/IndoorMitigationGuide";
import { SustainableTransitComparator } from "@/components/SustainableTransitComparator";
import { Leaf, Trees, Wind, Sparkles, ShieldCheck } from "lucide-react";

export default function MitigationPage() {
  const {
    context,
    recommendations,
  } = useAppContext();

  return (
    <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-to-br from-emerald-600 to-green-500 rounded-2xl text-white shadow-sm">
            <Leaf className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Indoor Air Shield & Low-Emission Transit
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                NASA Phytoremediation & Decarbonization
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Science-backed indoor botanical defense, HEPA CADR runtime protocols, and sustainable commute offsets
            </p>
          </div>
        </div>

        <div className="text-xs text-slate-500 bg-slate-50 px-4 py-2.5 rounded-2xl border border-slate-200">
          <span>Active Room Profile: </span>
          <strong className="text-slate-900 font-bold">{context.roomAreaSqFt || 250} sq ft</strong>
          <span className="text-slate-400 ml-1">({context.hasAirPurifier ? "Purifier Present" : "No Purifier"})</span>
        </div>
      </div>

      {/* Indoor Phytoremediation & NASA Plants Guide */}
      <IndoorMitigationGuide
        indoorMitigation={recommendations.indoorMitigation}
        initialRoomSqFt={context.roomAreaSqFt}
      />

      {/* Sustainable Commute & Offset Justifier */}
      <SustainableTransitComparator commute={recommendations.sustainableCommute} />
    </main>
  );
}
