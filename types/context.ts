export type CommuteMode = 
  | "two-wheeler" 
  | "car-petrol" 
  | "car-ev" 
  | "bus" 
  | "metro" 
  | "bicycle" 
  | "walking";

export type WorkoutTime = 
  | "early-morning" // 05:00 - 08:00
  | "morning"       // 08:00 - 11:00
  | "afternoon"     // 12:00 - 16:00
  | "evening"       // 17:00 - 20:00
  | "night"         // 20:00 - 23:00
  | "none";

export interface UserContextProfile {
  // Location
  city: string;
  
  // Vulnerabilities
  hasChildren: boolean;
  hasElderly: boolean;
  hasAsthmaOrRespiratory: boolean;
  hasHeartCondition: boolean;
  isPregnant: boolean;

  // Commute & Routine
  primaryCommuteMode: CommuteMode;
  commuteDurationMinutes: number;
  workoutPreference: WorkoutTime;
  workoutType: "outdoor" | "indoor" | "none";

  // Home environment
  hasAirPurifier: boolean;
  roomAreaSqFt: number;
  hasIndoorPlants: boolean;
  canSealWindows: boolean;
}

export const DEFAULT_USER_CONTEXT: UserContextProfile = {
  city: "New Delhi",
  hasChildren: true,
  hasElderly: true,
  hasAsthmaOrRespiratory: true,
  hasHeartCondition: false,
  isPregnant: false,
  primaryCommuteMode: "two-wheeler",
  commuteDurationMinutes: 35,
  workoutPreference: "early-morning",
  workoutType: "outdoor",
  hasAirPurifier: false,
  roomAreaSqFt: 250,
  hasIndoorPlants: false,
  canSealWindows: true,
};
