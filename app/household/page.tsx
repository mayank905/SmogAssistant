"use client";

import React from "react";
import { useAppContext } from "@/context/AppContext";
import { HouseholdAdviceCard } from "@/components/HouseholdAdviceCard";
import { HouseholdScheduleManager } from "@/components/HouseholdScheduleManager";
import { VulnerableAlertsBanner } from "@/components/VulnerableAlertsBanner";
import { DailyRoutinePlanner } from "@/components/DailyRoutinePlanner";
import { Users, Shield, RefreshCw, Sparkles, CheckCircle2 } from "lucide-react";

export default function HouseholdPage() {
  const {
    telemetry,
    householdMembers,
    householdAdvice,
    isHouseholdLoading,
    recommendations,
    updateHouseholdMembers,
    adoptHouseholdShift,
    refreshHouseholdAdviceAction,
    keysState,
  } = useAppContext();

  return (
    <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-to-br from-emerald-600 to-teal-500 rounded-2xl text-white shadow-sm">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Household Defense & Multi-Member Profiler
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                {householdMembers.length} Members Active
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Personalized schedules, age-specific vulnerability shielding, and synchronized indoor air defense
            </p>
          </div>
        </div>

        <button
          onClick={() => refreshHouseholdAdviceAction(telemetry, householdMembers, keysState.geminiKey)}
          disabled={isHouseholdLoading}
          className="inline-flex items-center px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isHouseholdLoading ? "animate-spin text-indigo-600" : ""}`} />
          Recalculate Household Strategy
        </button>
      </div>

      {/* Task 1: Synchronized Dual-Level Household Strategy & Personalized Precautions */}
      <HouseholdAdviceCard
        advice={householdAdvice}
        currentAqi={telemetry.overallAqi}
        isLoading={isHouseholdLoading}
        onRefreshAdvice={() => refreshHouseholdAdviceAction(telemetry, householdMembers, keysState.geminiKey)}
        onApplyShift={adoptHouseholdShift}
      />

      {/* Task 1: Multi-Member Household Health & Schedule Profiler */}
      <HouseholdScheduleManager
        initialMembers={householdMembers}
        onMembersChange={updateHouseholdMembers}
      />

      {/* Vulnerable Alerts */}
      <VulnerableAlertsBanner alerts={recommendations.vulnerableAlerts} />

      {/* Daily Routine Schedule Optimizer */}
      <DailyRoutinePlanner routinePlan={recommendations.dailyRoutinePlan} />
    </main>
  );
}
