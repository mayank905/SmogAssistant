"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Wind, 
  ShieldAlert, 
  Sparkles, 
  Bell, 
  Key, 
  User, 
  LayoutDashboard, 
  Map, 
  Users, 
  Sliders, 
  Leaf 
} from "lucide-react";

interface HeaderProps {
  onOpenNotifications?: () => void;
  hasNotificationsEnabled?: boolean;
  onOpenKeyModal?: () => void;
  isGeminiValid?: boolean;
  isWaqiValid?: boolean;
  activeProfileName?: string;
  onOpenProfiler?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  onOpenNotifications, 
  hasNotificationsEnabled,
  onOpenKeyModal,
  isGeminiValid = false,
  isWaqiValid = false,
  activeProfileName,
  onOpenProfiler,
}) => {
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/map", label: "Live Map", icon: Map },
    { href: "/household", label: "Household Defense", icon: Users },
    { href: "/simulator", label: "Consequence Simulator", icon: Sliders },
    { href: "/copilot", label: "AI Copilot", icon: Sparkles },
    { href: "/mitigation", label: "Indoor & Transit", icon: Leaf },
  ];

  return (
    <header className="border-b border-slate-200 bg-white/95 backdrop-blur sticky top-0 z-40 transition-all shadow-xs">
      {/* Top Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-3 group">
          <div className="p-2 bg-gradient-to-br from-indigo-600 to-emerald-500 rounded-xl shadow-sm text-white group-hover:scale-105 transition-transform">
            <Wind className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg sm:text-xl text-slate-900 tracking-tight">
                SmogAssistant
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800">
                <Sparkles className="w-3 h-3 mr-1" />
                GenAI Copilot
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              Urban Air Quality & Smog Defense System
            </p>
          </div>
        </Link>

        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Active Profile Pill */}
          {activeProfileName && (
            <button
              onClick={onOpenProfiler}
              className="hidden md:inline-flex items-center px-2.5 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 text-indigo-900 text-xs font-semibold transition-colors"
              title="Click to manage personal profiles"
              aria-label={`Active profile: ${activeProfileName}. Click to manage personal profiles`}
            >
              <User className="w-3.5 h-3.5 mr-1 text-indigo-600" />
              <span className="max-w-[120px] lg:max-w-[160px] truncate">{activeProfileName}</span>
            </button>
          )}

          {/* API Keys Configuration Button */}
          {onOpenKeyModal && (
            <button
              onClick={onOpenKeyModal}
              aria-label="Configure Gemini and WAQI API Keys"
              className={`inline-flex items-center px-2.5 py-1.5 text-xs font-bold rounded-xl border transition-all ${
                isGeminiValid && isWaqiValid
                  ? "border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                  : isGeminiValid || isWaqiValid
                  ? "border-indigo-300 bg-indigo-50 text-indigo-800 hover:bg-indigo-100"
                  : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50 shadow-xs"
              }`}
              title="Configure Gemini & WAQI API Keys"
            >
              <Key className="w-3.5 h-3.5 mr-1.5 text-indigo-600" />
              <span className="hidden sm:inline">API Keys</span>
              <div className="flex items-center space-x-1 ml-1.5">
                <span 
                  className={`w-2 h-2 rounded-full ${isGeminiValid ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`} 
                  title={isGeminiValid ? "Gemini Waterfall (3.6 Flash → 3.5 Flash → 3.5 Flash-Lite → 3.1 Flash-Lite → 2.5 Flash)" : "Gemini Not Set"}
                />
                <span 
                  className={`w-2 h-2 rounded-full ${isWaqiValid ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`} 
                  title={isWaqiValid ? "WAQI Map Tiles Active" : "WAQI Not Set"}
                />
              </div>
            </button>
          )}

          {onOpenNotifications && (
            <button
              onClick={onOpenNotifications}
              aria-label={hasNotificationsEnabled ? "Morning briefing notifications are active. Click to toggle" : "Enable daily morning briefing notifications"}
              className={`inline-flex items-center px-2.5 py-1.5 text-xs font-medium rounded-xl border transition-colors ${
                hasNotificationsEnabled 
                  ? "border-emerald-300 bg-emerald-50 text-emerald-700" 
                  : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              }`}
              title="Daily Morning Briefing Alerts"
            >
              <Bell className="w-3.5 h-3.5 sm:mr-1.5" />
              <span className="hidden sm:inline">
                {hasNotificationsEnabled ? "Alerts Active" : "Alerts"}
              </span>
            </button>
          )}

          <div className="flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600 mr-1" />
            <span className="hidden lg:inline">Winter Smog Season Mode</span>
            <span className="lg:hidden">Smog Mode</span>
          </div>
        </div>
      </div>

      {/* Persistent Multi-Page Navigation Bar */}
      <div className="border-t border-slate-100 bg-slate-50/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav aria-label="Main Navigation" className="flex items-center space-x-1 sm:space-x-2 py-2 overflow-x-auto no-scrollbar scroll-smooth">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? "bg-white text-indigo-700 shadow-xs border border-indigo-200"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 border border-transparent"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-indigo-600" : "text-slate-400"}`} />
                  <span>{item.label}</span>
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 ml-1 animate-pulse" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
};
