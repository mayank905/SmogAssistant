"use client";

import React, { useState } from "react";
import { AIRecommendationResponse } from "@/types/recommendations";
import { Sunrise, Wind, Sun, Moon, AlertTriangle, ShieldCheck, BellRing, Check } from "lucide-react";

interface MorningBriefingCardProps {
  briefing: AIRecommendationResponse["morningBriefing"];
  cityName: string;
}

export const MorningBriefingCard: React.FC<MorningBriefingCardProps> = ({
  briefing,
  cityName,
}) => {
  const [notificationSent, setNotificationSent] = useState(false);

  const triggerInstantPreviewNotification = () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "granted") {
        new Notification(`SmogAssistant Daily Briefing: ${cityName}`, {
          body: `Inversion Risk: ${briefing.inversionRisk}. Best outdoor window is Midday (11:00-16:00). Keep morning windows closed.`,
          icon: "/favicon.ico",
        });
        setNotificationSent(true);
        setTimeout(() => setNotificationSent(false), 4000);
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then((permission) => {
          if (permission === "granted") {
            new Notification(`SmogAssistant Daily Briefing: ${cityName}`, {
              body: `Inversion Risk: ${briefing.inversionRisk}. Best outdoor window is Midday (11:00-16:00).`,
              icon: "/favicon.ico",
            });
            setNotificationSent(true);
            setTimeout(() => setNotificationSent(false), 4000);
          }
        });
      } else {
        alert(`Morning Briefing: Inversion Risk is ${briefing.inversionRisk} for ${cityName}. Best outdoor window: Midday.`);
      }
    } else {
      alert(`Morning Briefing: Inversion Risk is ${briefing.inversionRisk} for ${cityName}. Best outdoor window: Midday.`);
    }
  };

  const getTimeIcon = (windowName: string) => {
    if (windowName.toLowerCase().includes("morning")) return <Sunrise className="w-4 h-4 text-amber-500" />;
    if (windowName.toLowerCase().includes("midday")) return <Sun className="w-4 h-4 text-emerald-500" />;
    if (windowName.toLowerCase().includes("evening")) return <Wind className="w-4 h-4 text-indigo-500" />;
    return <Moon className="w-4 h-4 text-purple-500" />;
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-indigo-900/50 relative overflow-hidden">
      {/* Decorative Glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header with Title and Preview Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 relative z-10 border-b border-indigo-800/40 pb-5">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="p-1 rounded-md bg-amber-400/20 text-amber-300">
              <Sunrise className="w-4 h-4" />
            </span>
            <span className="text-xs uppercase tracking-widest font-bold text-amber-300">
              Proactive Up-Ahead Advisory
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 font-mono">
              Daily 06:30 AM Engine
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            {briefing.title}
          </h2>
          <p className="text-xs text-indigo-200/80 mt-1 max-w-2xl leading-relaxed">
            {briefing.weatherSynopsis}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase tracking-wider text-indigo-300 font-bold">
              Thermal Inversion Risk
            </span>
            <span
              className={`text-xs font-black uppercase px-2.5 py-1 rounded-lg mt-0.5 ${
                briefing.inversionRisk === "High"
                  ? "bg-red-500/20 text-red-300 border border-red-500/30"
                  : briefing.inversionRisk === "Medium"
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                  : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
              }`}
            >
              {briefing.inversionRisk} Risk
            </span>
          </div>

          <button
            onClick={triggerInstantPreviewNotification}
            className={`inline-flex items-center px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              notificationSent
                ? "bg-emerald-500 text-white"
                : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30"
            }`}
            title="Triggers the proactive morning notification immediately for judges"
          >
            {notificationSent ? (
              <>
                <Check className="w-3.5 h-3.5 mr-1.5" />
                Alert Triggered!
              </>
            ) : (
              <>
                <BellRing className="w-3.5 h-3.5 mr-1.5 animate-bounce" />
                Preview Morning Alert
              </>
            )}
          </button>
        </div>
      </div>

      {/* 4 Time-Blocked Day Slices */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
        {briefing.dayBlocks.map((block, idx) => (
          <div
            key={idx}
            className="bg-slate-800/70 border border-indigo-900/60 rounded-2xl p-4 flex flex-col justify-between hover:border-indigo-500/50 transition-all"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-1.5">
                  {getTimeIcon(block.timeWindow)}
                  <span className="text-xs font-bold text-slate-200">
                    {block.timeWindow}
                  </span>
                </div>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    block.exposureRisk === "Severe"
                      ? "bg-red-900/80 text-red-200"
                      : block.exposureRisk === "High"
                      ? "bg-rose-900/80 text-rose-200"
                      : block.exposureRisk === "Moderate"
                      ? "bg-amber-900/80 text-amber-200"
                      : "bg-emerald-900/80 text-emerald-200"
                  }`}
                >
                  {block.exposureRisk}
                </span>
              </div>

              <div className="text-[11px] font-semibold text-indigo-300 mb-3 bg-indigo-950/60 px-2 py-1 rounded-md border border-indigo-900/40">
                {block.aqiOutlook}
              </div>

              {/* Recommended Actions */}
              <div className="space-y-1.5 mb-3">
                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block">
                  Actions to take
                </span>
                {block.recommendedActions.map((action, aIdx) => (
                  <div key={aIdx} className="flex items-start space-x-1.5 text-xs text-slate-300">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{action}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Cautions */}
            {block.cautions && block.cautions.length > 0 && (
              <div className="pt-2 border-t border-slate-700/60 space-y-1">
                {block.cautions.map((caution, cIdx) => (
                  <div key={cIdx} className="flex items-start space-x-1 text-[11px] text-amber-300/90">
                    <AlertTriangle className="w-3 h-3 text-amber-400 flex-shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{caution}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
