"use client";

import React, { useState } from "react";
import {
  HouseholdAdviceResponse,
  MemberPersonalAdvice,
  ScheduleShift,
  DEFAULT_HOUSEHOLD_ADVICE,
} from "@/types/household";
import {
  Wind,
  ShieldCheck,
  ShieldAlert,
  Home,
  Users,
  HeartPulse,
  Clock,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  Lock,
  ThermometerSun,
  Stethoscope,
  Car,
  ChevronRight,
  Check,
} from "lucide-react";

interface HouseholdAdviceCardProps {
  advice?: HouseholdAdviceResponse;
  currentAqi?: number;
  onRefreshAdvice?: () => void;
  isLoading?: boolean;
  onApplyShift?: (memberId: string, shift: ScheduleShift) => void;
  className?: string;
}

export const HouseholdAdviceCard: React.FC<HouseholdAdviceCardProps> = ({
  advice = DEFAULT_HOUSEHOLD_ADVICE,
  currentAqi = 412,
  onRefreshAdvice,
  isLoading = false,
  onApplyShift,
  className = "",
}) => {
  const [activeTabMemberId, setActiveTabMemberId] = useState<string>(() => {
    return (advice.memberAdvice && advice.memberAdvice[0]?.memberId) || "member-child-aarav";
  });
  const [adoptedShifts, setAdoptedShifts] = useState<Record<string, boolean>>({});

  const combined = advice.combinedStrategy;
  const membersAdvice = advice.memberAdvice || [];

  // Active member advice
  const currentMemberAdvice: MemberPersonalAdvice | undefined =
    membersAdvice.find((m) => m.memberId === activeTabMemberId) || membersAdvice[0];

  const handleAdoptShift = (memberId: string, shift: ScheduleShift, idx: number) => {
    const shiftKey = `${memberId}-${idx}`;
    setAdoptedShifts((prev) => ({ ...prev, [shiftKey]: true }));
    if (onApplyShift) {
      onApplyShift(memberId, shift);
    }
  };

  const getRiskBadgeColor = (risk: string) => {
    switch (risk) {
      case "Critical":
        return "bg-rose-100 text-rose-800 border-rose-200";
      case "High":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "Moderate":
        return "bg-amber-100 text-amber-800 border-amber-200";
      default:
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
    }
  };

  const getRiskBarColor = (score: number) => {
    if (score >= 85) return "bg-rose-500";
    if (score >= 65) return "bg-orange-500";
    if (score >= 40) return "bg-amber-500";
    return "bg-emerald-500";
  };

  return (
    <div className={`bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-8 ${className}`}>
      {/* 1. Header & High-Level Dual Defense Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-6">
        <div>
          <div className="flex items-center space-x-2 mb-1.5 flex-wrap gap-y-1">
            <span className="inline-flex items-center text-xs font-bold uppercase tracking-widest text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-md">
              <Sparkles className="w-3.5 h-3.5 mr-1 text-indigo-600" />
              Synchronized Dual-Level Air Defense
            </span>
            <span className="inline-flex items-center text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-md border border-rose-200">
              <AlertTriangle className="w-3.5 h-3.5 mr-1" />
              Severe Inversion Guard • AQI {currentAqi}
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Combined Household Strategy & Member Precautions
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl">
            Simultaneously coordinates building-envelope defenses (purifiers, window sealing, transit sync) with personalized clinical protocols tailored to each family member.
          </p>
        </div>

        {onRefreshAdvice && (
          <button
            type="button"
            onClick={onRefreshAdvice}
            disabled={isLoading}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 transition-all self-start lg:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-indigo-600" : ""}`} />
            <span>{isLoading ? "Recalculating..." : "Recalculate AI Strategy"}</span>
          </button>
        )}
      </div>

      {/* 2. SECTION A: Combined Household Strategy (Whole-House Layer) */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
            <Home className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
            Layer 1: Unified Household Strategy (Building & Collective Transit)
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Purifier Runtime Hours & Schedule */}
          <div className="bg-gradient-to-br from-indigo-50/70 to-slate-50 rounded-2xl p-5 border border-indigo-100 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="inline-flex items-center text-xs font-bold uppercase tracking-wider text-indigo-700">
                  <Wind className="w-4 h-4 mr-1.5 text-indigo-600" />
                  Air Purifier Runtime
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-indigo-200/60 text-indigo-900">
                  HEPA H13
                </span>
              </div>

              <div className="text-lg font-black text-slate-900 mb-2">
                {combined.purifierRuntimeHours}
              </div>

              {combined.purifierSchedule && (
                <div className="space-y-1.5 text-xs text-slate-600 mt-2">
                  <div className="bg-white/80 p-2.5 rounded-xl border border-indigo-100/60 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-slate-500">Peak Run Hours:</span>
                      <span className="font-bold text-indigo-900">{combined.purifierSchedule.peakHours}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-slate-500">Fan Speed:</span>
                      <span className="font-bold text-slate-800">{combined.purifierSchedule.recommendedSpeed}</span>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-500 pt-1">
                    <span className="font-semibold text-slate-700">Target Rooms: </span>
                    {combined.purifierSchedule.targetRooms.join(", ")}
                  </div>
                </div>
              )}
            </div>

            {combined.purifierSchedule?.filterLifeTip && (
              <div className="mt-4 pt-3 border-t border-indigo-100/80 text-[11px] text-indigo-900/80 font-medium">
                💡 {combined.purifierSchedule.filterLifeTip}
              </div>
            )}
          </div>

          {/* Window Sealing & Ventilation */}
          <div className="bg-gradient-to-br from-emerald-50/70 to-slate-50 rounded-2xl p-5 border border-emerald-100 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="inline-flex items-center text-xs font-bold uppercase tracking-wider text-emerald-800">
                  <Lock className="w-4 h-4 mr-1.5 text-emerald-600" />
                  Window Sealing & Venting
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-200/60 text-emerald-900">
                  Aerosol Lock
                </span>
              </div>

              <p className="text-xs text-slate-700 font-medium leading-relaxed mb-3">
                {combined.windowSealing}
              </p>

              {combined.ventilationWindows && combined.ventilationWindows.length > 0 && (
                <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-100/60 text-xs">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-700 mb-1">
                    Safe Micro-Ventilation Window
                  </span>
                  {combined.ventilationWindows.map((win, i) => (
                    <div key={i} className="flex items-center space-x-1.5 text-slate-800 font-bold text-[11px]">
                      <ThermometerSun className="w-3.5 h-3.5 text-amber-500" />
                      <span>{win}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-emerald-100/80 text-[11px] text-emerald-800 font-medium flex items-center">
              <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-600 flex-shrink-0" />
              <span>Prevents cold morning smog inversion infiltration into bedrooms</span>
            </div>
          </div>

          {/* Family Transit Sync */}
          <div className="bg-gradient-to-br from-amber-50/70 to-slate-50 rounded-2xl p-5 border border-amber-100 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="inline-flex items-center text-xs font-bold uppercase tracking-wider text-amber-800">
                  <Car className="w-4 h-4 mr-1.5 text-amber-600" />
                  Family Transit Sync
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-200/60 text-amber-900">
                  Exposure Cut
                </span>
              </div>

              <p className="text-xs text-slate-700 font-medium leading-relaxed mb-3">
                {combined.familyTransitSync}
              </p>

              {combined.transitSyncRecommendations && (
                <ul className="space-y-1.5 text-[11px] text-slate-600">
                  {combined.transitSyncRecommendations.map((rec, i) => (
                    <li key={i} className="flex items-start space-x-1.5">
                      <span className="text-amber-500 font-bold mt-0.5">•</span>
                      <span className="leading-tight">{rec}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-amber-100/80 text-[11px] text-amber-900/80 font-medium flex items-center">
              <Users className="w-3.5 h-3.5 mr-1 text-amber-600 flex-shrink-0" />
              <span>Eliminates open two-wheeler toxic soot exposure for household</span>
            </div>
          </div>
        </div>

        {/* Collective Indoor Best Practices Bar */}
        {combined.sharedIndoorActions && combined.sharedIndoorActions.length > 0 && (
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2 text-slate-700 font-bold">
              <ShieldCheck className="w-4 h-4 text-indigo-600 flex-shrink-0" />
              <span>Collective Household Rules:</span>
            </div>
            <div className="flex flex-wrap gap-2 text-slate-600 text-[11px]">
              {combined.sharedIndoorActions.map((action, i) => (
                <span
                  key={i}
                  className="bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs font-medium"
                >
                  ✓ {action}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 3. SECTION B: Personalized Member Advice (Individual Layer Tabs) */}
      <div className="space-y-5 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <Users className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
              Layer 2: Personalized Resident Protocols (Clinical & Schedule Shifts)
            </h4>
          </div>
          <span className="text-xs text-slate-500">
            Select a member to view customized clinical precautions
          </span>
        </div>

        {/* Member Selector Tabs */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1">
          {membersAdvice.map((member) => {
            const isTabActive = member.memberId === activeTabMemberId;
            return (
              <button
                key={member.memberId}
                type="button"
                onClick={() => setActiveTabMemberId(member.memberId)}
                className={`flex items-center space-x-2.5 px-4 py-2.5 rounded-2xl border text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isTabActive
                    ? "bg-slate-900 text-white border-slate-900 shadow-sm ring-2 ring-slate-900/10"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <span>{member.memberName}</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                    isTabActive ? "bg-white/20 text-white" : getRiskBadgeColor(member.riskLevel)
                  }`}
                >
                  Risk {member.individualRiskScore}/100
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected Member Detail View */}
        {currentMemberAdvice && (
          <div className="bg-slate-50/70 rounded-3xl border border-slate-200 p-5 sm:p-7 space-y-6">
            {/* Member Snapshot & Risk Gauge */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 bg-white p-5 rounded-2xl border border-slate-200">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <h5 className="text-lg font-black text-slate-900">
                    {currentMemberAdvice.memberName}
                  </h5>
                  <span className="text-xs font-bold text-slate-500">
                    ({currentMemberAdvice.age} years old)
                  </span>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${getRiskBadgeColor(currentMemberAdvice.riskLevel)}`}>
                    {currentMemberAdvice.riskLevel} Health Risk
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Customized for age group vulnerability, pulmonary airway aerodynamics, and daily exposure windows.
                </p>
              </div>

              {/* Risk Gauge Bar */}
              <div className="w-full lg:w-72 bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-600">Inhalation Risk Index</span>
                  <span className="font-black text-slate-900">
                    {currentMemberAdvice.individualRiskScore} <span className="text-slate-400 font-normal">/ 100</span>
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-2.5 rounded-full transition-all duration-500 ${getRiskBarColor(currentMemberAdvice.individualRiskScore)}`}
                    style={{ width: `${Math.min(100, currentMemberAdvice.individualRiskScore)}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-400 block text-right font-medium">
                  {currentMemberAdvice.individualRiskScore > 80 ? "Immediate shielding mandated" : "Moderate protection required"}
                </span>
              </div>
            </div>

            {/* Mask & Medical Advisory Strip */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-indigo-700">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <span>Mandated Respirator Standard</span>
                </div>
                <p className="text-xs font-bold text-slate-800 bg-indigo-50/50 p-2.5 rounded-xl border border-indigo-100">
                  {currentMemberAdvice.maskRecommendation}
                </p>
              </div>

              {currentMemberAdvice.medicalAdvisory && (
                <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-rose-700">
                    <Stethoscope className="w-4 h-4 text-rose-600" />
                    <span>Clinical Emergency Advisory</span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed bg-rose-50/40 p-2.5 rounded-xl border border-rose-100 font-medium">
                    {currentMemberAdvice.medicalAdvisory}
                  </p>
                </div>
              )}
            </div>

            {/* Age-Specific Precautions */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
              <h6 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
                <HeartPulse className="w-4 h-4 text-rose-500" />
                <span>Age-Specific Clinical Precautions & Vulnerability Dynamics</span>
              </h6>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {currentMemberAdvice.ageSpecificPrecautions.map((prec, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700 font-medium leading-relaxed flex items-start space-x-2"
                  >
                    <span className="text-indigo-600 font-bold">•</span>
                    <span>{prec}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Schedule Shifts & Commute Rerouting */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h6 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  <span>Personalized Schedule Shifts & Route Defense</span>
                </h6>
                <span className="text-[11px] text-slate-500 font-medium">
                  Shifts high-exposure habits away from smog inversion peaks
                </span>
              </div>

              {currentMemberAdvice.scheduleShifts.length === 0 ? (
                <div className="p-4 bg-white rounded-xl border border-slate-200 text-center text-xs text-slate-500">
                  No routine shifts currently needed for this profile under current AQI conditions.
                </div>
              ) : (
                <div className="space-y-3">
                  {currentMemberAdvice.scheduleShifts.map((shift, idx) => {
                    const shiftKey = `${currentMemberAdvice.memberId}-${idx}`;
                    const isAdopted = adoptedShifts[shiftKey];

                    return (
                      <div
                        key={idx}
                        className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                          isAdopted
                            ? "bg-emerald-50/40 border-emerald-300 ring-1 ring-emerald-400/20"
                            : "bg-white border-slate-200 hover:border-indigo-200 hover:shadow-xs"
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                          <span className="font-extrabold text-sm text-slate-900">
                            {shift.activity}
                          </span>
                          <span className="inline-flex items-center text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 w-fit">
                            <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                            -{shift.exposureReductionPct}% Inhalation Reduction
                          </span>
                        </div>

                        {/* Timing Comparison Strip */}
                        <div className="grid grid-cols-1 sm:grid-cols-11 gap-2 items-center mb-3 text-xs">
                          <div className="sm:col-span-5 bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-rose-500 flex-shrink-0" />
                            <div>
                              <span className="text-[10px] text-slate-400 block uppercase font-bold">Original Routine</span>
                              <span className="font-bold text-slate-700">{shift.originalTime}</span>
                            </div>
                          </div>

                          <div className="sm:col-span-1 flex justify-center">
                            <ArrowRight className="w-4 h-4 text-indigo-400 rotate-90 sm:rotate-0" />
                          </div>

                          <div className="sm:col-span-5 bg-indigo-50/70 p-2.5 rounded-xl border border-indigo-200 flex items-center space-x-2">
                            <ShieldCheck className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                            <div>
                              <span className="text-[10px] text-indigo-500 block uppercase font-bold">Recommended Shift</span>
                              <span className="font-black text-indigo-950">{shift.proposedTime}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
                          <p className="text-xs text-slate-600 font-medium">
                            <span className="font-bold text-slate-800">Rationale: </span>
                            {shift.reason}
                          </p>

                          <button
                            type="button"
                            onClick={() => handleAdoptShift(currentMemberAdvice.memberId, shift, idx)}
                            disabled={isAdopted}
                            className={`inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all self-start sm:self-auto flex-shrink-0 ${
                              isAdopted
                                ? "bg-emerald-600 text-white cursor-default"
                                : "bg-slate-900 text-white hover:bg-indigo-600 shadow-2xs"
                            }`}
                          >
                            {isAdopted ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>Shift Adopted</span>
                              </>
                            ) : (
                              <>
                                <span>Adopt Schedule Shift</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Restrictions list */}
            {currentMemberAdvice.activityRestrictions && currentMemberAdvice.activityRestrictions.length > 0 && (
              <div className="bg-amber-50/50 rounded-2xl p-4 border border-amber-200/80 flex items-start space-x-3 text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-amber-900 block mb-1">
                    Mandatory Activity Redlines for {currentMemberAdvice.memberName}:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {currentMemberAdvice.activityRestrictions.map((item, i) => (
                      <span key={i} className="bg-white/80 px-2 py-0.5 rounded text-amber-800 font-medium border border-amber-200">
                        ✕ {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
