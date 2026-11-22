"use client";

import React, { ReactNode } from "react";
import { Header } from "@/components/Header";
import { ContextProfiler } from "@/components/ContextProfiler";
import { ApiKeyModal } from "@/components/ApiKeyModal";
import { useAppContext } from "@/context/AppContext";

export function AppShell({ children }: { children: ReactNode }) {
  const {
    isMounted,
    context,
    keysState,
    isProfilerOpen,
    isKeyModalOpen,
    hasNotificationsEnabled,
    savedProfiles,
    setIsProfilerOpen,
    setIsKeyModalOpen,
    toggleNotifications,
    updateKeys,
    saveContext,
    saveNewProfile,
    selectSavedProfile,
    deleteSavedProfile,
  } = useAppContext();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Universal Header with Navigation Across All Pages */}
      <Header
        onOpenNotifications={toggleNotifications}
        hasNotificationsEnabled={hasNotificationsEnabled}
        onOpenKeyModal={() => setIsKeyModalOpen(true)}
        isGeminiValid={keysState.isGeminiValid}
        isWaqiValid={keysState.isWaqiValid}
        activeProfileName={context.profileName}
        onOpenProfiler={() => setIsProfilerOpen(true)}
      />

      {/* Main Page Content */}
      <div className="flex-1 flex flex-col">
        {children}
      </div>

      {/* Global Household Context Profiler Modal */}
      <ContextProfiler
        currentContext={context}
        isOpen={isProfilerOpen}
        onClose={() => setIsProfilerOpen(false)}
        onSaveContext={saveContext}
        savedProfiles={savedProfiles}
        onSaveNewProfile={saveNewProfile}
        onSelectSavedProfile={selectSavedProfile}
        onDeleteProfile={deleteSavedProfile}
      />

      {/* Global API Key Authentication Modal */}
      <ApiKeyModal
        isOpen={isKeyModalOpen}
        onClose={() => setIsKeyModalOpen(false)}
        keysState={keysState}
        onUpdateKeys={updateKeys}
      />

      {/* Common Footer Across All Pages */}
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
