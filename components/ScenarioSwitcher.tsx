import React from "react";
import { SCENARIO_PRESETS } from "@/lib/api/scenario-presets";
import { Sliders, Zap } from "lucide-react";

interface ScenarioSwitcherProps {
  activeScenarioId: string | null;
  onSelectScenario: (id: string | null) => void;
  isLoading?: boolean;
}

export const ScenarioSwitcher: React.FC<ScenarioSwitcherProps> = ({
  activeScenarioId,
  onSelectScenario,
  isLoading,
}) => {
  return (
    <div className="bg-slate-900 text-slate-100 rounded-2xl p-4 shadow-sm border border-slate-800">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold tracking-wide flex items-center gap-1.5">
              <span>Evaluator Benchmark Presets</span>
              <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/30 text-indigo-300 font-mono">
                Judge Fast-Track
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Instantly toggle between real-world winter smog extremes to test GenAI response dynamics.
            </p>
          </div>
        </div>

        <button
          onClick={() => onSelectScenario(null)}
          disabled={isLoading}
          className={`inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeScenarioId === null
              ? "bg-emerald-500 text-white shadow-sm ring-2 ring-emerald-400/30"
              : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
          }`}
        >
          <Zap className="w-3.5 h-3.5 mr-1 text-emerald-300" />
          Live GPS / Search API
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        {SCENARIO_PRESETS.map((preset) => {
          const isSelected = activeScenarioId === preset.id;
          return (
            <button
              key={preset.id}
              onClick={() => onSelectScenario(preset.id)}
              disabled={isLoading}
              className={`p-2.5 rounded-xl text-left border transition-all relative overflow-hidden ${
                isSelected
                  ? "bg-indigo-950/70 border-indigo-500 ring-2 ring-indigo-500/30"
                  : "bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold truncate text-slate-200">
                  {preset.title}
                </span>
                <span
                  className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${
                    preset.category === "Severe"
                      ? "bg-red-900/80 text-red-200"
                      : preset.category === "Very Poor"
                      ? "bg-rose-900/80 text-rose-200"
                      : preset.category === "Moderate"
                      ? "bg-amber-900/80 text-amber-200"
                      : "bg-emerald-900/80 text-emerald-200"
                  }`}
                >
                  AQI {preset.aqi}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-2">
                {preset.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
