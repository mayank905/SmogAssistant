"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
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

interface AppContextType {
  isMounted: boolean;
  activeScenarioId: string | null;
  telemetry: AirQualityTelemetry;
  context: UserContextProfile;
  savedProfiles: SavedProfile[];
  keysState: ApiKeysState;
  recommendations: AIRecommendationResponse;
  isLoading: boolean;
  isProfilerOpen: boolean;
  isKeyModalOpen: boolean;
  hasNotificationsEnabled: boolean;
  householdMembers: HouseholdMember[];
  householdAdvice: HouseholdAdviceResponse;
  isHouseholdLoading: boolean;

  // Actions
  setIsProfilerOpen: (open: boolean) => void;
  setIsKeyModalOpen: (open: boolean) => void;
  toggleNotifications: () => void;
  selectScenario: (id: string | null) => Promise<void>;
  selectLocation: (lat: number, lon: number, name: string) => Promise<void>;
  updateKeys: (newKeys: { geminiKey: string; waqiToken: string; isGeminiValid: boolean; isWaqiValid: boolean }) => void;
  saveContext: (updated: UserContextProfile) => Promise<void>;
  saveNewProfile: (name: string, updatedContext: UserContextProfile) => void;
  selectSavedProfile: (profile: SavedProfile) => void;
  deleteSavedProfile: (id: string) => void;
  updateHouseholdMembers: (updated: HouseholdMember[]) => void;
  adoptHouseholdShift: (memberId: string, shift: ScheduleShift) => void;
  updateMemberScheduleFromSimulator: (memberId: string, updatedSchedule: any[]) => void;
  refreshRecommendations: (curTelemetry?: AirQualityTelemetry, curContext?: UserContextProfile, curGeminiKey?: string) => Promise<void>;
  refreshHouseholdAdviceAction: (curTelemetry?: AirQualityTelemetry, curMembers?: HouseholdMember[], curGeminiKey?: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
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

  // Mount effect: load localStorage data safely on client
  useEffect(() => {
    setIsMounted(true);

    if (typeof window !== "undefined" && "Notification" in window) {
      setHasNotificationsEnabled(Notification.permission === "granted");
    }

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

  const toggleNotifications = () => {
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

  const refreshRecommendations = async (
    curTelemetry: AirQualityTelemetry = telemetry, 
    curContext: UserContextProfile = context,
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

  const refreshHouseholdAdviceAction = async (
    curTelemetry: AirQualityTelemetry = telemetry,
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

  const selectScenario = async (id: string | null) => {
    setActiveScenarioId(id);
    setIsLoading(true);

    if (id) {
      const preset = SCENARIO_PRESETS.find((p) => p.id === id);
      if (preset) {
        setTelemetry(preset.telemetry);
        await refreshRecommendations(preset.telemetry, context);
        await refreshHouseholdAdviceAction(preset.telemetry, householdMembers);
      }
    } else {
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
            await refreshHouseholdAdviceAction(data.telemetry, householdMembers);
          }
        }
      } catch (err) {
        console.error("Live fetch failed:", err);
      }
    }
    setIsLoading(false);
  };

  const selectLocation = async (lat: number, lon: number, name: string) => {
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
          await refreshHouseholdAdviceAction(data.telemetry, householdMembers);
        }
      }
    } catch (err) {
      console.error("Failed to fetch location data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const updateHouseholdMembers = (updated: HouseholdMember[]) => {
    setHouseholdMembers(updated);
    try {
      localStorage.setItem("smogassistant_household_members", JSON.stringify(updated));
    } catch (e) {
      console.warn("Failed to persist household members:", e);
    }
    refreshHouseholdAdviceAction(telemetry, updated, keysState.geminiKey);
  };

  const adoptHouseholdShift = (memberId: string, shift: ScheduleShift) => {
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
    refreshHouseholdAdviceAction(telemetry, updated, keysState.geminiKey);
  };

  const updateMemberScheduleFromSimulator = (memberId: string, updatedSchedule: any[]) => {
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
    refreshHouseholdAdviceAction(telemetry, updated, keysState.geminiKey);
  };

  const updateKeys = (newKeys: { geminiKey: string; waqiToken: string; isGeminiValid: boolean; isWaqiValid: boolean }) => {
    setKeysState(newKeys);
    try {
      localStorage.setItem("smogassistant_gemini_key", newKeys.geminiKey);
      localStorage.setItem("smogassistant_waqi_token", newKeys.waqiToken);
      localStorage.setItem("smogassistant_gemini_valid", String(newKeys.isGeminiValid));
      localStorage.setItem("smogassistant_waqi_valid", String(newKeys.isWaqiValid));
    } catch (e) {
      console.warn("Failed to persist keys to localStorage:", e);
    }

    refreshRecommendations(telemetry, context, newKeys.geminiKey);
    refreshHouseholdAdviceAction(telemetry, householdMembers, newKeys.geminiKey);
  };

  const saveContext = async (updated: UserContextProfile) => {
    setContext(updated);
    await refreshRecommendations(telemetry, updated);
  };

  const saveNewProfile = (name: string, updatedContext: UserContextProfile) => {
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

  const selectSavedProfile = (profile: SavedProfile) => {
    setContext(profile.context);
    refreshRecommendations(telemetry, profile.context);
  };

  const deleteSavedProfile = (id: string) => {
    const nextProfiles = savedProfiles.filter((p) => p.id !== id);
    setSavedProfiles(nextProfiles);
    try {
      localStorage.setItem("smogassistant_saved_profiles", JSON.stringify(nextProfiles));
    } catch (e) {
      console.warn("Failed to persist profiles:", e);
    }
  };

  return (
    <AppContext.Provider
      value={{
        isMounted,
        activeScenarioId,
        telemetry,
        context,
        savedProfiles,
        keysState,
        recommendations,
        isLoading,
        isProfilerOpen,
        isKeyModalOpen,
        hasNotificationsEnabled,
        householdMembers,
        householdAdvice,
        isHouseholdLoading,
        setIsProfilerOpen,
        setIsKeyModalOpen,
        toggleNotifications,
        selectScenario,
        selectLocation,
        updateKeys,
        saveContext,
        saveNewProfile,
        selectSavedProfile,
        deleteSavedProfile,
        updateHouseholdMembers,
        adoptHouseholdShift,
        updateMemberScheduleFromSimulator,
        refreshRecommendations,
        refreshHouseholdAdviceAction,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext(): AppContextType {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
}
