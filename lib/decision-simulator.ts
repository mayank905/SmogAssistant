import { CommuteMode } from "@/types/context";

export type ActivityIntensity = "resting" | "light" | "moderate" | "vigorous";
export type LocationType = "outdoor" | "transit" | "indoor";

/**
 * Standard adult minute ventilation rates (m3 / minute) based on US EPA Exposure Factors Handbook
 * and respiratory physiology guidelines:
 * - Resting / Sedentary (office, sitting, sleep): ~0.008 m3/min (~0.48 m3/h)
 * - Light activity (casual walking, desk tasks, standing): ~0.014 m3/min (~0.84 m3/h)
 * - Moderate activity (brisk walking, cycling, active commuting): ~0.032 m3/min (~1.92 m3/h)
 * - Vigorous exertion (running, HIIT, heavy endurance workout): ~0.060 m3/min (~3.60 m3/h)
 */
export const BREATHING_RATES_M3_PER_MIN: Record<ActivityIntensity, number> = {
  resting: 0.008,
  light: 0.014,
  moderate: 0.032,
  vigorous: 0.060,
};

/**
 * Micro-environment PM2.5 exposure factors relative to ambient background air (1.0 = baseline ambient):
 * - Walking / Cycling on roads: 1.20 - 1.25 (close proximity to tailpipe plumes, road dust re-suspension)
 * - Two-wheeler: 1.00 (direct tailpipe inhalation in traffic queues)
 * - Bus: 0.70 (elevated passenger cabin, partial ventilation)
 * - Petrol/Diesel Car: 0.45 (closed cabin with basic cabin air filtration / AC recirculation)
 * - EV Car: 0.40 (closed cabin, modern HEPA/active carbon cabin filters)
 * - Metro / Rapid Rail: 0.15 (underground / elevated sealed carriages with centralized multi-stage filtration)
 */
export const COMMUTE_EXPOSURE_FACTORS: Record<CommuteMode, number> = {
  "walking": 1.20,
  "bicycle": 1.25,
  "two-wheeler": 1.00,
  "bus": 0.70,
  "car-petrol": 0.45,
  "car-ev": 0.40,
  "metro": 0.15,
};

/**
 * Baseline exposure factor by location when not in a specific commute mode
 */
export const LOCATION_EXPOSURE_FACTORS: Record<LocationType, number> = {
  outdoor: 1.00,
  transit: 0.75,
  indoor: 0.35, // Typical urban building with sealed windows & moderate infiltration
};

/**
 * Carbon emission factors in grams of CO2 per passenger-kilometer (g CO2 / passenger-km)
 */
export const TRANSIT_EMISSION_FACTORS_G_PER_KM: Record<CommuteMode, number> = {
  "car-petrol": 185,
  "car-ev": 35,
  "two-wheeler": 75,
  "bus": 45,
  "metro": 15,
  "bicycle": 0,
  "walking": 0,
};

/**
 * Certified N95 / FFP2 particulate respirator filtration efficiency against submicron aerosols
 */
export const MASK_FILTRATION_EFFICIENCY = 0.90; // 90% real-world fit efficiency

export interface InhaledPm25Params {
  durationMinutes: number;
  breathingRateM3PerMin?: number;
  intensity?: ActivityIntensity;
  ambientPm25: number;
  exposureFactor?: number;
  commuteMode?: CommuteMode;
  locationType?: LocationType;
  timeOfDay?: string; // "HH:mm" (24h or 12h)
  hasMask?: boolean;
}

export interface ScheduleItemSimulation {
  id: string;
  activity: string;
  startTime: string; // "HH:mm" (e.g. "07:00")
  endTime?: string;
  durationMinutes: number;
  locationType: LocationType;
  commuteMode?: CommuteMode;
  distanceKm?: number;
  intensity?: ActivityIntensity;
  hasMask?: boolean;
  notes?: string;

  // Computed simulation metrics
  inhaledPm25Ug?: number;
  co2EmissionsKg?: number;
  isInversionConflict?: boolean;
}

export interface SimulationMetrics {
  totalInhaledPm25Ug: number;
  totalCo2Kg: number;
  inversionConflictsCount: number;
}

export interface SimulationDeltaMetrics {
  pm25SavedUg: number;
  pm25SavedPct: number;
  co2AbatedKg: number;
  co2SavedPct: number;
  inversionWindowsAvoided: number;
}

export interface SimulationResult {
  baselineSchedule: ScheduleItemSimulation[];
  alternativeSchedule: ScheduleItemSimulation[];
  baselineMetrics: SimulationMetrics;
  alternativeMetrics: SimulationMetrics;
  deltas: SimulationDeltaMetrics;
  impactHighlights: string[];
}

/**
 * Parses a time string (e.g. "07:30", "7:30 AM", "18:45") into minutes since midnight (0 - 1439).
 */
export function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const trimmed = timeStr.trim().toLowerCase();

  const isPm = trimmed.includes("pm");
  const isAm = trimmed.includes("am");

  const cleaned = trimmed.replace(/[a-z]/g, "").trim();
  const parts = cleaned.split(":");
  let hours = parseInt(parts[0], 10) || 0;
  const minutes = parts[1] ? parseInt(parts[1], 10) || 0 : 0;

  if (isPm && hours < 12) hours += 12;
  if (isAm && hours === 12) hours = 0;

  return (hours * 60 + minutes) % 1440;
}

/**
 * Checks whether a given time falls within urban winter thermal inversion stagnation windows:
 * - Morning Inversion Trap: 05:00 - 09:30 (surface radiation cooling + high stagnation)
 * - Evening/Night Inversion Trap: 19:30 - 23:30 (shallow boundary layer formation)
 */
export function isInversionWindow(timeStr: string): boolean {
  const mins = parseTimeToMinutes(timeStr);
  const morningStart = 5 * 60; // 05:00
  const morningEnd = 9 * 60 + 30; // 09:30

  const eveningStart = 19 * 60 + 30; // 19:30
  const eveningEnd = 23 * 60 + 30; // 23:30

  return (mins >= morningStart && mins <= morningEnd) || (mins >= eveningStart && mins <= eveningEnd);
}

/**
 * Atmospheric diurnal inversion multiplier:
 * Ground-level PM2.5 concentrations fluctuate sharply due to planetary boundary layer (PBL) height.
 * - Dawn/Morning Inversion: 1.40x of 24h mean
 * - Late Evening Inversion: 1.25x of 24h mean
 * - Midday Solar Convection Window (11:30 - 16:30): 0.70x of 24h mean (optimal ventilation)
 * - Intermediate Hours: 1.00x
 */
export function getDiurnalInversionMultiplier(timeStr?: string): number {
  if (!timeStr) return 1.0;
  const mins = parseTimeToMinutes(timeStr);

  // Midday safe dispersion window
  if (mins >= 11 * 60 + 30 && mins <= 16 * 60 + 30) {
    return 0.70;
  }

  // Morning inversion peak
  if (mins >= 5 * 60 && mins <= 9 * 60 + 30) {
    return 1.40;
  }

  // Evening inversion trap
  if (mins >= 19 * 60 + 30 && mins <= 23 * 60 + 30) {
    return 1.25;
  }

  return 1.00;
}

/**
 * Estimates ambient PM2.5 (ug/m3) from CPCB Air Quality Index breakpoints.
 */
export function estimatePm25FromAqi(aqi: number): number {
  if (aqi <= 0) return 0;
  if (aqi <= 50) return Math.round((aqi / 50) * 30);
  if (aqi <= 100) return Math.round(30 + ((aqi - 50) / 50) * 30);
  if (aqi <= 200) return Math.round(60 + ((aqi - 100) / 100) * 30);
  if (aqi <= 300) return Math.round(90 + ((aqi - 200) / 100) * 30);
  if (aqi <= 400) return Math.round(120 + ((aqi - 300) / 100) * 130);
  // Severe / Emergency (>400 AQI)
  return Math.round(250 + ((aqi - 400) / 100) * 150);
}

/**
 * Estimates transit distance (in km) from commute duration and typical urban travel speeds.
 */
export function estimateTransitDistance(mode: CommuteMode, durationMinutes: number): number {
  const speedKmH = mode === "walking" ? 5 : mode === "bicycle" ? 14 : 24;
  const rawDistance = (durationMinutes / 60) * speedKmH;
  return Math.round(rawDistance * 10) / 10;
}

/**
 * Calculates personal inhaled PM2.5 in micrograms (ug):
 * Inhaled (ug) = Ambient PM2.5 (ug/m3) * DiurnalFactor * ExposureFactor * MaskFactor * BreathingRate (m3/min) * Duration (min)
 */
export function calculateInhaledPm25(params: InhaledPm25Params): number {
  const {
    durationMinutes,
    breathingRateM3PerMin,
    intensity = "light",
    ambientPm25,
    exposureFactor,
    commuteMode,
    locationType = "indoor",
    timeOfDay,
    hasMask = false,
  } = params;

  if (durationMinutes <= 0 || ambientPm25 <= 0) {
    return 0;
  }

  // 1. Determine minute breathing volume
  const rate = breathingRateM3PerMin ?? BREATHING_RATES_M3_PER_MIN[intensity] ?? BREATHING_RATES_M3_PER_MIN.light;

  // 2. Determine micro-environment exposure factor
  let baseExposure = exposureFactor;
  if (baseExposure === undefined) {
    if (commuteMode && COMMUTE_EXPOSURE_FACTORS[commuteMode] !== undefined) {
      baseExposure = COMMUTE_EXPOSURE_FACTORS[commuteMode];
    } else {
      baseExposure = LOCATION_EXPOSURE_FACTORS[locationType] ?? LOCATION_EXPOSURE_FACTORS.indoor;
    }
  }

  // 3. Meteorological thermal inversion factor
  const diurnalFactor = getDiurnalInversionMultiplier(timeOfDay);

  // 4. Personal respiratory protection (N95 mask)
  const maskMultiplier = hasMask ? Math.max(0.05, 1 - MASK_FILTRATION_EFFICIENCY) : 1.0;

  // Effective micro-environment concentration
  const effectiveConcentration = ambientPm25 * diurnalFactor * baseExposure * maskMultiplier;

  // Inhaled mass = concentration (ug/m3) * volume inhaled (m3)
  const totalVolumeM3 = rate * durationMinutes;
  const inhaledMicrograms = effectiveConcentration * totalVolumeM3;

  return Math.round(inhaledMicrograms * 100) / 100;
}

/**
 * Calculates trip carbon emissions in kilograms of CO2 (kg CO2):
 * Emissions (kg CO2) = (Distance (km) * Emission Factor (g CO2/km)) / 1000
 */
export function calculateTripCarbonEmissions(mode: CommuteMode, distanceKm: number): number {
  if (distanceKm <= 0) return 0;
  const factor = TRANSIT_EMISSION_FACTORS_G_PER_KM[mode] ?? 0;
  const kg = (factor * distanceKm) / 1000;
  return Math.round(kg * 100) / 100;
}

/**
 * Evaluates an individual schedule activity and populates its simulated metrics:
 * inhaled PM2.5, CO2 emissions, and inversion conflict status.
 */
export function evaluateScheduleItem(
  item: ScheduleItemSimulation,
  ambientPm25: number
): ScheduleItemSimulation {
  const isInversionConflict =
    item.locationType !== "indoor" && isInversionWindow(item.startTime);

  const inhaledPm25Ug = calculateInhaledPm25({
    durationMinutes: item.durationMinutes,
    intensity: item.intensity,
    ambientPm25,
    commuteMode: item.commuteMode,
    locationType: item.locationType,
    timeOfDay: item.startTime,
    hasMask: item.hasMask,
  });

  let co2EmissionsKg = 0;
  if (item.commuteMode) {
    const distance = item.distanceKm ?? estimateTransitDistance(item.commuteMode, item.durationMinutes);
    co2EmissionsKg = calculateTripCarbonEmissions(item.commuteMode, distance);
  }

  return {
    ...item,
    inhaledPm25Ug,
    co2EmissionsKg,
    isInversionConflict,
  };
}

/**
 * Produces an optimized low-exposure & low-emission daily schedule alternative,
 * and computes exact delta metrics:
 * - PM2.5 saved (micrograms & %)
 * - CO2 abated (kg & %)
 * - Inversion windows avoided
 */
export function generateClimateAlternative(
  schedule: ScheduleItemSimulation[],
  currentAqi: number,
  customAmbientPm25?: number
): SimulationResult {
  const ambientPm25 = customAmbientPm25 ?? estimatePm25FromAqi(currentAqi);

  // Evaluate baseline schedule
  const baselineSchedule = schedule.map((item) => evaluateScheduleItem(item, ambientPm25));

  // Generate climate-preserving and health-protective alternative schedule
  const alternativeSchedule: ScheduleItemSimulation[] = baselineSchedule.map((item): ScheduleItemSimulation => {
    const isSevereSmog = currentAqi > 200 || ambientPm25 > 90;
    const isEmergency = currentAqi > 300 || ambientPm25 > 150;
    const inInversion = isInversionWindow(item.startTime);

    // Strategy 1: Outdoor vigorous / moderate activities during inversion
    if (item.locationType === "outdoor" && (item.intensity === "vigorous" || item.intensity === "moderate")) {
      if (inInversion || isSevereSmog) {
        if (isEmergency) {
          // Relocate indoors with purified air
          return {
            ...item,
            id: `${item.id}-alt`,
            activity: `${item.activity} (Indoor Purified Filtered Space)`,
            locationType: "indoor" as LocationType,
            intensity: item.intensity === "vigorous" ? "moderate" : item.intensity,
            hasMask: false,
            notes: "Relocated indoors to eliminate high pulmonary deposition during dangerous smog",
          };
        } else {
          // Shift to optimal solar dispersion window (12:30 or 14:00) with mask
          return {
            ...item,
            id: `${item.id}-alt`,
            activity: `${item.activity} (Midday Solar Mixing Window)`,
            startTime: "13:00",
            endTime: "13:45",
            hasMask: true,
            notes: "Shifted to 13:00 when planetary boundary layer is high and thermal inversion is broken",
          };
        }
      }
    }

    // Strategy 2: High-emission & high-exposure motorized commutes
    if (item.commuteMode === "car-petrol") {
      return {
        ...item,
        id: `${item.id}-alt`,
        activity: `${item.activity} (Metro Rail Transition)`,
        commuteMode: "metro",
        hasMask: isSevereSmog,
        notes: "Shifted from solo petrol vehicle to electrified Metro rail; eliminates tailpipe exhaust and protects in sealed air",
      };
    }

    if (item.commuteMode === "two-wheeler") {
      return {
        ...item,
        id: `${item.id}-alt`,
        activity: `${item.activity} (Metro Rail / Clean EV Transit)`,
        commuteMode: "metro",
        hasMask: isSevereSmog,
        notes: "Shifted from open two-wheeler to filtered Metro rail, slashing street-level diesel soot inhalation",
      };
    }

    // Strategy 3: Active travel (cycling / walking) during severe winter smog
    if ((item.commuteMode === "bicycle" || item.commuteMode === "walking") && isSevereSmog && inInversion) {
      return {
        ...item,
        id: `${item.id}-alt`,
        activity: `${item.activity} (Sealed Metro Rail with N95)`,
        commuteMode: "metro",
        hasMask: true,
        notes: "During peak inversion, high aerobic breathing outdoors causes deep lung particle loading; metro preserves health",
      };
    }

    // Strategy 4: Outdoor errands during morning / evening inversion
    if (item.locationType === "outdoor" && inInversion) {
      return {
        ...item,
        id: `${item.id}-alt`,
        activity: `${item.activity} (Midday Low-Exposure Window)`,
        startTime: "14:30",
        endTime: "15:15",
        hasMask: true,
        notes: "Shifted out of nocturnal stagnation zone into clean midday dispersion window with N95 protection",
      };
    }

    // Strategy 5: Unprotected transit in severe smog
    if (item.locationType === "transit" && !item.hasMask && isSevereSmog) {
      return {
        ...item,
        id: `${item.id}-alt`,
        hasMask: true,
        notes: "Equipped certified N95 particulate respirator for transit segment",
      };
    }

    // Default: already sound or low impact
    return {
      ...item,
      id: `${item.id}-alt`,
      notes: item.notes || "Maintained optimal low-impact schedule",
    };
  }).map((altItem) => evaluateScheduleItem(altItem, ambientPm25));

  // Compute aggregate metrics
  const baselineMetrics: SimulationMetrics = {
    totalInhaledPm25Ug: Math.round(baselineSchedule.reduce((acc, it) => acc + (it.inhaledPm25Ug || 0), 0) * 100) / 100,
    totalCo2Kg: Math.round(baselineSchedule.reduce((acc, it) => acc + (it.co2EmissionsKg || 0), 0) * 100) / 100,
    inversionConflictsCount: baselineSchedule.filter((it) => it.isInversionConflict).length,
  };

  const alternativeMetrics: SimulationMetrics = {
    totalInhaledPm25Ug: Math.round(alternativeSchedule.reduce((acc, it) => acc + (it.inhaledPm25Ug || 0), 0) * 100) / 100,
    totalCo2Kg: Math.round(alternativeSchedule.reduce((acc, it) => acc + (it.co2EmissionsKg || 0), 0) * 100) / 100,
    inversionConflictsCount: alternativeSchedule.filter((it) => it.isInversionConflict).length,
  };

  // Deltas
  const pm25SavedUg = Math.max(0, Math.round((baselineMetrics.totalInhaledPm25Ug - alternativeMetrics.totalInhaledPm25Ug) * 100) / 100);
  const pm25SavedPct = baselineMetrics.totalInhaledPm25Ug > 0
    ? Math.round((pm25SavedUg / baselineMetrics.totalInhaledPm25Ug) * 100)
    : 0;

  const co2AbatedKg = Math.max(0, Math.round((baselineMetrics.totalCo2Kg - alternativeMetrics.totalCo2Kg) * 100) / 100);
  const co2SavedPct = baselineMetrics.totalCo2Kg > 0
    ? Math.round((co2AbatedKg / baselineMetrics.totalCo2Kg) * 100)
    : 0;

  const inversionWindowsAvoided = Math.max(0, baselineMetrics.inversionConflictsCount - alternativeMetrics.inversionConflictsCount);

  // Generate actionable impact highlights
  const impactHighlights: string[] = [];
  if (pm25SavedUg > 0) {
    impactHighlights.push(
      `Saves ${pm25SavedUg.toFixed(1)} µg of fine PM2.5 from deep alveolar deposition (-${pm25SavedPct}% personal dose reduction).`
    );
  }
  if (co2AbatedKg > 0) {
    impactHighlights.push(
      `Abates ${co2AbatedKg.toFixed(2)} kg of CO2 emissions by replacing fossil trips with electrified mass transit.`
    );
  }
  if (inversionWindowsAvoided > 0) {
    impactHighlights.push(
      `Avoids ${inversionWindowsAvoided} dangerous thermal inversion windows where stagnant ground chill traps toxic combustion fumes.`
    );
  }
  if (impactHighlights.length === 0) {
    impactHighlights.push("Current routine is already well-aligned with low-exposure and clean climate practices.");
  }

  return {
    baselineSchedule,
    alternativeSchedule,
    baselineMetrics,
    alternativeMetrics,
    deltas: {
      pm25SavedUg,
      pm25SavedPct,
      co2AbatedKg,
      co2SavedPct,
      inversionWindowsAvoided,
    },
    impactHighlights,
  };
}

/**
 * Default realistic schedule presets for interactive simulation
 */
export const DEFAULT_SIMULATION_SCHEDULE: ScheduleItemSimulation[] = [
  {
    id: "act-1",
    activity: "Morning Jog / Outdoor Cardio",
    startTime: "06:30",
    endTime: "07:15",
    durationMinutes: 45,
    locationType: "outdoor",
    intensity: "vigorous",
    hasMask: false,
    notes: "Running along arterial road park",
  },
  {
    id: "act-2",
    activity: "Morning Work Commute",
    startTime: "08:30",
    endTime: "09:15",
    durationMinutes: 45,
    locationType: "transit",
    commuteMode: "car-petrol",
    distanceKm: 16,
    intensity: "light",
    hasMask: false,
    notes: "Peak rush hour traffic corridor",
  },
  {
    id: "act-3",
    activity: "Office Work (Indoor)",
    startTime: "09:30",
    endTime: "17:30",
    durationMinutes: 480,
    locationType: "indoor",
    intensity: "resting",
    hasMask: false,
    notes: "Commercial office building",
  },
  {
    id: "act-4",
    activity: "Evening Return Commute",
    startTime: "17:45",
    endTime: "18:30",
    durationMinutes: 45,
    locationType: "transit",
    commuteMode: "two-wheeler",
    distanceKm: 14,
    intensity: "light",
    hasMask: false,
    notes: "Evening street-level traffic",
  },
  {
    id: "act-5",
    activity: "Evening Street Market & Walk",
    startTime: "20:00",
    endTime: "20:45",
    durationMinutes: 45,
    locationType: "outdoor",
    intensity: "moderate",
    hasMask: false,
    notes: "Local outdoor street market",
  },
];

export const PRESET_SCHEDULES: Record<string, { label: string; description: string; schedule: ScheduleItemSimulation[] }> = {
  urbanCommuter: {
    label: "Urban Professional (Car + Two-Wheeler)",
    description: "Office commute with mixed personal motorized transit and evening outdoor walk",
    schedule: DEFAULT_SIMULATION_SCHEDULE,
  },
  fitnessEnthusiast: {
    label: "Fitness & Morning Cyclist",
    description: "Dawn cycling, midday outdoor errands, and evening outdoor running",
    schedule: [
      {
        id: "fit-1",
        activity: "Dawn Road Cycling",
        startTime: "06:00",
        endTime: "07:00",
        durationMinutes: 60,
        locationType: "transit",
        commuteMode: "bicycle",
        distanceKm: 18,
        intensity: "vigorous",
        hasMask: false,
        notes: "High ventilation cycling during dawn chill",
      },
      {
        id: "fit-2",
        activity: "Midday Errands Commute",
        startTime: "13:00",
        endTime: "13:30",
        durationMinutes: 30,
        locationType: "transit",
        commuteMode: "car-petrol",
        distanceKm: 8,
        intensity: "light",
        hasMask: false,
      },
      {
        id: "fit-3",
        activity: "Evening Open-Air Crossfit",
        startTime: "19:30",
        endTime: "20:30",
        durationMinutes: 60,
        locationType: "outdoor",
        intensity: "vigorous",
        hasMask: false,
        notes: "Outdoor training during evening inversion stagnation",
      },
    ],
  },
  schoolFamily: {
    label: "Family School & Activity Routine",
    description: "Morning two-wheeler school drop, afternoon park, evening shopping",
    schedule: [
      {
        id: "sch-1",
        activity: "Morning School Drop-Off",
        startTime: "07:30",
        endTime: "08:00",
        durationMinutes: 30,
        locationType: "transit",
        commuteMode: "two-wheeler",
        distanceKm: 6,
        intensity: "light",
        hasMask: false,
        notes: "Open two-wheeler in morning school traffic",
      },
      {
        id: "sch-2",
        activity: "Afternoon Children Playground",
        startTime: "16:00",
        endTime: "17:00",
        durationMinutes: 60,
        locationType: "outdoor",
        intensity: "moderate",
        hasMask: false,
        notes: "Neighborhood public park",
      },
      {
        id: "sch-3",
        activity: "Night Grocery Run",
        startTime: "20:15",
        endTime: "20:45",
        durationMinutes: 30,
        locationType: "transit",
        commuteMode: "car-petrol",
        distanceKm: 5,
        intensity: "light",
        hasMask: false,
      },
    ],
  },
};
