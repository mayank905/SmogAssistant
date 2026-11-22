"use client";

import React, { useState } from "react";
import { Key, Sparkles, MapPin, CheckCircle2, AlertCircle, Eye, EyeOff, X, ExternalLink, RefreshCw } from "lucide-react";
import { ApiKeysState } from "@/types/auth";

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  keysState: ApiKeysState;
  onUpdateKeys: (newKeys: { geminiKey: string; waqiToken: string; isGeminiValid: boolean; isWaqiValid: boolean }) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  keysState,
  onUpdateKeys,
}) => {
  const [geminiKey, setGeminiKey] = useState(keysState.geminiKey || "");
  const [waqiToken, setWaqiToken] = useState(keysState.waqiToken || "");
  
  const [showGemini, setShowGemini] = useState(false);
  const [showWaqi, setShowWaqi] = useState(false);

  const [isVerifyingGemini, setIsVerifyingGemini] = useState(false);
  const [isVerifyingWaqi, setIsVerifyingWaqi] = useState(false);

  const [geminiStatus, setGeminiStatus] = useState<{ valid: boolean; message: string } | null>(
    keysState.isGeminiValid ? { valid: true, message: "Gemini 1.5 Flash Active" } : null
  );
  const [waqiStatus, setWaqiStatus] = useState<{ valid: boolean; message: string } | null>(
    keysState.isWaqiValid ? { valid: true, message: "WAQI Live Station Feed Active" } : null
  );

  if (!isOpen) return null;

  // Verify Gemini Key
  const handleVerifyGemini = async () => {
    setIsVerifyingGemini(true);
    setGeminiStatus(null);
    try {
      const res = await fetch("/api/auth-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "gemini", geminiKey }),
      });
      const data = await res.json();
      if (data.gemini) {
        setGeminiStatus(data.gemini);
        onUpdateKeys({
          geminiKey,
          waqiToken,
          isGeminiValid: data.gemini.valid,
          isWaqiValid: waqiStatus?.valid ?? keysState.isWaqiValid,
        });
      }
    } catch (err: any) {
      setGeminiStatus({ valid: false, message: "Verification failed. Check network connection." });
    } finally {
      setIsVerifyingGemini(false);
    }
  };

  // Verify WAQI Token
  const handleVerifyWaqi = async () => {
    setIsVerifyingWaqi(true);
    setWaqiStatus(null);
    try {
      const res = await fetch("/api/auth-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "waqi", waqiToken }),
      });
      const data = await res.json();
      if (data.waqi) {
        setWaqiStatus(data.waqi);
        onUpdateKeys({
          geminiKey,
          waqiToken,
          isGeminiValid: geminiStatus?.valid ?? keysState.isGeminiValid,
          isWaqiValid: data.waqi.valid,
        });
      }
    } catch (err: any) {
      setWaqiStatus({ valid: false, message: "Verification failed. Check network connection." });
    } finally {
      setIsVerifyingWaqi(false);
    }
  };

  const handleSaveAndClose = () => {
    onUpdateKeys({
      geminiKey,
      waqiToken,
      isGeminiValid: geminiStatus?.valid ?? keysState.isGeminiValid,
      isWaqiValid: waqiStatus?.valid ?? keysState.isWaqiValid,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200">
        {/* Modal Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur px-6 py-4 border-b border-slate-100 flex items-center justify-between z-10">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">
                API Authentication & Live Feature Unlock
              </h3>
              <p className="text-xs text-slate-500">
                Authenticate your API keys to unlock real-time GenAI and geospatial telemetry
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

        <div className="p-6 space-y-6">
          {/* Information Notice */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs text-slate-600 leading-relaxed">
            <p>
              SmogAssistant is designed with <strong>100% offline resilience</strong> and runs deterministic heuristic models by default. Connecting your authentic developer keys unlocks live Google Gemini Copilot analysis and AQICN.org live map tile overlays. Keys are stored locally in your browser.
            </p>
          </div>

          {/* 1. Google Gemini API Key Section */}
          <div className="border border-slate-200 rounded-2xl p-5 bg-white space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    Google Gemini API Key
                  </h4>
                  <p className="text-xs text-slate-500">
                    Powers Gemini 1.5 Flash Copilot reasoning and custom chat
                  </p>
                </div>
              </div>

              {geminiStatus ? (
                geminiStatus.valid ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                    Verified & Active
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
                    <AlertCircle className="w-3.5 h-3.5 mr-1 text-rose-600" />
                    Invalid Key
                  </span>
                )
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                  Not Authenticated
                </span>
              )}
            </div>

            <div className="space-y-2">
              <div className="relative flex items-center">
                <input
                  type={showGemini ? "text" : "password"}
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full px-3.5 py-2.5 pr-20 text-xs font-mono rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
                />
                <div className="absolute right-2 flex items-center space-x-1">
                  <button
                    type="button"
                    onClick={() => setShowGemini(!showGemini)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded"
                    title={showGemini ? "Hide key" : "Show key"}
                  >
                    {showGemini ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={handleVerifyGemini}
                    disabled={isVerifyingGemini || !geminiKey.trim()}
                    className="px-2.5 py-1 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 transition-colors shadow-xs"
                  >
                    {isVerifyingGemini ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : "Verify"}
                  </button>
                </div>
              </div>

              {geminiStatus && (
                <p className={`text-xs ${geminiStatus.valid ? "text-emerald-700 font-medium" : "text-rose-600"}`}>
                  {geminiStatus.message}
                </p>
              )}

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                <span>Features unlocked: Live LLM Morning Briefings, Interactive Copilot Chat</span>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-indigo-600 hover:underline font-medium"
                >
                  Get Free Key <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              </div>
            </div>
          </div>

          {/* 2. WAQI / AQICN API Token Section */}
          <div className="border border-slate-200 rounded-2xl p-5 bg-white space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    WAQI / AQICN API Token
                  </h4>
                  <p className="text-xs text-slate-500">
                    Unlocks live regional map tile overlays and CPCB ground sensors
                  </p>
                </div>
              </div>

              {waqiStatus ? (
                waqiStatus.valid ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                    Verified & Active
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
                    <AlertCircle className="w-3.5 h-3.5 mr-1 text-rose-600" />
                    Invalid Token
                  </span>
                )
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                  Not Authenticated
                </span>
              )}
            </div>

            <div className="space-y-2">
              <div className="relative flex items-center">
                <input
                  type={showWaqi ? "text" : "password"}
                  value={waqiToken}
                  onChange={(e) => setWaqiToken(e.target.value)}
                  placeholder="e.g. 5a1b3c9d7..."
                  className="w-full px-3.5 py-2.5 pr-20 text-xs font-mono rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
                />
                <div className="absolute right-2 flex items-center space-x-1">
                  <button
                    type="button"
                    onClick={() => setShowWaqi(!showWaqi)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded"
                    title={showWaqi ? "Hide token" : "Show token"}
                  >
                    {showWaqi ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={handleVerifyWaqi}
                    disabled={isVerifyingWaqi || !waqiToken.trim()}
                    className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 transition-colors shadow-xs"
                  >
                    {isVerifyingWaqi ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : "Verify"}
                  </button>
                </div>
              </div>

              {waqiStatus && (
                <p className={`text-xs ${waqiStatus.valid ? "text-emerald-700 font-medium" : "text-rose-600"}`}>
                  {waqiStatus.message}
                </p>
              )}

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                <span>Features unlocked: AQICN Live Tiles (PM2.5, PM10, NO2), CPCB Ground Station Feeds</span>
                <a
                  href="https://aqicn.org/data-platform/token/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-emerald-600 hover:underline font-medium"
                >
                  Get Free Token <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveAndClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md transition-colors"
          >
            Save & Activate Features
          </button>
        </div>
      </div>
    </div>
  );
};
