import { CommuteMode } from "./context";

export type HouseholdRole = "child" | "parent" | "elderly" | "other";

export interface DayScheduleItem {
  id: string;
  time: string; // e.g. "07:30", "08:00 AM"
  activity: string; // e.g. "School Commute", "Office Transit", "Morning Walk"
  locationName: string; // e.g. "Greenwood Primary School", "Cyber Hub", "Neighborhood Park"
  commuteMode: CommuteMode; // "two-wheeler" | "car-petrol" | "car-ev" | "bus" | "metro" | "bicycle" | "walking"
  durationMinutes: number; // in minutes
  isOutdoor?: boolean;
  distanceKm?: number;
}

export interface HouseholdMember {
  id: string;
  name: string;
  role: HouseholdRole | string;
  age: number;
  healthConditions: string[]; // e.g. ["Asthma", "Allergic Rhinitis"], ["Hypertension"]
  sensitivityLevel?: "low" | "medium" | "high" | "severe";
  schedule: DayScheduleItem[];
  notes?: string;
}

export interface CombinedHouseholdAdvice {
  purifierRuntimeHours: string | number;
  purifierSchedule?: {
    peakHours: string;
    recommendedSpeed: string;
    targetRooms: string[];
    filterLifeTip?: string;
  };
  windowSealing: string;
  ventilationWindows?: string[];
  familyTransitSync: string;
  transitSyncRecommendations?: string[];
  sharedIndoorActions?: string[];
  emergencyPreparedness?: string;
  summary?: string;
}

export interface ScheduleShift {
  activity: string;
  originalTime: string;
  proposedTime: string;
  reason: string;
  exposureReductionPct: number;
  suggestedMode?: CommuteMode | string;
}

export interface MemberPersonalAdvice {
  memberId: string;
  memberName: string;
  role?: string;
  age: number;
  individualRiskScore: number; // 0 - 100
  riskLevel: "Low" | "Moderate" | "High" | "Critical";
  ageSpecificPrecautions: string[];
  maskRecommendation: string;
  scheduleShifts: ScheduleShift[];
  medicalAdvisory?: string;
  activityRestrictions?: string[];
}

export interface HouseholdAdviceResponse {
  combinedStrategy: CombinedHouseholdAdvice;
  memberAdvice: MemberPersonalAdvice[];
  overallRiskSummary: string;
  generatedAt: string;
  meta?: {
    engine?: string;
    aqiLevel?: number;
  };
}

export const INITIAL_HOUSEHOLD_MEMBERS: HouseholdMember[] = [
  {
    id: "member-child-aarav",
    name: "Aarav Sharma",
    role: "child",
    age: 8,
    healthConditions: ["Asthma", "Dust Allergy"],
    sensitivityLevel: "severe",
    notes: "Requires pediatric inhaler spacer; highly vulnerable to morning diesel particulate spikes.",
    schedule: [
      {
        id: "sch-aarav-1",
        time: "07:30 AM",
        activity: "School Bus Commute",
        locationName: "Greenwood Primary School",
        commuteMode: "bus",
        durationMinutes: 40,
        isOutdoor: true,
        distanceKm: 9.5,
      },
      {
        id: "sch-aarav-2",
        time: "11:30 AM",
        activity: "Recess & Outdoor Sports",
        locationName: "School Playground",
        commuteMode: "walking",
        durationMinutes: 45,
        isOutdoor: true,
        distanceKm: 0.5,
      },
      {
        id: "sch-aarav-3",
        time: "02:30 PM",
        activity: "Afternoon Return Bus",
        locationName: "School to Home Route",
        commuteMode: "bus",
        durationMinutes: 40,
        isOutdoor: true,
        distanceKm: 9.5,
      },
    ],
  },
  {
    id: "member-parent-rajesh",
    name: "Rajesh Sharma",
    role: "parent",
    age: 38,
    healthConditions: ["None"],
    sensitivityLevel: "medium",
    notes: "Daily urban commuter; high exposure route across ring road arterial highways.",
    schedule: [
      {
        id: "sch-rajesh-1",
        time: "08:30 AM",
        activity: "Morning Office Commute",
        locationName: "Cyber Hub Tech Park",
        commuteMode: "two-wheeler",
        durationMinutes: 45,
        isOutdoor: true,
        distanceKm: 18.0,
      },
      {
        id: "sch-rajesh-2",
        time: "01:00 PM",
        activity: "Lunch Break & Outdoor Walk",
        locationName: "Commercial Complex Food Court",
        commuteMode: "walking",
        durationMinutes: 30,
        isOutdoor: true,
        distanceKm: 1.2,
      },
      {
        id: "sch-rajesh-3",
        time: "06:30 PM",
        activity: "Evening Return Commute",
        locationName: "Office to Home Expressway",
        commuteMode: "two-wheeler",
        durationMinutes: 55,
        isOutdoor: true,
        distanceKm: 18.0,
      },
    ],
  },
  {
    id: "member-elderly-kamla",
    name: "Kamla Devi",
    role: "elderly",
    age: 68,
    healthConditions: ["Hypertension", "Mild Chronic Bronchitis"],
    sensitivityLevel: "severe",
    notes: "Cold air and winter inversion provoke wheezing and elevated arterial blood pressure.",
    schedule: [
      {
        id: "sch-kamla-1",
        time: "06:15 AM",
        activity: "Early Morning Park Walk & Pranayama",
        locationName: "Sector 14 Public Park",
        commuteMode: "walking",
        durationMinutes: 50,
        isOutdoor: true,
        distanceKm: 1.5,
      },
      {
        id: "sch-kamla-2",
        time: "11:00 AM",
        activity: "Neighborhood Temple Visit",
        locationName: "Sector Temple Complex",
        commuteMode: "walking",
        durationMinutes: 25,
        isOutdoor: true,
        distanceKm: 0.8,
      },
      {
        id: "sch-kamla-3",
        time: "05:00 PM",
        activity: "Evening Grocery & Courtyard Chat",
        locationName: "Local Neighborhood Market",
        commuteMode: "walking",
        durationMinutes: 35,
        isOutdoor: true,
        distanceKm: 1.0,
      },
    ],
  },
];

export const DEFAULT_HOUSEHOLD_ADVICE: HouseholdAdviceResponse = {
  combinedStrategy: {
    purifierRuntimeHours: "16 Hours/Day (Turbo: 06:00-10:00 & 18:00-22:00, Sleep mode overnight)",
    purifierSchedule: {
      peakHours: "06:00-10:00 AM & 18:00-22:00 PM",
      recommendedSpeed: "High / Turbo Mode (CADR > 400 m³/h)",
      targetRooms: ["Children's Bedroom", "Grandparent's Room", "Main Living Area"],
      filterLifeTip: "Pre-vacuum exterior mesh pre-filter weekly to extend HEPA H13 lifespan during winter.",
    },
    windowSealing: "Seal all exterior windows, balcony sliders, and door gaps tightly from 05:00 to 11:00 AM during thermal smog inversion. Brief 15-minute cross-ventilation permitted only between 14:00 - 15:30 PM when surface warming lifts stagnant air.",
    ventilationWindows: ["14:00 - 15:30 PM (Sunlit ventilation only, purifier paused)"],
    familyTransitSync: "Consolidate morning trips: Commuting parent (Rajesh) should escort child (Aarav) via closed AC vehicle (with cabin recirculation) or synchronized Metro route instead of open two-wheeler, avoiding severe particulate inhalation for both.",
    transitSyncRecommendations: [
      "Avoid two-wheeler riding for Rajesh: switch to Delhi Metro or EV carpool during Severe AQI (>350).",
      "Combine Aarav's morning school transit with Rajesh's commute in an enclosed cabin.",
      "Grandparent (Kamla Devi) must remain fully indoors until post-noon thermal dispersion.",
    ],
    sharedIndoorActions: [
      "Run HEPA air purifiers in sleeping quarters 45 minutes prior to bedtime.",
      "Strictly adopt damp micro-fiber mopping; ban dry broom sweeping to avoid resuspending PM10.",
      "Position Snake Plants and Spider Plants in bedrooms to maintain overnight indoor air oxygenation.",
    ],
    emergencyPreparedness: "Prime Aarav's pediatric bronchodilator spacer in his school kit; calibrate Kamla's digital BP monitor and pulse oximeter for daily 8:00 AM and 8:00 PM logs.",
    summary: "Integrated household defense shield: Eliminates open-vehicle exposure during peak morning soot hours, enforces pediatric & geriatric respiratory shielding, and manages continuous indoor air filtration.",
  },
  memberAdvice: [
    {
      memberId: "member-child-aarav",
      memberName: "Aarav Sharma",
      role: "child",
      age: 8,
      individualRiskScore: 94,
      riskLevel: "Critical",
      ageSpecificPrecautions: [
        "Pediatric lung volume ratio creates 50% higher particulate dose per breath than adults.",
        "Ensure school sports and outdoor PE are shifted indoors; request classroom air purification.",
        "Ensure child-sized N95 / KF94 mask with nose-bridge pinch is worn throughout bus transit.",
      ],
      maskRecommendation: "Child-fitting KF94 or small N95 respirator without exhalation valve",
      scheduleShifts: [
        {
          activity: "Recess & Outdoor Sports (11:30 AM)",
          originalTime: "11:30 AM",
          proposedTime: "Indoor Library / Board Games",
          reason: "Midday PM2.5 and ground ozone spikes induce bronchial spasms and coughing episodes in asthmatic children.",
          exposureReductionPct: 80,
        },
        {
          activity: "School Bus Commute (07:30 AM)",
          originalTime: "07:30 AM",
          proposedTime: "07:30 AM (Carpool with AC Recirculation)",
          reason: "Open bus windows on arterial corridors expose young lungs directly to diesel exhaust soot.",
          exposureReductionPct: 62,
          suggestedMode: "car-ev",
        },
      ],
      medicalAdvisory: "Carry rescue Salbutamol inhaler with spacer at all times; use 2 puffs 15 minutes prior to unavoidable outdoor transit if wheezing.",
      activityRestrictions: ["No outdoor sports / running", "No open window bus commuting", "Zero playground recess when AQI > 300"],
    },
    {
      memberId: "member-parent-rajesh",
      memberName: "Rajesh Sharma",
      role: "parent",
      age: 38,
      individualRiskScore: 72,
      riskLevel: "High",
      ageSpecificPrecautions: [
        "Two-wheeler commute produces 4x higher PM2.5 black carbon deposition compared to enclosed transit.",
        "Active cardiovascular exertion in heavy traffic accelerates deep alveoli particle penetration.",
        "Always switch car ventilation to internal recirculation mode when passing congested junctions.",
      ],
      maskRecommendation: "N95 / FFP2 respirator with tight seal (change every 40 hours of commute)",
      scheduleShifts: [
        {
          activity: "Morning Office Commute (08:30 AM via Two-Wheeler)",
          originalTime: "08:30 AM (Two-Wheeler)",
          proposedTime: "08:15 AM (Metro Express / Electric Carpool)",
          reason: "Rapid rail underground transit avoids surface-level toxic diesel fumes and highway gridlock.",
          exposureReductionPct: 75,
          suggestedMode: "metro",
        },
        {
          activity: "Lunch Break Outdoor Walk (01:00 PM)",
          originalTime: "01:00 PM",
          proposedTime: "Indoor Mall / Building Atrium",
          reason: "Minimizes prolonged urban exposure during midday particulate heating.",
          exposureReductionPct: 48,
          suggestedMode: "walking",
        },
      ],
      medicalAdvisory: "Perform sterile saline eye wash and warm saline throat gargle upon returning from highway commute to flush trapped soot.",
      activityRestrictions: ["Avoid motorcycle/scooter commuting during peak rush hours", "No roadside jogs or outdoor lunch walks"],
    },
    {
      memberId: "member-elderly-kamla",
      memberName: "Kamla Devi",
      role: "elderly",
      age: 68,
      individualRiskScore: 91,
      riskLevel: "Critical",
      ageSpecificPrecautions: [
        "Thermal inversion traps ultra-fine particles at chest height during early dawn hours.",
        "Systemic inflammation from inhaled PM2.5 triggers acute arterial hypertension and cardiovascular stress.",
        "Cold dry air worsens bronchoconstriction; keep indoor temperature warm and stable.",
      ],
      maskRecommendation: "High-breathability FFP2 mask if stepping out, or remain in purified indoor shelter",
      scheduleShifts: [
        {
          activity: "Early Morning Park Walk & Pranayama (06:15 AM)",
          originalTime: "06:15 AM (Outdoor Park)",
          proposedTime: "11:30 AM (Purified Indoor Living Room Yoga)",
          reason: "Dawn temperature inversion concentrates ground-level pollutants to peak daily hazardous levels.",
          exposureReductionPct: 88,
        },
        {
          activity: "Neighborhood Temple Visit (11:00 AM)",
          originalTime: "11:00 AM (Walking)",
          proposedTime: "03:00 PM (Filtered Transit or Virtual Darshan)",
          reason: "Avoids roadside dust and heavy ceremonial incense smoke that irritates sensitive bronchial tissues.",
          exposureReductionPct: 65,
          suggestedMode: "car-ev",
        },
      ],
      medicalAdvisory: "Log blood pressure twice daily; ensure emergency COPD inhaler and oxygen saturation monitor are bedside.",
      activityRestrictions: ["Zero outdoor activity between 05:00 AM - 10:30 AM", "Avoid exposure to burning incense, dhoop, or frying fumes"],
    },
  ],
  overallRiskSummary: "Severe meteorological inversion alert: Vulnerable household profile requires immediate transition from open-air transit to synchronized sealed commutes, combined with 16-hour indoor HEPA air filtration.",
  generatedAt: new Date().toISOString(),
  meta: {
    engine: "deterministic-fallback",
    aqiLevel: 412,
  },
};
