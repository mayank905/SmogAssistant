"use client";

import React, { useState } from "react";
import { UserContextProfile, CommuteMode, WorkoutTime } from "@/types/context";
import { UserCheck, Users, Activity, Home, Car, X, CheckCircle2, Sparkles } from "lucide-react";

interface ContextProfilerProps {
  currentContext: UserContextProfile;
  isOpen: boolean;
  onClose: () => void;
  onSaveContext: (updated: UserContextProfile) => void;
}

export const ContextProfiler: React.FC<ContextProfilerProps> = ({
  currentContext,
  isOpen,
  onClose,
  onSaveContext,
}) => {
  const [context, setContext] = useState<UserContextProfile>(currentContext);

  if (!isOpen) return null;

  const handleApplyPreset = (presetName: string) => {
    if (presetName === "vulnerable-family") {
      setContext({
        ...context,
        hasChildren: true,
        hasElderly: true,
        hasAsthmaOrRespiratory: true,
        hasHeartCondition: false,
        primaryCommuteMode: "two-wheeler",
        commuteDurationMinutes: 40,
        workoutPreference: "early-morning",
        workoutType: "outdoor",
        hasAirPurifier: false,
        roomAreaSqFt: 250,
      });
    } else if (presetName === "urban-professional") {
      setContext({
        ...context,
        hasChildren: false,
        hasElderly: false,
        hasAsthmaOrRespiratory: false,
        hasHeartCondition: false,
        primaryCommuteMode: "car-petrol",
        commuteDurationMinutes: 45,
        workoutPreference: "evening",
        workoutType: "indoor",
        hasAirPurifier: true,
        roomAreaSqFt: 350,
      });
    } else if (presetName === "active-cyclist") {
      setContext({
        ...context,
        hasChildren: false,
        hasElderly: false,
        hasAsthmaOrRespiratory: false,
        hasHeartCondition: false,
        primaryCommuteMode: "bicycle",
        commuteDurationMinutes: 30,
        workoutPreference: "early-morning",
        workoutType: "outdoor",
        hasAirPurifier: false,
        roomAreaSqFt: 200,
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveContext(context);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
        <div className="sticky top-0 bg-white/95 backdrop-blur px-6 py-4 border-b border-slate-100 flex items-center justify-between z-10">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">
                Personalized Household Profile
              </h3>
              <p className="text-xs text-slate-500">
                Tailor GenAI advice to your family's exact health and commuting reality
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Quick Presets for Demo */}
          <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              Quick Demo Personas
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleApplyPreset("vulnerable-family")}
                className="text-left text-xs p-2 rounded-xl bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-xs transition-all"
              >
                <span className="font-bold block text-slate-800">Vulnerable Family</span>
                <span className="text-[11px] text-slate-500">Asthmatic child + Senior</span>
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset("urban-professional")}
                className="text-left text-xs p-2 rounded-xl bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-xs transition-all"
              >
                <span className="font-bold block text-slate-800">Solo Car Commuter</span>
                <span className="text-[11px] text-slate-500">Petrol car, evening gym</span>
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset("active-cyclist")}
                className="text-left text-xs p-2 rounded-xl bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-xs transition-all"
              >
                <span className="font-bold block text-slate-800">Active Cyclist</span>
                <span className="text-[11px] text-slate-500">Bicycle, early cardio</span>
              </button>
            </div>
          </div>

          {/* Section 1: Health & Household */}
          <div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-emerald-600" />
              Household Health & Vulnerabilities
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <label className="flex items-center space-x-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={context.hasAsthmaOrRespiratory}
                  onChange={(e) => setContext({ ...context, hasAsthmaOrRespiratory: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span className="text-xs font-semibold text-slate-800">Asthma or Bronchitis in Family</span>
              </label>

              <label className="flex items-center space-x-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={context.hasChildren}
                  onChange={(e) => setContext({ ...context, hasChildren: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span className="text-xs font-semibold text-slate-800">Children under 12 years</span>
              </label>

              <label className="flex items-center space-x-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={context.hasElderly}
                  onChange={(e) => setContext({ ...context, hasElderly: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span className="text-xs font-semibold text-slate-800">Elderly Members (65+ yrs)</span>
              </label>

              <label className="flex items-center space-x-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={context.hasHeartCondition}
                  onChange={(e) => setContext({ ...context, hasHeartCondition: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span className="text-xs font-semibold text-slate-800">Cardiovascular Condition</span>
              </label>
            </div>
          </div>

          {/* Section 2: Commute & Daily Movement */}
          <div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
              <Car className="w-4 h-4 text-emerald-600" />
              Daily Commute Mode
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
              {(
                [
                  ["two-wheeler", "Two-Wheeler"],
                  ["car-petrol", "Petrol Car"],
                  ["car-ev", "Electric Car"],
                  ["metro", "Metro Rail"],
                  ["bus", "City Bus"],
                  ["bicycle", "Bicycle"],
                  ["walking", "Walking"],
                ] as [CommuteMode, string][]
              ).map(([mode, label]) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setContext({ ...context, primaryCommuteMode: mode })}
                  className={`p-2.5 rounded-xl text-xs font-medium border text-center transition-all ${
                    context.primaryCommuteMode === mode
                      ? "bg-emerald-50 border-emerald-500 text-emerald-900 font-bold ring-1 ring-emerald-500"
                      : "border-slate-200 hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
              <span>One-way commute duration:</span>
              <span className="font-bold text-slate-900">{context.commuteDurationMinutes} minutes</span>
            </div>
            <input
              type="range"
              min={10}
              max={90}
              step={5}
              value={context.commuteDurationMinutes}
              onChange={(e) => setContext({ ...context, commuteDurationMinutes: Number(e.target.value) })}
              className="w-full accent-emerald-600"
            />
          </div>

          {/* Section 3: Workout & Living Environment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-emerald-600" />
                Exercise Routine
              </h4>
              <select
                value={context.workoutPreference}
                onChange={(e) => setContext({ ...context, workoutPreference: e.target.value as WorkoutTime })}
                className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-xl text-slate-800 focus:ring-2 focus:ring-emerald-500"
              >
                <option value="early-morning">Early Morning (05:00 - 08:00)</option>
                <option value="morning">Morning (08:00 - 11:00)</option>
                <option value="afternoon">Afternoon (12:00 - 16:00)</option>
                <option value="evening">Evening (17:00 - 20:00)</option>
                <option value="none">No outdoor workouts</option>
              </select>
            </div>

            <div>
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-2">
                <Home className="w-4 h-4 text-emerald-600" />
                Living Space Area
              </h4>
              <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                <span>Room / Apartment Area:</span>
                <span className="font-bold text-slate-900">{context.roomAreaSqFt} sq ft</span>
              </div>
              <input
                type="range"
                min={100}
                max={800}
                step={50}
                value={context.roomAreaSqFt}
                onChange={(e) => setContext({ ...context, roomAreaSqFt: Number(e.target.value) })}
                className="w-full accent-emerald-600"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all"
            >
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              Save & Recalculate AI Advice
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
