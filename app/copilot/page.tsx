"use client";

import React from "react";
import { useAppContext } from "@/context/AppContext";
import { GeminiCopilotChat } from "@/components/GeminiCopilotChat";
import { Sparkles, ShieldAlert, Cpu, Key, ShieldCheck } from "lucide-react";

export default function CopilotPage() {
  const {
    telemetry,
    context,
    keysState,
    setIsKeyModalOpen,
  } = useAppContext();

  return (
    <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-to-br from-indigo-600 to-purple-500 rounded-2xl text-white shadow-sm">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Interactive GenAI Copilot Advisory
              </h1>
              {keysState.isGeminiValid ? (
                <span 
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200"
                  title="Active: gemini-3.6-flash → 3.5-flash → 3.5-flash-lite → 3.1-flash-lite → 2.5-flash"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 mr-1 animate-pulse" />
                  Gemini 3-Series Connected
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                  Deterministic Fallback Active
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Domain-guarded environmental health intelligence with 3-series active waterfall reasoning
            </p>
          </div>
        </div>

        {!keysState.isGeminiValid && (
          <button
            onClick={() => setIsKeyModalOpen(true)}
            className="inline-flex items-center px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-xs"
          >
            <Key className="w-3.5 h-3.5 mr-1.5" />
            Authenticate Gemini Key
          </button>
        )}
      </div>

      {/* Task 2: Interactive GenAI Copilot Chat */}
      <GeminiCopilotChat
        telemetry={telemetry}
        context={context}
        geminiKey={keysState.geminiKey}
        isGeminiValid={keysState.isGeminiValid}
        onOpenKeyModal={() => setIsKeyModalOpen(true)}
      />

      {/* Copilot Engineering Architecture Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 space-y-2">
          <div className="flex items-center space-x-2 text-indigo-700 font-bold text-xs">
            <Cpu className="w-4 h-4" />
            <span>3-Series Fallback Waterfall</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Requests cascade automatically through <code>gemini-3.6-flash</code> &rarr; <code>gemini-3.5-flash</code> &rarr; <code>gemini-3.5-flash-lite</code> &rarr; <code>gemini-3.1-flash-lite</code> &rarr; <code>gemini-2.5-flash</code>, followed by local deterministic heuristics.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 space-y-2">
          <div className="flex items-center space-x-2 text-amber-700 font-bold text-xs">
            <ShieldAlert className="w-4 h-4" />
            <span>Strict Domain Guardrails</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Pre-flight regex checks and system prompt instructions intercept non-environmental queries (coding, recipes, sports), politely redirecting to air safety without consuming API tokens.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 space-y-2">
          <div className="flex items-center space-x-2 text-emerald-700 font-bold text-xs">
            <ShieldCheck className="w-4 h-4" />
            <span>Context Grounding</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Every prompt automatically incorporates your live station AQI ({telemetry.overallAqi}), particulate breakdown ({telemetry.pollutants.pm25.value} µg/m³), and personal profile conditions.
          </p>
        </div>
      </div>
    </main>
  );
}
