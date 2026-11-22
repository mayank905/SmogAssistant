"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { ScenarioSwitcher } from "@/components/ScenarioSwitcher";
import { CitySearchBar } from "@/components/CitySearchBar";
import { LiveTelemetryCard } from "@/components/LiveTelemetryCard";
import { PollutantGrid } from "@/components/PollutantGrid";
import { AqiMapView } from "@/components/AqiMapView";
import { MorningBriefingCard } from "@/components/MorningBriefingCard";
import { GeminiCopilotChat } from "@/components/GeminiCopilotChat";
import { DailyRoutinePlanner } from "@/components/DailyRoutinePlanner";
import { IndoorMitigationGuide } from "@/components/IndoorMitigationGuide";
import { SustainableTransitComparator } from "@/components/SustainableTransitComparator";
import { VulnerableAlertsBanner } from "@/components/VulnerableAlertsBanner";
import { ContextProfiler } from "@/components/ContextProfiler";
import { ApiKeyModal } from "@/components/ApiKeyModal";
import { HouseholdScheduleManager } from "@/components/HouseholdScheduleManager";
import { HouseholdAdviceCard } from "@/components/HouseholdAdviceCard";
import { DecisionSimulator } from "@/components/DecisionSimulator";

import { AirQualityTelemetry } from "@/types/aqi";
import { UserContextProfile, SavedProfile, DEFAULT_USER_CONTEXT, INITIAL_SAVED_PROFILES } from "@/types/context";
import { AIRecommendationResponse } from "@/types/recommendations";
import { ApiKeysState } from "@/types/auth";
import { 
  HouseholdMember, 
  INITIAL_HOUSEHOLD_MEMBERS, 
  DEFAULT_HOUSEHOLD_ADVICE, 
  HouseholdAdviceResponse,
  ScheduleShift,
} from "@/types/household";
import { SCENARIO_PRESETS } from "@/lib/api/scenario-presets";
import { generateDeterministicRecommendations } from "@/lib/ai/heuristic-fallback";
import { generateHouseholdAdvice } from "@/lib/ai/multi-model-client";
import { Settings, Sparkles, RefreshCw, Cpu, ShieldCheck, Key, CheckCircle2, Bookmark, ChevronDown } from "lucide-react";

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>("delhi-winter-severe");
  const [telemetry, setTelemetry] = useState<AirQualityTelemetry>(SCENARIO_PRESETS[0].telemetry);
  const [context, setContext] = useState<UserContextProfile>(DEFAULT_USER_CONTEXT);
  const [savedProfiles, setSavedProfiles] = useState<SavedProfile[]>(INITIAL_SAVED_PROFILES);

  const [keysState, setKeysState] = useState<ApiKeysState>({
    geminiKey: "",
    waqiToken: "",
    isGeminiValid: false,
    isWaqiValid: false,
  });

  const [recommendations, setRecommendations] = useState<AIRecommendationResponse>(() =>
    generateDeterministicRecommendations(SCENARIO_PRESETS[0].telemetry, DEFAULT_USER_CONTEXT)
  );

  const [isLoading, setIsLoading] = useState(false);
  const [isProfilerOpen, setIsProfilerOpen] = useState(false);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [hasNotificationsEnabled, setHasNotificationsEnabled] = useState(false);

  // Household Profiler & Dual Advice State
  const [householdMembers, setHouseholdMembers] = useState<HouseholdMember[]>(INITIAL_HOUSEHOLD_MEMBERS);
  const [householdAdvice, setHouseholdAdvice] = useState<HouseholdAdviceResponse>(DEFAULT_HOUSEHOLD_ADVICE);
  const [isHouseholdLoading, setIsHouseholdLoading] = useState(false);

  // Mount effect: safely load localStorage and notification permissions without SSR mismatch
  useEffect(() => {
    setIsMounted(true);

    // 1. Check notifications
    if (typeof window !== "undefined" && "Notification" in window) {
      setHasNotificationsEnabled(Notification.permission === "granted");
    }

    // 2. Load API keys from localStorage
    try {
      const savedGeminiKey = localStorage.getItem("smogassistant_gemini_key") || "";
      const savedWaqiToken = localStorage.getItem("smogassistant_waqi_token") || "";
      const isGeminiValid = localStorage.getItem("smogassistant_gemini_valid") === "true";
      const isWaqiValid = localStorage.getItem("smogassistant_waqi_valid") === "true";

      if (savedGeminiKey || savedWaqiToken) {
        setKeysState({
          geminiKey: savedGeminiKey,
          waqiToken: savedWaqiToken,
          isGeminiValid,
          isWaqiValid,
        });
      }
    } catch (e) {
      console.warn("Could not load stored keys:", e);
    }

    // 3. Load saved profiles from localStorage
    try {
      const storedProfiles = localStorage.getItem("smogassistant_saved_profiles");
      if (storedProfiles) {
        const parsed = JSON.parse(storedProfiles);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSavedProfiles(parsed);
          setContext(parsed[0].context);
        }
      }
    } catch (e) {
      console.warn("Could not load stored profiles:", e);
    }

    // 4. Load household members from localStorage
    try {
      const storedMembers = localStorage.getItem("smogassistant_household_members");
      if (storedMembers) {
        const parsedMembers = JSON.parse(storedMembers);
        if (Array.isArray(parsedMembers) && parsedMembers.length > 0) {
          setHouseholdMembers(parsedMembers);
        }
      }
    } catch (e) {
      console.warn("Could not load stored household members:", e);
    }
  }, []);

  const handleToggleNotifications = () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "granted") {
        alert("Daily 06:30 AM Morning Briefing alerts are active for your location.");
      } else {
        Notification.requestPermission().then((perm) => {
          setHasNotificationsEnabled(perm === "granted");
          if (perm === "granted") {
            new Notification("SmogAssistant Notifications Enabled", {
              body: "You will receive daily early-morning smog briefs and exposure advisories.",
            });
          }
        });
      }
    }
  };

  // Fetch recommendations whenever telemetry, context, or keys change
  const refreshRecommendations = async (
    curTelemetry: AirQualityTelemetry, 
    curContext: UserContextProfile,
    curGeminiKey: string = keysState.geminiKey
  ) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/recommendations", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(curGeminiKey ? { "x-gemini-key": curGeminiKey } : {}),
        },
        body: JSON.stringify({ 
          telemetry: curTelemetry, 
          context: curContext,
          apiKey: curGeminiKey,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setRecommendations(data);
      } else {
        setRecommendations(generateDeterministicRecommendations(curTelemetry, curContext));
      }
    } catch (err) {
      console.warn("Using offline deterministic recommendations:", err);
      setRecommendations(generateDeterministicRecommendations(curTelemetry, curContext));
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh household multi-member advice
  const refreshHouseholdAdvice = async (
    curTelemetry: AirQualityTelemetry,
    curMembers: HouseholdMember[] = householdMembers,
    curGeminiKey: string = keysState.geminiKey
  ) => {
    setIsHouseholdLoading(true);
    try {
      const advice = await generateHouseholdAdvice(curTelemetry, curMembers, curGeminiKey);
      setHouseholdAdvice(advice);
    } catch (err) {
      console.warn("Falling back to deterministic household advice:", err);
      setHouseholdAdvice(DEFAULT_HOUSEHOLD_ADVICE);
    } finally {
      setIsHouseholdLoading(false);
    }
  };

  const handleHouseholdMembersChange = (updated: HouseholdMember[]) => {
    setHouseholdMembers(updated);
    refreshHouseholdAdvice(telemetry, updated, keysState.geminiKey);
  };

  const handleAdoptHouseholdShift = (memberId: string, shift: ScheduleShift) => {
    const updated = householdMembers.map((m) => {
      if (m.id !== memberId) return m;
      return {
        ...m,
        schedule: m.schedule.map((item) => {
          if (
            item.activity.toLowerCase().includes(shift.activity.toLowerCase()) ||
            shift.activity.toLowerCase().includes(item.activity.toLowerCase())
          ) {
            return {
              ...item,
              time: shift.proposedTime,
              commuteMode: (shift.suggestedMode as any) || item.commuteMode,
            };
          }
          return item;
        }),
      };
    });
    setHouseholdMembers(updated);
    try {
      localStorage.setItem("smogassistant_household_members", JSON.stringify(updated));
    } catch (e) {
      console.warn("Failed to persist updated member schedule:", e);
    }
  };

  const handleUpdateMemberScheduleFromSimulator = (memberId: string, updatedSchedule: any[]) => {
    const updated = householdMembers.map((m) => {
      if (m.id !== memberId) return m;
      return {
        ...m,
        schedule: updatedSchedule,
      };
    });
    setHouseholdMembers(updated);
    try {
      localStorage.setItem("smogassistant_household_members", JSON.stringify(updated));
    } catch (e) {
      console.warn("Failed to persist updated member schedule from simulator:", e);
    }
    refreshHouseholdAdvice(telemetry, updated, keysState.geminiKey);
  };

  // Update API Keys
  const handleUpdateKeys = (newKeys: { geminiKey: string; waqiToken: string; isGeminiValid: boolean; isWaqiValid: boolean }) => {
    setKeysState(newKeys);
    try {
      localStorage.setItem("smogassistant_gemini_key", newKeys.geminiKey);
      localStorage.setItem("smogassistant_waqi_token", newKeys.waqiToken);
      localStorage.setItem("smogassistant_gemini_valid", String(newKeys.isGeminiValid));
      localStorage.setItem("smogassistant_waqi_valid", String(newKeys.isWaqiValid));
    } catch (e) {
      console.warn("Failed to persist keys to localStorage:", e);
    }

    // Refresh recommendations with new key if valid
    refreshRecommendations(telemetry, context, newKeys.geminiKey);
    refreshHouseholdAdvice(telemetry, householdMembers, newKeys.geminiKey);
  };

  // Scenario Selection
  const handleSelectScenario = async (id: string | null) => {
    setActiveScenarioId(id);
    setIsLoading(true);

    if (id) {
      const preset = SCENARIO_PRESETS.find((p) => p.id === id);
      if (preset) {
        setTelemetry(preset.telemetry);
        await refreshRecommendations(preset.telemetry, context);
        await refreshHouseholdAdvice(preset.telemetry, householdMembers);
      }
    } else {
      // Live API mode for current location / default city
      try {
        const res = await fetch(
          `/api/aqi?city=${encodeURIComponent(context.city || "New Delhi")}`,
          {
            headers: keysState.waqiToken ? { "x-waqi-token": keysState.waqiToken } : {},
          }
        );
        if (res.ok) {
          const data = await res.json();
          if (data.telemetry) {
            setTelemetry(data.telemetry);
            await refreshRecommendations(data.telemetry, context);
            await refreshHouseholdAdvice(data.telemetry, householdMembers);
          }
        }
      } catch (err) {
        console.error("Live fetch failed:", err);
      }
    }
    setIsLoading(false);
  };

  // Custom Location Selected from Search Bar
  const handleSelectLocation = async (lat: number, lon: number, name: string) => {
    setActiveScenarioId(null);
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/aqi?lat=${lat}&lon=${lon}&city=${encodeURIComponent(name)}`,
        {
          headers: keysState.waqiToken ? { "x-waqi-token": keysState.waqiToken } : {},
        }
      );
      if (res.ok) {
        const data = await res.json();
        if (data.telemetry) {
          setTelemetry(data.telemetry);
          const updatedContext = { ...context, city: name };
          setContext(updatedContext);
          await refreshRecommendations(data.telemetry, updatedContext);
          await refreshHouseholdAdvice(data.telemetry, householdMembers);
        }
      }
    } catch (err) {
      console.error("Failed to fetch location data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Profile Management Handlers
  const handleSaveContext = async (updated: UserContextProfile) => {
    setContext(updated);
    await refreshRecommendations(telemetry, updated);
  };

  const handleSaveNewProfile = (name: string, updatedContext: UserContextProfile) => {
    const newProfile: SavedProfile = {
      id: `profile-${Date.now()}`,
      name: name,
      savedAt: new Date().toISOString(),
      context: updatedContext,
    };
    const nextProfiles = [newProfile, ...savedProfiles.filter((p) => p.name !== name)];
    setSavedProfiles(nextProfiles);
    setContext(updatedContext);
    try {
      localStorage.setItem("smogassistant_saved_profiles", JSON.stringify(nextProfiles));
    } catch (e) {
      console.warn("Failed to persist profiles:", e);
    }
    refreshRecommendations(telemetry, updatedContext);
  };

  const handleSelectSavedProfile = (profile: SavedProfile) => {
    setContext(profile.context);
    refreshRecommendations(telemetry, profile.context);
  };

  const handleDeleteSavedProfile = (id: string) => {
    const nextProfiles = savedProfiles.filter((p) => p.id !== id);
    setSavedProfiles(nextProfiles);
    try {
      localStorage.setItem("smogassistant_saved_profiles", JSON.stringify(nextProfiles));
    } catch (e) {
      console.warn("Failed to persist profiles:", e);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header
        onOpenNotifications={handleToggleNotifications}
        hasNotificationsEnabled={hasNotificationsEnabled}
        onOpenKeyModal={() => setIsKeyModalOpen(true)}
        isGeminiValid={keysState.isGeminiValid}
        isWaqiValid={keysState.isWaqiValid}
        activeProfileName={context.profileName}
        onOpenProfiler={() => setIsProfilerOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Judge Benchmark Presets */}
        <ScenarioSwitcher
          activeScenarioId={activeScenarioId}
          onSelectScenario={handleSelectScenario}
          isLoading={isLoading}
        />

        {/* Location Search Bar & Household Context Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <CitySearchBar
            currentCity={telemetry.location.city}
            onSelectLocation={handleSelectLocation}
            isLoading={isLoading}
          />

          <div className="flex items-center space-x-2 flex-wrap">
            {/* Quick Profile Selector Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsProfilerOpen(true)}
                className="inline-flex items-center justify-center px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-xs transition-colors"
                title="Manage Personalized Profiles"
              >
                <Bookmark className="w-3.5 h-3.5 mr-1.5 text-indigo-600" />
                <span className="max-w-[140px] sm:max-w-[180px] truncate">
                  {context.profileName || "Personal Profile"}
                </span>
                <ChevronDown className="w-3 h-3 ml-1 text-slate-400" />
                {context.hasAsthmaOrRespiratory && (
                  <span className="ml-1.5 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                )}
              </button>
            </div>

            {/* API Key Manager Button */}
            <button
              onClick={() => setIsKeyModalOpen(true)}
              className={`p-2.5 rounded-xl border text-xs font-bold transition-colors ${
                keysState.isGeminiValid || keysState.isWaqiValid
                  ? "border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                  : "border-slate-300 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900"
              }`}
              title="API Key Settings (Gemini & WAQI)"
            >
              <Key className="w-4 h-4 text-indigo-600" />
            </button>

            {/* Refresh AI Synthesis */}
            <button
              onClick={() => refreshRecommendations(telemetry, context)}
              disabled={isLoading}
              title="Refresh AI synthesis"
              className="p-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-emerald-600" : ""}`} />
            </button>
          </div>
        </div>

        {/* Feature Unlocked Notification Banner */}
        {isMounted && (keysState.isGeminiValid || keysState.isWaqiValid) && (
          <div className="bg-gradient-to-r from-emerald-50 to-indigo-50 border border-emerald-200 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span className="text-slate-700 font-medium">
                Live Features Activated:{" "}
                {keysState.isGeminiValid && (
                  <strong className="text-indigo-800 mr-2">✓ Gemini 3.x/2.5 Multi-Model Waterfall Active</strong>
                )}
                {keysState.isWaqiValid && (
                  <strong className="text-emerald-800">✓ AQICN Map Heatmap Tiles & Sensors</strong>
                )}
              </span>
            </div>
            <button
              onClick={() => setIsKeyModalOpen(true)}
              className="text-[11px] font-bold text-indigo-700 hover:underline"
            >
              Manage Keys
            </button>
          </div>
        )}

        {/* Real-Time Telemetry & Pollutant Profile */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-12">
            <LiveTelemetryCard 
              telemetry={telemetry} 
              isLoading={isLoading} 
              isWaqiActive={keysState.isWaqiValid}
            />
          </div>
          <div className="lg:col-span-12">
            <PollutantGrid telemetry={telemetry} />
          </div>
        </div>

        {/* AQICN / WAQI Geospatial Map Integration */}
        <div className="w-full">
          <AqiMapView
            telemetry={telemetry}
            waqiToken={keysState.waqiToken}
            isWaqiActive={keysState.isWaqiValid}
            onOpenKeyModal={() => setIsKeyModalOpen(true)}
          />
        </div>

        {/* Proactive Morning Briefing (Up-Ahead Plan) */}
        <MorningBriefingCard
          briefing={recommendations.morningBriefing}
          cityName={telemetry.location.city}
        />

        {/* Task 1: Synchronized Dual-Level Household Strategy & Personalized Precautions */}
        <HouseholdAdviceCard
          advice={householdAdvice}
          currentAqi={telemetry.overallAqi}
          isLoading={isHouseholdLoading}
          onRefreshAdvice={() => refreshHouseholdAdvice(telemetry, householdMembers, keysState.geminiKey)}
          onApplyShift={handleAdoptHouseholdShift}
        />

        {/* Task 1: Multi-Member Household Health & Schedule Profiler */}
        <HouseholdScheduleManager
          initialMembers={householdMembers}
          onMembersChange={handleHouseholdMembersChange}
        />

        {/* Task 3: Interactive Decision & Climate Consequence Simulator */}
        <DecisionSimulator
          currentAqi={telemetry.overallAqi}
          ambientPm25={telemetry.pollutants.pm25.value}
          householdMembers={householdMembers}
          onUpdateMemberSchedule={handleUpdateMemberScheduleFromSimulator}
        />

        {/* Interactive GenAI Copilot Advisory (Unlocked with Gemini Key) */}
        <GeminiCopilotChat
          telemetry={telemetry}
          context={context}
          geminiKey={keysState.geminiKey}
          isGeminiValid={keysState.isGeminiValid}
          onOpenKeyModal={() => setIsKeyModalOpen(true)}
        />

        {/* Vulnerable Alerts Banner */}
        <VulnerableAlertsBanner alerts={recommendations.vulnerableAlerts} />

        {/* Daily Routine Schedule Optimizer */}
        <DailyRoutinePlanner routinePlan={recommendations.dailyRoutinePlan} />

        {/* Sustainable Commute & Offset Justifier */}
        <SustainableTransitComparator commute={recommendations.sustainableCommute} />

        {/* Indoor Phytoremediation & NASA Plants Guide */}
        <IndoorMitigationGuide
          indoorMitigation={recommendations.indoorMitigation}
          initialRoomSqFt={context.roomAreaSqFt}
        />

        {/* Engine Metadata Badge */}
        <div className="bg-slate-100 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2 border border-slate-200">
          <div className="flex items-center space-x-2">
            <Cpu className="w-4 h-4 text-emerald-600" />
            <span>
              Recommendation Engine:{" "}
              <strong className="text-slate-800">
                {recommendations.meta.engine === "gemini-genai" 
                  ? "Google Gemini 3.x / 2.5 Multi-Model Waterfall (GenAI Live)" 
                  : "Deterministic Heuristic Engine (100% Offline-Resilient)"}
              </strong>
            </span>
          </div>
          <div className="flex items-center space-x-1.5 text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Telemetry validated against CPCB & Copernicus CAMS Standards</span>
          </div>
        </div>
      </main>

      {/* Household Context Profiler Modal with Saved Profiles */}
      <ContextProfiler
        currentContext={context}
        isOpen={isProfilerOpen}
        onClose={() => setIsProfilerOpen(false)}
        onSaveContext={handleSaveContext}
        savedProfiles={savedProfiles}
        onSaveNewProfile={handleSaveNewProfile}
        onSelectSavedProfile={handleSelectSavedProfile}
        onDeleteProfile={handleDeleteSavedProfile}
      />

      {/* API Key Authentication Modal */}
      <ApiKeyModal
        isOpen={isKeyModalOpen}
        onClose={() => setIsKeyModalOpen(false)}
        keysState={keysState}
        onUpdateKeys={handleUpdateKeys}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>SmogAssistant © 2026 • AI-Powered Urban Pollution & Winter Smog Defense</span>
          <span className="text-[11px] text-slate-400">
            Built with Next.js 15, TypeScript, TailwindCSS, Open-Meteo, Leaflet, AQICN & Google Gemini
          </span>
        </div>
      </footer>
    </div>
  );
}
