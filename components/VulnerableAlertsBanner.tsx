import React from "react";
import { VulnerableAlert } from "@/types/recommendations";
import { AlertCircle, ShieldAlert, HeartPulse, Baby, Users } from "lucide-react";

interface VulnerableAlertsBannerProps {
  alerts: VulnerableAlert[];
}

export const VulnerableAlertsBanner: React.FC<VulnerableAlertsBannerProps> = ({
  alerts,
}) => {
  if (!alerts || alerts.length === 0) return null;

  const getGroupIcon = (group: string) => {
    switch (group) {
      case "Children":
        return <Baby className="w-5 h-5 text-rose-600" />;
      case "Asthmatics":
        return <HeartPulse className="w-5 h-5 text-rose-600" />;
      case "Elderly":
        return <Users className="w-5 h-5 text-rose-600" />;
      default:
        return <ShieldAlert className="w-5 h-5 text-rose-600" />;
    }
  };

  return (
    <div className="space-y-3">
      {alerts.map((alert, idx) => (
        <div
          key={idx}
          className={`p-4 sm:p-5 rounded-2xl border transition-all ${
            alert.severity === "Critical"
              ? "bg-rose-50/90 border-rose-300 text-rose-950 shadow-xs"
              : "bg-amber-50/90 border-amber-300 text-amber-950"
          }`}
        >
          <div className="flex items-start space-x-3.5">
            <div className="p-2 rounded-xl bg-white border border-rose-200 flex-shrink-0 shadow-2xs">
              {getGroupIcon(alert.targetGroup)}
            </div>

            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <span className="text-xs font-black uppercase tracking-wider text-rose-800">
                  {alert.targetGroup} Health Alert
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-600 text-white uppercase">
                  {alert.severity}
                </span>
              </div>

              <p className="text-xs text-rose-900 leading-relaxed font-semibold mb-2">
                {alert.specificWarning}
              </p>

              <div className="bg-white/80 rounded-xl p-2.5 border border-rose-200/80 text-xs text-slate-800 flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-rose-900">Immediate Action: </span>
                  <span>{alert.emergencyAction}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
