import { CpcbCategory } from "./aqi";

export interface PlantMitigation {
  name: string;
  botanicalName: string;
  countNeeded: number;
  targetedPollutants: string[];
  careDifficulty: "Easy" | "Moderate";
  placementTip: string;
}

export interface DayBlock {
  timeWindow: string; // e.g. "Morning (06:00 - 11:00)"
  aqiOutlook: string;
  exposureRisk: "Low" | "Moderate" | "High" | "Severe";
  recommendedActions: string[];
  cautions: string[];
}

export interface ActivityReschedule {
  activity: string;
  originalTiming: string;
  optimizedTiming: string;
  justification: string;
  exposureReductionPct: number;
}

export interface VulnerableAlert {
  targetGroup: "Children" | "Elderly" | "Asthmatics" | "Pregnant" | "General Public";
  severity: "Warning" | "Critical";
  specificWarning: string;
  emergencyAction: string;
}

export interface AIRecommendationResponse {
  airQualitySummary: {
    headline: string;
    cpcbCategory: CpcbCategory;
    primaryHazard: string;
    healthRiskLevel: "Low" | "Moderate" | "High" | "Critical";
    generalAdvice: string;
  };
  morningBriefing: {
    title: string;
    weatherSynopsis: string;
    inversionRisk: "Low" | "Medium" | "High";
    dayBlocks: DayBlock[];
  };
  dailyRoutinePlan: ActivityReschedule[];
  indoorMitigation: {
    ventilationAdvice: string;
    purifierStrategy: string;
    recommendedPlants: PlantMitigation[];
    diyLowCostHacks: string[];
  };
  sustainableCommute: {
    currentMode: string;
    suggestedMode: string;
    pm25InhalationSavedPct: number;
    estimatedCo2SavedKg: number;
    actionableAdvice: string;
    impactJustification: string;
  };
  vulnerableAlerts: VulnerableAlert[];
  meta: {
    generatedAt: string;
    engine: "gemini-genai" | "deterministic-fallback" | string;
    executionTimeMs?: number;
    modelUsed?: string;
  };
}
