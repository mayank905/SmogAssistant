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
  // Profile Meta
  profileName?: string;

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

export interface SavedProfile {
  id: string;
  name: string;
  savedAt: string;
  context: UserContextProfile;
}

export const DEFAULT_USER_CONTEXT: UserContextProfile = {
  profileName: "Default Family Profile",
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

export const INITIAL_SAVED_PROFILES: SavedProfile[] = [
  {
    id: "profile-vulnerable-family",
    name: "Home (Family with Asthmatic Child & Elderly)",
    savedAt: "2026-11-22T08:00:00.000Z",
    context: {
      profileName: "Home (Family with Asthmatic Child & Elderly)",
      city: "New Delhi",
      hasChildren: true,
      hasElderly: true,
      hasAsthmaOrRespiratory: true,
      hasHeartCondition: false,
      isPregnant: false,
      primaryCommuteMode: "two-wheeler",
      commuteDurationMinutes: 40,
      workoutPreference: "early-morning",
      workoutType: "outdoor",
      hasAirPurifier: false,
      roomAreaSqFt: 250,
      hasIndoorPlants: false,
      canSealWindows: true,
    },
  },
  {
    id: "profile-urban-professional",
    name: "Office Commute (Urban Professional)",
    savedAt: "2026-11-22T08:00:00.000Z",
    context: {
      profileName: "Office Commute (Urban Professional)",
      city: "Gurugram",
      hasChildren: false,
      hasElderly: false,
      hasAsthmaOrRespiratory: false,
      hasHeartCondition: false,
      isPregnant: false,
      primaryCommuteMode: "car-petrol",
      commuteDurationMinutes: 45,
      workoutPreference: "evening",
      workoutType: "indoor",
      hasAirPurifier: true,
      roomAreaSqFt: 400,
      hasIndoorPlants: true,
      canSealWindows: true,
    },
  },
  {
    id: "profile-active-cyclist",
    name: "Fitness / Morning Cyclist",
    savedAt: "2026-11-22T08:00:00.000Z",
    context: {
      profileName: "Fitness / Morning Cyclist",
      city: "Bengaluru",
      hasChildren: false,
      hasElderly: false,
      hasAsthmaOrRespiratory: false,
      hasHeartCondition: false,
      isPregnant: false,
      primaryCommuteMode: "bicycle",
      commuteDurationMinutes: 30,
      workoutPreference: "early-morning",
      workoutType: "outdoor",
      hasAirPurifier: false,
      roomAreaSqFt: 200,
      hasIndoorPlants: true,
      canSealWindows: false,
    },
  },
];
