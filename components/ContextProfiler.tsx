"use client";

import React, { useState, useEffect } from "react";
import { UserContextProfile, CommuteMode, WorkoutTime, SavedProfile } from "@/types/context";
import { 
  UserCheck, 
  Users, 
  Activity, 
  Home, 
  Car, 
  X, 
  CheckCircle2, 
  Sparkles, 
  Bookmark, 
  Trash2, 
  Plus, 
  FolderHeart 
} from "lucide-react";

interface ContextProfilerProps {
  currentContext: UserContextProfile;
  isOpen: boolean;
  onClose: () => void;
  onSaveContext: (updated: UserContextProfile) => void;
  savedProfiles: SavedProfile[];
  onSaveNewProfile: (name: string, context: UserContextProfile) => void;
  onSelectSavedProfile: (profile: SavedProfile) => void;
  onDeleteProfile: (id: string) => void;
}

export const ContextProfiler: React.FC<ContextProfilerProps> = ({
  currentContext,
  isOpen,
  onClose,
  onSaveContext,
  savedProfiles,
  onSaveNewProfile,
  onSelectSavedProfile,
  onDeleteProfile,
}) => {
  const [context, setContext] = useState<UserContextProfile>(currentContext);
  const [newProfileName, setNewProfileName] = useState("");
  const [activeTab, setActiveTab] = useState<"edit" | "saved">("edit");
  const [saveSuccessMsg, setSaveSuccessMsg] = useState("");

  useEffect(() => {
    setContext(currentContext);
    setNewProfileName(currentContext.profileName || "My Profile");
  }, [currentContext, isOpen]);

  if (!isOpen) return null;

  const handleApplyPreset = (presetName: string) => {
    if (presetName === "vulnerable-family") {
      setContext({
        ...context,
        profileName: "Home (Vulnerable Family)",
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
      setNewProfileName("Home (Vulnerable Family)");
    } else if (presetName === "urban-professional") {
      setContext({
        ...context,
        profileName: "Office Commuter (Car)",
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
      setNewProfileName("Office Commuter (Car)");
    } else if (presetName === "active-cyclist") {
      setContext({
        ...context,
        profileName: "Active Cyclist Routine",
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
      setNewProfileName("Active Cyclist Routine");
    }
  };

  const handleSaveAsNew = () => {
    const name = newProfileName.trim() || `Profile ${savedProfiles.length + 1}`;
    const updated = { ...context, profileName: name };
    onSaveNewProfile(name, updated);
    setSaveSuccessMsg(`Profile "${name}" saved!`);
    setTimeout(() => setSaveSuccessMsg(""), 3000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = {
      ...context,
      profileName: newProfileName.trim() || context.profileName || "Personalized Profile",
    };
    onSaveContext(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur px-6 py-4 border-b border-slate-100 flex items-center justify-between z-10">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">
                Personalized Household Profiles
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

        {/* Tab Switcher */}
        <div className="px-6 pt-4 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={() => setActiveTab("edit")}
              className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-colors ${
                activeTab === "edit"
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              Configure Profile
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("saved")}
              className={`pb-2.5 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors ${
                activeTab === "saved"
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <FolderHeart className="w-3.5 h-3.5" />
              Saved Profiles ({savedProfiles.length})
            </button>
          </div>

          {saveSuccessMsg && (
            <span className="text-xs text-emerald-600 font-bold flex items-center pb-2 animate-pulse">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
              {saveSuccessMsg}
            </span>
          )}
        </div>

        {activeTab === "saved" ? (
          /* Saved Profiles List */
          <div className="p-6 space-y-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-500">
                Switch instantly between saved homes, offices, or family routines:
              </span>
              <button
                onClick={() => setActiveTab("edit")}
                className="inline-flex items-center text-xs font-bold text-indigo-600 hover:underline"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Create New
              </button>
            </div>

            {savedProfiles.map((sp) => {
              const isCurrent = sp.name === context.profileName || sp.context.profileName === context.profileName;
              return (
                <div
                  key={sp.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isCurrent
                      ? "border-emerald-300 bg-emerald-50/40 shadow-xs"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <Bookmark className="w-4 h-4 text-indigo-600" />
                      <h4 className="font-bold text-slate-900 text-sm">{sp.name}</h4>
                      {isCurrent && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 flex flex-wrap gap-2">
                      <span>Commute: {sp.context.primaryCommuteMode} ({sp.context.commuteDurationMinutes}m)</span>
                      <span>• Area: {sp.context.roomAreaSqFt} sq ft</span>
                      {sp.context.hasAsthmaOrRespiratory && <span className="text-rose-600 font-medium">• Asthma</span>}
                      {sp.context.hasChildren && <span>• Children</span>}
                      {sp.context.hasElderly && <span>• Elderly</span>}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        onSelectSavedProfile(sp);
                        setContext(sp.context);
                        setNewProfileName(sp.name);
                        onClose();
                      }}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors"
                    >
                      Apply Profile
                    </button>
                    {savedProfiles.length > 1 && (
                      <button
                        type="button"
                        onClick={() => onDeleteProfile(sp.id)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete Profile"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Profile Edit Form */
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Profile Name Input */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
                <span>Personalized Profile Name</span>
                <span className="text-[11px] font-normal text-slate-500">e.g. Home, Office, Parents' House</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newProfileName}
                  onChange={(e) => setNewProfileName(e.target.value)}
                  placeholder="e.g. Anand Vihar Residence (Family)"
                  className="flex-1 px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  required
                />
                <button
                  type="button"
                  onClick={handleSaveAsNew}
                  className="px-3.5 py-2 text-xs font-bold rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 flex items-center gap-1 transition-colors whitespace-nowrap shadow-xs"
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  Save as New
                </button>
              </div>
            </div>

            {/* Quick Demo Personas */}
            <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                Quick Starter Presets
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleApplyPreset("vulnerable-family")}
                  className="text-left text-xs p-2 rounded-xl bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-xs transition-all"
                >
                  <span className="font-bold block text-slate-800">Vulnerable Family</span>
                  <span className="text-[11px] text-slate-500">Asthma child + Senior</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset("urban-professional")}
                  className="text-left text-xs p-2 rounded-xl bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-xs transition-all"
                >
                  <span className="font-bold block text-slate-800">Solo Car Commuter</span>
                  <span className="text-[11px] text-slate-500">Petrol car, gym</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset("active-cyclist")}
                  className="text-left text-xs p-2 rounded-xl bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-xs transition-all"
                >
                  <span className="font-bold block text-slate-800">Active Cyclist</span>
                  <span className="text-[11px] text-slate-500">Bicycle, morning cardio</span>
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
                  <span className="text-xs font-semibold text-slate-800">Senior Citizens (60+ yrs)</span>
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

            {/* Section 2: Commute Profile */}
            <div>
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
                <Car className="w-4 h-4 text-emerald-600" />
                Daily Commuting Mode
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(
                  [
                    { id: "two-wheeler", label: "Two Wheeler (Bike/Scooter)" },
                    { id: "car-petrol", label: "Personal Car" },
                    { id: "metro", label: "Delhi Metro / Transit" },
                    { id: "bus", label: "Public Bus" },
                    { id: "bicycle", label: "Bicycle" },
                    { id: "walking", label: "Walking" },
                  ] as { id: CommuteMode; label: string }[]
                ).map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setContext({ ...context, primaryCommuteMode: mode.id })}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all ${
                      context.primaryCommuteMode === mode.id
                        ? "border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20"
                        : "border-slate-200 hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between text-xs text-slate-600">
                <span>Commute Duration:</span>
                <span className="font-bold text-slate-900">{context.commuteDurationMinutes} minutes each way</span>
              </div>
              <input
                type="range"
                min={10}
                max={90}
                step={5}
                value={context.commuteDurationMinutes}
                onChange={(e) => setContext({ ...context, commuteDurationMinutes: Number(e.target.value) })}
                className="w-full accent-emerald-600 mt-1"
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
                  <span>Room Area:</span>
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
                Apply & Recalculate AI Advice
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
