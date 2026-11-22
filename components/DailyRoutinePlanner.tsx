import React from "react";
import { ActivityReschedule } from "@/types/recommendations";
import { CalendarCheck, ArrowRight, Clock, ShieldCheck } from "lucide-react";

interface DailyRoutinePlannerProps {
  routinePlan: ActivityReschedule[];
}

export const DailyRoutinePlanner: React.FC<DailyRoutinePlannerProps> = ({
  routinePlan,
}) => {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
      <div className="border-b border-slate-100 pb-5">
        <div className="flex items-center space-x-2 mb-1">
          <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
            <CalendarCheck className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-700">
            Dynamic Schedule Optimization
          </span>
        </div>
        <h3 className="text-xl font-black text-slate-900 tracking-tight">
          Low-Emission & Safe Exposure Daily Routines
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Intelligently shifts high-exposure habits into safe meteorological windows
        </p>
      </div>

      <div className="space-y-3">
        {routinePlan.map((item, idx) => (
          <div
            key={idx}
            className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-slate-50/40 hover:bg-white hover:border-indigo-300 hover:shadow-xs transition-all"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <span className="font-extrabold text-sm text-slate-900">
                {item.activity}
              </span>
              <span className="inline-flex items-center text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 w-fit">
                <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                -{item.exposureReductionPct}% Exposure Reduction
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-11 gap-2 items-center mb-3 text-xs">
              <div className="sm:col-span-5 bg-white p-2.5 rounded-xl border border-slate-200 flex items-center space-x-2">
                <Clock className="w-4 h-4 text-rose-500 flex-shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Standard Timing</span>
                  <span className="font-bold text-slate-700">{item.originalTiming}</span>
                </div>
              </div>

              <div className="sm:col-span-1 flex justify-center">
                <ArrowRight className="w-4 h-4 text-indigo-400 rotate-90 sm:rotate-0" />
              </div>

              <div className="sm:col-span-5 bg-indigo-50/70 p-2.5 rounded-xl border border-indigo-200 flex items-center space-x-2">
                <Clock className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <div>
                  <span className="text-[10px] text-indigo-600 block uppercase font-bold">AI Optimized Timing</span>
                  <span className="font-bold text-indigo-950">{item.optimizedTiming}</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-medium bg-white p-3 rounded-xl border border-slate-100">
              <span className="font-bold text-slate-800">Scientific Rationale: </span>
              {item.justification}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
