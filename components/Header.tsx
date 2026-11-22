import React from "react";
import { Wind, ShieldAlert, Sparkles, Bell } from "lucide-react";

interface HeaderProps {
  onOpenNotifications?: () => void;
  hasNotificationsEnabled?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ 
  onOpenNotifications, 
  hasNotificationsEnabled 
}) => {
  return (
    <header className="border-b border-slate-200 bg-white/95 backdrop-blur sticky top-0 z-40 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-br from-indigo-600 to-emerald-500 rounded-xl shadow-sm text-white">
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
        </div>

        <div className="flex items-center space-x-3">
          {onOpenNotifications && (
            <button
              onClick={onOpenNotifications}
              className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                hasNotificationsEnabled 
                  ? "border-emerald-300 bg-emerald-50 text-emerald-700" 
                  : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              }`}
              title="Daily Morning Briefing Alerts"
            >
              <Bell className="w-3.5 h-3.5 mr-1.5" />
              <span className="hidden sm:inline">
                {hasNotificationsEnabled ? "Alerts Active" : "Enable Morning Alerts"}
              </span>
            </button>
          )}

          <div className="flex items-center space-x-1 px-2.5 py-1 rounded-md bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600 mr-1" />
            <span className="hidden md:inline">Winter Smog Season Mode</span>
            <span className="md:hidden">Smog Mode</span>
          </div>
        </div>
      </div>
    </header>
  );
};
