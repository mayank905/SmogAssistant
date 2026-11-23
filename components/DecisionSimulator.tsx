"use client";

import React, { useState, useMemo } from "react";
import {
  ScheduleItemSimulation,
  SimulationMetrics,
  SimulationResult,
  generateClimateAlternative,
  evaluateScheduleItem,
  estimatePm25FromAqi,
  DEFAULT_SIMULATION_SCHEDULE,
  PRESET_SCHEDULES,
  isInversionWindow,
  ActivityIntensity,
  LocationType,
} from "@/lib/decision-simulator";
import { CommuteMode } from "@/types/context";
import { HouseholdMember, DayScheduleItem } from "@/types/household";
import {
  Activity,
  Wind,
  Leaf,
  Car,
  ShieldCheck,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Trash2,
  Sparkles,
  RefreshCw,
  Sun,
  Moon,
  TrendingDown,
  Info,
  Users,
} from "lucide-react";

export interface DecisionSimulatorProps {
  currentAqi?: number;
  ambientPm25?: number;
  initialSchedule?: ScheduleItemSimulation[];
  onAdoptAlternative?: (updatedSchedule: ScheduleItemSimulation[]) => void;
  householdMembers?: HouseholdMember[];
  onUpdateMemberSchedule?: (memberId: string, updatedSchedule: DayScheduleItem[]) => void;
  geminiKey?: string;
  isGeminiValid?: boolean;
  className?: string;
}

export const DecisionSimulator: React.FC<DecisionSimulatorProps> = ({
  currentAqi = 280,
  ambientPm25,
  initialSchedule,
  onAdoptAlternative,
  householdMembers = [],
  onUpdateMemberSchedule,
  geminiKey,
  isGeminiValid,
  className = "",
}) => {
  const [schedule, setSchedule] = useState<ScheduleItemSimulation[]>(
    initialSchedule && initialSchedule.length > 0 ? initialSchedule : DEFAULT_SIMULATION_SCHEDULE
  );
  const [selectedPreset, setSelectedPreset] = useState<string>("urbanCommuter");
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [isAdopted, setIsAdopted] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"side-by-side" | "tweaker">("side-by-side");

  // Simulation On-Demand State
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulationEngine, setSimulationEngine] = useState<string | null>(null);

  // Converter from DayScheduleItem to ScheduleItemSimulation
  const convertMemberScheduleToSim = (member: HouseholdMember): ScheduleItemSimulation[] => {
    return member.schedule.map((item, idx) => {
      const match = item.time.match(/(\d{1,2}):(\d{2})(?:\s*(AM|PM))?/i);
      let startTime = "08:00";
      if (match) {
        let hours = parseInt(match[1], 10);
        const mins = match[2];
        const ampm = match[3]?.toUpperCase();
        if (ampm === "PM" && hours < 12) hours += 12;
        if (ampm === "AM" && hours === 12) hours = 0;
        startTime = `${hours.toString().padStart(2, "0")}:${mins}`;
      }

      let locationType: LocationType = item.isOutdoor ? "outdoor" : "indoor";
      if (["bus", "metro", "car-petrol", "car-ev", "two-wheeler"].includes(item.commuteMode)) {
        locationType = "transit";
      }

      let intensity: ActivityIntensity = "moderate";
      if (item.commuteMode === "bicycle" || /running|jog|exercise|cricket|play/i.test(item.activity)) {
        intensity = /jog|run|exercise/i.test(item.activity) ? "vigorous" : "moderate";
      } else if (/rest|sleep|tv|read|desk|office|study/i.test(item.activity)) {
        intensity = "light";
      }

      return {
        id: item.id || `sim-item-${idx}`,
        activity: item.activity,
        startTime,
        durationMinutes: item.durationMinutes || 30,
        locationType,
        commuteMode: item.commuteMode,
        distanceKm: item.distanceKm || (item.durationMinutes ? Math.max(1, Math.round(item.durationMinutes * 0.35)) : 5),
        intensity,
        hasMask: false,
        notes: item.locationName,
      };
    });
  };

  // Converter from ScheduleItemSimulation to DayScheduleItem
  const convertSimToDayItems = (simSchedule: ScheduleItemSimulation[], origSchedule: DayScheduleItem[] = []): DayScheduleItem[] => {
    return simSchedule.map((item, idx) => {
      const [hStr, mStr] = item.startTime.split(":");
      const hours = parseInt(hStr || "8", 10);
      const mins = mStr || "00";
      const ampm = hours >= 12 ? "PM" : "AM";
      const displayHours = hours % 12 === 0 ? 12 : hours % 12;
      const timeFormatted = `${displayHours.toString().padStart(2, "0")}:${mins} ${ampm}`;
      const original = origSchedule[idx];

      return {
        id: item.id,
        time: timeFormatted,
        activity: item.activity,
        locationName: original?.locationName || (item.locationType === "transit" ? "Eco Transit Corridor" : "Indoor Air Clean Zone"),
        commuteMode: item.commuteMode || original?.commuteMode || "metro",
        durationMinutes: item.durationMinutes,
        isOutdoor: item.locationType === "outdoor",
        distanceKm: item.distanceKm,
      };
    });
  };

  // Handle Family Member selection
  const handleSelectMember = (member: HouseholdMember) => {
    setSelectedMemberId(member.id);
    setSelectedPreset("member");
    setIsAdopted(false);
    const converted = convertMemberScheduleToSim(member);
    setSchedule(converted.length > 0 ? converted : DEFAULT_SIMULATION_SCHEDULE);
  };

  // New item draft form state
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>("");
  const [newStartTime, setNewStartTime] = useState<string>("12:00");
  const [newDuration, setNewDuration] = useState<number>(30);
  const [newLocationType, setNewLocationType] = useState<LocationType>("outdoor");
  const [newCommuteMode, setNewCommuteMode] = useState<CommuteMode>("metro");
  const [newIntensity, setNewIntensity] = useState<ActivityIntensity>("moderate");
  const [newHasMask, setNewHasMask] = useState<boolean>(false);

  const ambientPm25Val = typeof ambientPm25 === "number" ? ambientPm25 : estimatePm25FromAqi(currentAqi);

  // Evaluate baseline schedule reactively using physical formulas
  const baselineSchedule = useMemo(() => {
    return schedule.map((item) => evaluateScheduleItem(item, ambientPm25Val));
  }, [schedule, ambientPm25Val]);

  // Aggregate baseline metrics reactively
  const baselineMetrics: SimulationMetrics = useMemo(() => {
    return {
      totalInhaledPm25Ug: Math.round(baselineSchedule.reduce((acc, it) => acc + (it.inhaledPm25Ug || 0), 0) * 100) / 100,
      totalCo2Kg: Math.round(baselineSchedule.reduce((acc, it) => acc + (it.co2EmissionsKg || 0), 0) * 100) / 100,
      inversionConflictsCount: baselineSchedule.filter((it) => it.isInversionConflict).length,
    };
  }, [baselineSchedule]);

  // Handle on-demand simulation triggered by the user
  const handleSimulate = async () => {
    setIsSimulating(true);
    setIsAdopted(false);

    try {
      if (isGeminiValid && geminiKey) {
        // Attempt AI generation via API
        const res = await fetch("/api/simulator", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-gemini-key": geminiKey,
          },
          body: JSON.stringify({
            schedule: baselineSchedule,
            currentAqi,
            ambientPm25: ambientPm25Val,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data && data.alternativeSchedule && data.baselineMetrics && data.alternativeMetrics) {
            setSimulationResult(data);
            setSimulationEngine(data.engineUsed || "gemini-ai");
            setIsSimulating(false);
            return;
          }
        }
      }

      // Fallback to precomputed deterministic physics alternative
      const fallbackResult = generateClimateAlternative(schedule, currentAqi, ambientPm25Val);
      setSimulationResult(fallbackResult);
      setSimulationEngine("deterministic-physics");
    } catch (err: unknown) {
      console.warn("[Simulator] Simulation request failed, using physics fallback:", err);
      const fallbackResult = generateClimateAlternative(schedule, currentAqi, ambientPm25Val);
      setSimulationResult(fallbackResult);
      setSimulationEngine("deterministic-physics");
    } finally {
      setIsSimulating(false);
    }
  };

  // Handle Preset Switching
  const handleSelectPreset = (presetKey: string) => {
    if (PRESET_SCHEDULES[presetKey]) {
      setSchedule(PRESET_SCHEDULES[presetKey].schedule);
      setSelectedPreset(presetKey);
      setSelectedMemberId(null);
      setIsAdopted(false);
      setSimulationResult(null);
      setSimulationEngine(null);
    }
  };

  // Activity Modification Handlers
  const handleUpdateItem = (id: string, updates: Partial<ScheduleItemSimulation>) => {
    setSchedule((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
    setSelectedPreset("custom");
    setIsAdopted(false);
    setSimulationResult(null);
  };

  const handleRemoveItem = (id: string) => {
    setSchedule((prev) => prev.filter((item) => item.id !== id));
    setSelectedPreset("custom");
    setIsAdopted(false);
    setSimulationResult(null);
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newItem: ScheduleItemSimulation = {
      id: `act-${Date.now()}`,
      activity: newTitle.trim(),
      startTime: newStartTime,
      durationMinutes: Number(newDuration) || 30,
      locationType: newLocationType,
      commuteMode: newLocationType === "transit" ? newCommuteMode : undefined,
      intensity: newIntensity,
      hasMask: newHasMask,
    };

    setSchedule((prev) => [...prev, newItem]);
    setNewTitle("");
    setShowAddForm(false);
    setSelectedPreset("custom");
    setIsAdopted(false);
    setSimulationResult(null);
  };

  const handleAdopt = () => {
    if (!simulationResult) return;
    setIsAdopted(true);
    if (selectedMemberId && onUpdateMemberSchedule) {
      const activeMember = householdMembers.find((m) => m.id === selectedMemberId);
      const convertedItems = convertSimToDayItems(simulationResult.alternativeSchedule, activeMember?.schedule);
      onUpdateMemberSchedule(selectedMemberId, convertedItems);
    }
    if (onAdoptAlternative) {
      onAdoptAlternative(simulationResult.alternativeSchedule);
    }
  };

  // Helper colors and gauges
  const alternativeMetrics = simulationResult?.alternativeMetrics;
  const deltas = simulationResult?.deltas;

  const getInhalationRiskColor = (ug: number) => {
    if (ug <= 25) return { bg: "bg-emerald-500", text: "text-emerald-700", badge: "bg-emerald-100 text-emerald-800", label: "Low Dose" };
    if (ug <= 75) return { bg: "bg-amber-500", text: "text-amber-700", badge: "bg-amber-100 text-amber-800", label: "Moderate Dose" };
    if (ug <= 150) return { bg: "bg-orange-500", text: "text-orange-700", badge: "bg-orange-100 text-orange-800", label: "High Toxic Dose" };
    return { bg: "bg-rose-600", text: "text-rose-700", badge: "bg-rose-100 text-rose-800", label: "Extreme Hazardous Dose" };
  };

  const getCo2Color = (kg: number) => {
    if (kg <= 1.0) return { bg: "bg-emerald-500", text: "text-emerald-700", badge: "bg-emerald-100 text-emerald-800", label: "Clean / Low Footprint" };
    if (kg <= 3.0) return { bg: "bg-amber-500", text: "text-amber-700", badge: "bg-amber-100 text-amber-800", label: "Moderate Emissions" };
    return { bg: "bg-rose-600", text: "text-rose-700", badge: "bg-rose-100 text-rose-800", label: "Heavy Fossil Footprint" };
  };

  const baselinePmRisk = getInhalationRiskColor(baselineMetrics.totalInhaledPm25Ug);
  const baselineCo2Risk = getCo2Color(baselineMetrics.totalCo2Kg);

  return (
    <div className={`bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-8 ${className}`}>
      {/* Header with Title and Mode Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
        <div>
          <div className="flex items-center space-x-2 mb-1.5">
            <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-xs">
              <Activity className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full">
              Decision & Climate Consequence Simulator
            </span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Interactive Daily Exposure & Footprint Tweaker
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Simulate real-time fine particulate (PM2.5) alveolar deposition, transit CO2 emissions, and thermal inversion avoidance.
          </p>
        </div>

        {/* Preset & Household Member Selector */}
        <div className="flex flex-col sm:items-end gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-400">Presets:</span>
            {Object.entries(PRESET_SCHEDULES).map(([key, item]) => (
              <button
                key={key}
                onClick={() => handleSelectPreset(key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedPreset === key && !selectedMemberId
                    ? "bg-indigo-600 text-white shadow-xs shadow-indigo-200"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {item.label.split(" ")[0]}
              </button>
            ))}
            {selectedPreset === "custom" && !selectedMemberId && (
              <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-amber-100 text-amber-800">
                Customized
              </span>
            )}
          </div>

          {/* Household Member Integration */}
          {householdMembers && householdMembers.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-indigo-500" />
                Family:
              </span>
              {householdMembers.map((member) => (
                <button
                  key={member.id}
                  onClick={() => handleSelectMember(member)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                    selectedMemberId === member.id
                      ? "bg-indigo-600 text-white shadow-xs shadow-indigo-200"
                      : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200"
                  }`}
                  title={`Simulate schedule for ${member.name} (Age: ${member.age})`}
                >
                  <span>{member.name.split(" ")[0]}</span>
                  <span className="text-[10px] opacity-75">({member.age}y)</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Active Member Simulation Banner */}
      {selectedMemberId && (
        <div className="bg-gradient-to-r from-indigo-50 via-white to-purple-50 border border-indigo-200 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-indigo-600" />
            <span className="text-slate-800 font-semibold">
              Live Simulation:{" "}
              <strong className="text-indigo-900">
                {householdMembers.find((m) => m.id === selectedMemberId)?.name}
              </strong>{" "}
              (Age: {householdMembers.find((m) => m.id === selectedMemberId)?.age} •{" "}
              {householdMembers.find((m) => m.id === selectedMemberId)?.healthConditions.join(", ") || "No chronic conditions"}
              )
            </span>
          </div>
          <span className="text-[11px] font-bold text-indigo-700 bg-white px-2.5 py-1 rounded-xl border border-indigo-200">
            Adopting alternative directly updates this family member's schedule
          </span>
        </div>
      )}

      {/* Real-Time Consequence Gauges */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* PM2.5 Inhalation Gauge */}
        <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-50 to-white border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase text-slate-500 flex items-center gap-1.5">
              <Wind className="w-4 h-4 text-indigo-500" />
              Personal PM2.5 Inhaled
            </span>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${baselinePmRisk.badge}`}>
              {baselinePmRisk.label}
            </span>
          </div>

          <div className="flex items-baseline space-x-2 my-1">
            <span className="text-3xl font-black text-slate-900">
              {baselineMetrics.totalInhaledPm25Ug.toFixed(1)}
            </span>
            <span className="text-xs font-bold text-slate-400">µg / day</span>
            {deltas && deltas.pm25SavedPct > 0 && (
              <span className="ml-auto inline-flex items-center text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                <TrendingDown className="w-3.5 h-3.5 mr-0.5" />
                -{deltas.pm25SavedPct}% with Alt
              </span>
            )}
          </div>

          {/* Dual bar gauge comparing baseline vs alternative */}
          <div className="mt-3 space-y-1.5">
            <div className="flex justify-between text-[11px] font-medium text-slate-500">
              <span>Baseline: {baselineMetrics.totalInhaledPm25Ug.toFixed(1)} µg</span>
              {alternativeMetrics ? (
                <span className="text-emerald-600 font-bold">Optimized: {alternativeMetrics.totalInhaledPm25Ug.toFixed(1)} µg</span>
              ) : (
                <span className="text-slate-400 italic">Optimized: Awaiting simulation</span>
              )}
            </div>
            <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden flex">
              <div
                className={`h-full ${baselinePmRisk.bg} transition-all duration-500`}
                style={{ width: `${Math.min(100, (baselineMetrics.totalInhaledPm25Ug / 200) * 100)}%` }}
              />
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            WHO threshold: &lt; 15 µg/m³ ambient daily mean. Inhalation &gt; 50 µg deposits deeply into pulmonary alveoli.
          </p>
        </div>

        {/* Trip Carbon Emissions Gauge */}
        <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-50 to-white border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase text-slate-500 flex items-center gap-1.5">
              <Car className="w-4 h-4 text-emerald-500" />
              Transit Carbon Emitted
            </span>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${baselineCo2Risk.badge}`}>
              {baselineCo2Risk.label}
            </span>
          </div>

          <div className="flex items-baseline space-x-2 my-1">
            <span className="text-3xl font-black text-slate-900">
              {baselineMetrics.totalCo2Kg.toFixed(2)}
            </span>
            <span className="text-xs font-bold text-slate-400">kg CO₂</span>
            {deltas && deltas.co2AbatedKg > 0 && (
              <span className="ml-auto inline-flex items-center text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                <Leaf className="w-3.5 h-3.5 mr-0.5" />
                -{deltas.co2AbatedKg.toFixed(1)} kg abated
              </span>
            )}
          </div>

          {/* Dual bar gauge comparing baseline vs alternative */}
          <div className="mt-3 space-y-1.5">
            <div className="flex justify-between text-[11px] font-medium text-slate-500">
              <span>Baseline: {baselineMetrics.totalCo2Kg.toFixed(2)} kg</span>
              {alternativeMetrics ? (
                <span className="text-emerald-600 font-bold">Optimized: {alternativeMetrics.totalCo2Kg.toFixed(2)} kg</span>
              ) : (
                <span className="text-slate-400 italic">Optimized: Awaiting simulation</span>
              )}
            </div>
            <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden flex">
              <div
                className={`h-full ${baselineCo2Risk.bg} transition-all duration-500`}
                style={{ width: `${Math.min(100, (baselineMetrics.totalCo2Kg / 5) * 100)}%` }}
              />
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Calculated from mode passenger-km factors (petrol car 185g/km vs Metro rail 15g/km).
          </p>
        </div>

        {/* Thermal Inversion Traps Radar */}
        <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-50 to-white border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase text-slate-500 flex items-center gap-1.5">
              <Moon className="w-4 h-4 text-purple-500" />
              Inversion Trap Conflicts
            </span>
            <span
              className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                baselineMetrics.inversionConflictsCount > 0
                  ? "bg-rose-100 text-rose-800"
                  : "bg-emerald-100 text-emerald-800"
              }`}
            >
              {baselineMetrics.inversionConflictsCount > 0
                ? `${baselineMetrics.inversionConflictsCount} Traps Active`
                : "Safe Timing"}
            </span>
          </div>

          <div className="flex items-baseline space-x-2 my-1">
            <span className="text-3xl font-black text-slate-900">
              {baselineMetrics.inversionConflictsCount}
            </span>
            <span className="text-xs font-bold text-slate-400">conflicts</span>
            {deltas && deltas.inversionWindowsAvoided > 0 && (
              <span className="ml-auto inline-flex items-center text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-200">
                <ShieldCheck className="w-3.5 h-3.5 mr-0.5" />
                {deltas.inversionWindowsAvoided} Avoided
              </span>
            )}
          </div>

          <div className="mt-3 p-2 rounded-xl bg-purple-50/70 border border-purple-100 text-[11px] text-purple-900 leading-snug">
            <div className="font-bold flex items-center gap-1">
              <Sun className="w-3 h-3 text-amber-500" />
              Diurnal Inversion Windows:
            </div>
            05:00–09:30 & 19:30–23:30 trap combustion near ground. 11:30–16:30 offers maximum solar mixing.
          </div>
        </div>
      </div>

      {/* View Switcher Tabs & Quick Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab("side-by-side")}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
              activeTab === "side-by-side"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Side-by-Side Comparison (Before vs After)
          </button>
          <button
            onClick={() => setActiveTab("tweaker")}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
              activeTab === "tweaker"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Interactive Schedule Tweaker ({schedule.length})
          </button>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center text-xs font-bold px-3 py-2 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors w-fit"
        >
          <Plus className="w-3.5 h-3.5 mr-1.5" />
          {showAddForm ? "Cancel Add Activity" : "Add Custom Activity"}
        </button>
      </div>

      {/* Inline Form to Add Activity */}
      {showAddForm && (
        <form
          onSubmit={handleAddItem}
          className="p-5 rounded-2xl bg-indigo-50/40 border border-indigo-200 space-y-4 animate-fadeIn"
        >
          <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
            <h4 className="text-sm font-bold text-indigo-950 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-indigo-600" />
              Add Simulated Activity to Schedule
            </h4>
            <span className="text-[11px] text-indigo-600">Simulates real-time respiratory & carbon impact</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Activity Name</label>
              <input
                type="text"
                placeholder="e.g. Evening Cycling, School Drop"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Start Time (24h)</label>
              <input
                type="time"
                value={newStartTime}
                onChange={(e) => setNewStartTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Duration (Minutes)</label>
              <input
                type="number"
                min="5"
                max="720"
                value={newDuration}
                onChange={(e) => setNewDuration(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Location Type</label>
              <select
                value={newLocationType}
                onChange={(e) => setNewLocationType(e.target.value as LocationType)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                <option value="outdoor">Outdoor (Street / Park)</option>
                <option value="transit">Transit / Commute</option>
                <option value="indoor">Indoor (Home / Office / Gym)</option>
              </select>
            </div>

            {newLocationType === "transit" && (
              <div>
                <label className="font-bold text-slate-700 block mb-1">Transit Mode</label>
                <select
                  value={newCommuteMode}
                  onChange={(e) => setNewCommuteMode(e.target.value as CommuteMode)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="metro">Metro Rail System</option>
                  <option value="bus">Public Bus</option>
                  <option value="car-ev">Electric Car (EV)</option>
                  <option value="car-petrol">Petrol / Diesel Car</option>
                  <option value="two-wheeler">Motorbike / Scooter</option>
                  <option value="bicycle">Bicycle</option>
                  <option value="walking">Walking</option>
                </select>
              </div>
            )}

            <div>
              <label className="font-bold text-slate-700 block mb-1">Breathing Intensity</label>
              <select
                value={newIntensity}
                onChange={(e) => setNewIntensity(e.target.value as ActivityIntensity)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                <option value="resting">Resting (Office / Sleep ~0.48 m³/h)</option>
                <option value="light">Light (Desk / Standing ~0.84 m³/h)</option>
                <option value="moderate">Moderate (Walking / Commute ~1.92 m³/h)</option>
                <option value="vigorous">Vigorous (Cardio / Running ~3.60 m³/h)</option>
              </select>
            </div>

            <div className="flex items-center space-x-2 pt-6">
              <input
                type="checkbox"
                id="new-mask"
                checked={newHasMask}
                onChange={(e) => setNewHasMask(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300"
              />
              <label htmlFor="new-mask" className="font-bold text-slate-700 cursor-pointer">
                Wear Certified N95 Mask
              </label>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 transition-colors shadow-xs"
            >
              Add to Schedule
            </button>
          </div>
        </form>
      )}

      {/* Tab 1: Side-by-Side Before vs After Comparison */}
      {activeTab === "side-by-side" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Baseline Current Schedule */}
            <div className="p-5 sm:p-6 rounded-2xl border-2 border-slate-200 bg-slate-50/50 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-3 gap-2">
                <div className="flex items-center space-x-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <h3 className="text-base font-extrabold text-slate-900">
                    Baseline Plan (Current Routine)
                  </h3>
                  <span className="text-xs font-bold text-slate-500">
                    • {schedule.length} Activities
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleSimulate}
                  disabled={isSimulating}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-xs shadow-xs transition-all disabled:opacity-50 active:scale-95 cursor-pointer"
                  title="Simulate exposure and generate climate-preserving alternative"
                >
                  {isSimulating ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Simulating...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>Simulate &amp; Generate Alternatives</span>
                    </>
                  )}
                </button>
              </div>

              {/* Baseline Summary Metrics */}
              <div className="grid grid-cols-3 gap-2 p-3 bg-white rounded-xl border border-slate-200 text-center">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">PM2.5 Inhaled</span>
                  <span className="text-base font-extrabold text-slate-800">
                    {baselineMetrics.totalInhaledPm25Ug.toFixed(1)} <span className="text-[10px] text-slate-400">µg</span>
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">CO₂ Emitted</span>
                  <span className="text-base font-extrabold text-slate-800">
                    {baselineMetrics.totalCo2Kg.toFixed(2)} <span className="text-[10px] text-slate-400">kg</span>
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Inversion Traps</span>
                  <span className={`text-base font-extrabold ${baselineMetrics.inversionConflictsCount > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                    {baselineMetrics.inversionConflictsCount}
                  </span>
                </div>
              </div>

              {/* Baseline Schedule List */}
              <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                {baselineSchedule.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl bg-white border border-slate-200 text-xs space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-extrabold text-slate-800">{item.activity}</div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {item.isInversionConflict && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-rose-100 text-rose-800 text-[10px] font-bold">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Inversion Trap
                          </span>
                        )}
                        <span className="font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                          {item.startTime} ({item.durationMinutes}m)
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                      <span className="capitalize font-semibold text-slate-600">
                        {item.locationType}
                        {item.commuteMode && ` • ${item.commuteMode.replace("-", " ")}`}
                      </span>
                      <span>•</span>
                      <span>Intensity: {item.intensity || "light"}</span>
                      {item.hasMask && (
                        <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded-sm">
                          N95 Mask
                        </span>
                      )}
                      <div className="ml-auto font-bold text-slate-700">
                        {(item.inhaledPm25Ug || 0).toFixed(1)} µg PM2.5
                        {(item.co2EmissionsKg || 0) > 0 && ` | ${(item.co2EmissionsKg || 0).toFixed(2)} kg CO₂`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Climate-Preserving Alternative Schedule */}
            <div className="p-5 sm:p-6 rounded-2xl border-2 border-emerald-300 bg-emerald-50/30 space-y-4 relative">
              <div className="flex items-center justify-between border-b border-emerald-200 pb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <h3 className="text-base font-extrabold text-emerald-950 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    Climate-Preserving Alternative
                  </h3>
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                  {simulationEngine?.startsWith("gemini")
                    ? "Gemini AI Optimized"
                    : simulationResult
                      ? "Physics Optimized"
                      : "Awaiting Simulation"}
                </span>
              </div>

              {simulationResult && alternativeMetrics && deltas ? (
                <>
                  {/* Alternative Summary Metrics */}
                  <div className="grid grid-cols-3 gap-2 p-3 bg-white rounded-xl border border-emerald-200 text-center shadow-2xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">PM2.5 Inhaled</span>
                      <span className="text-base font-extrabold text-emerald-700">
                        {alternativeMetrics.totalInhaledPm25Ug.toFixed(1)} <span className="text-[10px] text-slate-400">µg</span>
                      </span>
                      {deltas.pm25SavedPct > 0 && (
                        <span className="text-[10px] font-bold text-emerald-600 block">
                          -{deltas.pm25SavedPct}% Saved
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">CO₂ Emitted</span>
                      <span className="text-base font-extrabold text-emerald-700">
                        {alternativeMetrics.totalCo2Kg.toFixed(2)} <span className="text-[10px] text-slate-400">kg</span>
                      </span>
                      {deltas.co2AbatedKg > 0 && (
                        <span className="text-[10px] font-bold text-emerald-600 block">
                          -{deltas.co2AbatedKg.toFixed(1)} kg Abated
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Inversion Traps</span>
                      <span className="text-base font-extrabold text-emerald-700">
                        {alternativeMetrics.inversionConflictsCount}
                      </span>
                      {deltas.inversionWindowsAvoided > 0 && (
                        <span className="text-[10px] font-bold text-emerald-600 block">
                          {deltas.inversionWindowsAvoided} Neutralized
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Alternative Schedule List */}
                  <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                    {simulationResult.alternativeSchedule.map((item, idx) => {
                      const baselineMatch = baselineSchedule[idx];
                      const isModified =
                        baselineMatch &&
                        (baselineMatch.startTime !== item.startTime ||
                          baselineMatch.commuteMode !== item.commuteMode ||
                          baselineMatch.locationType !== item.locationType ||
                          baselineMatch.hasMask !== item.hasMask);

                      return (
                        <div
                          key={item.id}
                          className={`p-3.5 rounded-xl border text-xs space-y-2 transition-all ${
                            isModified
                              ? "bg-white border-emerald-300 shadow-xs ring-1 ring-emerald-200"
                              : "bg-white/80 border-slate-200"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="font-extrabold text-emerald-950 flex items-center gap-1.5">
                                {item.activity}
                                {isModified && (
                                  <span className="text-[9px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-sm">
                                    Optimized
                                  </span>
                                )}
                              </div>
                              {item.notes && (
                                <p className="text-[11px] text-emerald-700 font-medium mt-0.5">
                                  {item.notes}
                                </p>
                              )}
                            </div>
                            <span className="font-bold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-md flex-shrink-0">
                              {item.startTime} ({item.durationMinutes}m)
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                            <span className="capitalize font-semibold text-slate-700">
                              {item.locationType}
                              {item.commuteMode && ` • ${item.commuteMode.replace("-", " ")}`}
                            </span>
                            {item.hasMask && (
                              <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded-sm">
                                ✓ N95 Equipped
                              </span>
                            )}
                            <div className="ml-auto font-extrabold text-emerald-800">
                              {(item.inhaledPm25Ug || 0).toFixed(1)} µg PM2.5
                              {(item.co2EmissionsKg || 0) > 0 && ` | ${(item.co2EmissionsKg || 0).toFixed(2)} kg CO₂`}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="p-8 rounded-2xl border-2 border-dashed border-emerald-200/90 bg-white/60 flex flex-col items-center justify-center text-center space-y-4 min-h-[380px]">
                  <div className="p-4 rounded-2xl bg-emerald-100/70 text-emerald-700">
                    <Sparkles className="w-8 h-8 text-emerald-600" />
                  </div>
                  <div className="max-w-xs space-y-1.5">
                    <h4 className="font-extrabold text-slate-900 text-sm">
                      Alternative Plan Not Generated Yet
                    </h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Click <strong className="text-indigo-600 font-bold">&quot;Simulate &amp; Generate Alternatives&quot;</strong> near the Baseline Plan to compute optimal route shifts, N95 protection, and transit decarbonization.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleSimulate}
                    disabled={isSimulating}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isSimulating ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Simulating...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Simulate Now</span>
                      </>
                    )}
                  </button>
                  <span className="text-[10px] text-slate-400">
                    {isGeminiValid && geminiKey
                      ? "⚡ Powered by Gemini 3.6-Flash & Microclimate Physics"
                      : "🔬 Powered by Precomputed Microclimate Physics Model"}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Key Impact Highlights & Adoption Action Banner */}
          {simulationResult && (
            <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-900 via-indigo-950 to-slate-900 text-white shadow-md flex flex-col md:flex-row items-center justify-between gap-6 animate-fadeIn">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <h4 className="font-black text-base tracking-tight text-white">
                    Climate &amp; Health Net Optimization
                  </h4>
                </div>
                <ul className="text-xs text-slate-300 space-y-1">
                  {simulationResult.impactHighlights.map((hl, idx) => (
                    <li key={idx} className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                      <span>{hl}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex-shrink-0 w-full md:w-auto">
                <button
                  onClick={handleAdopt}
                  disabled={isAdopted}
                  className={`w-full md:w-auto px-6 py-3.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition-all shadow-lg cursor-pointer ${
                    isAdopted
                      ? "bg-emerald-500 text-white cursor-default"
                      : "bg-emerald-400 hover:bg-emerald-300 text-slate-950 hover:scale-[1.02] active:scale-[0.98]"
                  }`}
                >
                  {isAdopted ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-white" />
                      <span>✓ Climate Alternative Adopted!</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-slate-950" />
                      <span>Adopt Climate-Preserving Alternative</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Interactive Schedule Tweaker List */}
      {activeTab === "tweaker" && (
        <div className="space-y-4">
          <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 flex items-center justify-between text-xs text-indigo-900">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-indigo-600 flex-shrink-0" />
              <span>
                Fine-tune each activity's start time, transit mode, duration, or mask status. Consequence metrics recalculate dynamically.
              </span>
            </div>
            <button
              onClick={() => handleSelectPreset(selectedPreset)}
              className="text-[11px] font-bold text-indigo-700 hover:underline flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              Reset
            </button>
          </div>

          <div className="space-y-3">
            {schedule.map((item) => {
              const inInversion = isInversionWindow(item.startTime);
              return (
                <div
                  key={item.id}
                  className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-indigo-300 transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        value={item.activity}
                        onChange={(e) => handleUpdateItem(item.id, { activity: e.target.value })}
                        className="font-extrabold text-sm text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:outline-hidden"
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      {inInversion && item.locationType !== "indoor" && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Inversion Hour
                        </span>
                      )}
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Remove activity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Time</span>
                      <input
                        type="time"
                        value={item.startTime}
                        onChange={(e) => handleUpdateItem(item.id, { startTime: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold"
                      />
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Duration</span>
                      <select
                        value={item.durationMinutes}
                        onChange={(e) => handleUpdateItem(item.id, { durationMinutes: Number(e.target.value) })}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold"
                      >
                        <option value={15}>15 mins</option>
                        <option value={30}>30 mins</option>
                        <option value={45}>45 mins</option>
                        <option value={60}>60 mins</option>
                        <option value={90}>90 mins</option>
                        <option value={120}>2 hours</option>
                        <option value={480}>8 hours</option>
                      </select>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Environment</span>
                      <select
                        value={item.locationType}
                        onChange={(e) => handleUpdateItem(item.id, { locationType: e.target.value as LocationType })}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold"
                      >
                        <option value="outdoor">Outdoor</option>
                        <option value="transit">Transit</option>
                        <option value="indoor">Indoor</option>
                      </select>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Transit / Mode</span>
                      <select
                        value={item.commuteMode || "walking"}
                        onChange={(e) => handleUpdateItem(item.id, { commuteMode: e.target.value as CommuteMode })}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold"
                      >
                        <option value="metro">Metro Rail</option>
                        <option value="bus">Public Bus</option>
                        <option value="car-ev">EV Car</option>
                        <option value="car-petrol">Petrol Car</option>
                        <option value="two-wheeler">Two-Wheeler</option>
                        <option value="bicycle">Bicycle</option>
                        <option value="walking">Walking</option>
                      </select>
                    </div>

                    <div className="flex items-center space-x-2 pt-4">
                      <input
                        type="checkbox"
                        id={`mask-${item.id}`}
                        checked={item.hasMask || false}
                        onChange={(e) => handleUpdateItem(item.id, { hasMask: e.target.checked })}
                        className="w-4 h-4 text-indigo-600 rounded border-slate-300"
                      />
                      <label htmlFor={`mask-${item.id}`} className="font-bold text-slate-700 cursor-pointer">
                        N95 Mask
                      </label>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
