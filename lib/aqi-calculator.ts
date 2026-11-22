import { CpcbCategory } from "@/types/aqi";

interface Breakpoint {
  cLow: number;
  cHigh: number;
  iLow: number;
  iHigh: number;
}

const PM25_BREAKPOINTS: Breakpoint[] = [
  { cLow: 0, cHigh: 30, iLow: 0, iHigh: 50 },
  { cLow: 30.1, cHigh: 60, iLow: 51, iHigh: 100 },
  { cLow: 60.1, cHigh: 90, iLow: 101, iHigh: 200 },
  { cLow: 90.1, cHigh: 120, iLow: 201, iHigh: 300 },
  { cLow: 120.1, cHigh: 250, iLow: 301, iHigh: 400 },
  { cLow: 250.1, cHigh: 500, iLow: 401, iHigh: 500 },
];

const PM10_BREAKPOINTS: Breakpoint[] = [
  { cLow: 0, cHigh: 50, iLow: 0, iHigh: 50 },
  { cLow: 50.1, cHigh: 100, iLow: 51, iHigh: 100 },
  { cLow: 100.1, cHigh: 250, iLow: 101, iHigh: 200 },
  { cLow: 250.1, cHigh: 350, iLow: 201, iHigh: 300 },
  { cLow: 350.1, cHigh: 430, iLow: 301, iHigh: 400 },
  { cLow: 430.1, cHigh: 600, iLow: 401, iHigh: 500 },
];

export function calculateSubIndex(concentration: number, breakpoints: Breakpoint[]): number {
  if (concentration <= 0) return 0;
  
  for (const bp of breakpoints) {
    if (concentration >= bp.cLow && concentration <= bp.cHigh) {
      const sub = ((bp.iHigh - bp.iLow) / (bp.cHigh - bp.cLow)) * (concentration - bp.cLow) + bp.iLow;
      return Math.round(sub);
    }
  }

  // Above max breakpoint
  const highest = breakpoints[breakpoints.length - 1];
  if (concentration > highest.cHigh) {
    const overflow = Math.round(highest.iHigh + (concentration - highest.cHigh) * 0.5);
    return Math.min(overflow, 999);
  }

  return 0;
}

export function calculatePm25SubIndex(pm25: number): number {
  return calculateSubIndex(pm25, PM25_BREAKPOINTS);
}

export function calculatePm10SubIndex(pm10: number): number {
  return calculateSubIndex(pm10, PM10_BREAKPOINTS);
}

export function getCpcbCategory(aqi: number): CpcbCategory {
  if (aqi <= 50) return "Good";
  if (aqi <= 100) return "Satisfactory";
  if (aqi <= 200) return "Moderate";
  if (aqi <= 300) return "Poor";
  if (aqi <= 400) return "Very Poor";
  return "Severe";
}

export interface CategoryMetadata {
  label: CpcbCategory;
  colorClass: string;
  badgeBg: string;
  badgeText: string;
  hex: string;
  healthImpact: string;
  cpcbRange: string;
}

export function getCategoryMetadata(category: CpcbCategory): CategoryMetadata {
  switch (category) {
    case "Good":
      return {
        label: "Good",
        colorClass: "text-emerald-700 bg-emerald-50 border-emerald-200",
        badgeBg: "bg-emerald-600",
        badgeText: "text-white",
        hex: "#10b981",
        healthImpact: "Minimal impact. Clean, fresh air safe for all outdoor activities.",
        cpcbRange: "0 - 50",
      };
    case "Satisfactory":
      return {
        label: "Satisfactory",
        colorClass: "text-lime-700 bg-lime-50 border-lime-200",
        badgeBg: "bg-lime-600",
        badgeText: "text-white",
        hex: "#84cc16",
        healthImpact: "Minor breathing discomfort to sensitive people.",
        cpcbRange: "51 - 100",
      };
    case "Moderate":
      return {
        label: "Moderate",
        colorClass: "text-amber-800 bg-amber-50 border-amber-300",
        badgeBg: "bg-amber-500",
        badgeText: "text-white",
        hex: "#f59e0b",
        healthImpact: "Breathing discomfort to people with lungs, asthma, and heart diseases.",
        cpcbRange: "101 - 200",
      };
    case "Poor":
      return {
        label: "Poor",
        colorClass: "text-orange-900 bg-orange-50 border-orange-300",
        badgeBg: "bg-orange-500",
        badgeText: "text-white",
        hex: "#f97316",
        healthImpact: "Breathing discomfort to most people on prolonged exposure.",
        cpcbRange: "201 - 300",
      };
    case "Very Poor":
      return {
        label: "Very Poor",
        colorClass: "text-rose-900 bg-rose-50 border-rose-300",
        badgeBg: "bg-rose-600",
        badgeText: "text-white",
        hex: "#ef4444",
        healthImpact: "Respiratory illness on prolonged exposure. Pronounced effect on asthma.",
        cpcbRange: "301 - 400",
      };
    case "Severe":
      return {
        label: "Severe",
        colorClass: "text-red-950 bg-red-100 border-red-400",
        badgeBg: "bg-red-900",
        badgeText: "text-white",
        hex: "#7f1d1d",
        healthImpact: "Affects healthy people and severely impacts those with existing diseases.",
        cpcbRange: "401 - 500+",
      };
  }
}
