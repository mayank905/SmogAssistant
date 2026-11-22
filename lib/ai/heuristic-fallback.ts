import { AirQualityTelemetry } from "@/types/aqi";
import { UserContextProfile } from "@/types/context";
import { AIRecommendationResponse, DayBlock, VulnerableAlert, ActivityReschedule, PlantMitigation } from "@/types/recommendations";

export function generateDeterministicRecommendations(
  telemetry: AirQualityTelemetry,
  context: UserContextProfile
): AIRecommendationResponse {
  const aqi = telemetry.overallAqi;
  const category = telemetry.cpcbCategory;
  const isSevere = aqi >= 400;
  const isVeryPoor = aqi >= 300 && aqi < 400;
  const isPoor = aqi >= 200 && aqi < 300;
  const isModerate = aqi >= 100 && aqi < 200;
  const isGood = aqi < 100;

  // 1. Air Quality Summary
  let headline = `Current air quality is ${category} in ${telemetry.location.city}.`;
  let riskLevel: "Low" | "Moderate" | "High" | "Critical" = "Moderate";
  let generalAdvice = "Exercise standard urban precautions.";

  if (isSevere) {
    headline = `CRITICAL SMOG ALERT: Severe Atmospheric Inversion in ${telemetry.location.city}`;
    riskLevel = "Critical";
    generalAdvice = "Immediate exposure minimization required. Remain indoors with air purification active. Avoid all outdoor physical exertion.";
  } else if (isVeryPoor) {
    headline = `High Winter Pollution Spike in ${telemetry.location.city}`;
    riskLevel = "High";
    generalAdvice = "Unhealthy particulate levels. Sensitive groups should not step outside without N95 respirator masks. Restrict outdoor commutes.";
  } else if (isPoor) {
    headline = `Poor Ambient Air Quality in ${telemetry.location.city}`;
    riskLevel = "Moderate";
    generalAdvice = "Noticeable breathing discomfort during morning hours. Reschedule outdoor cardio to afternoon ventilation windows.";
  } else if (isModerate) {
    headline = `Moderate Air Quality in ${telemetry.location.city}`;
    riskLevel = "Moderate";
    generalAdvice = "Air is acceptable for general public, but asthmatic and elderly members should avoid strenuous exertion near high-traffic roads.";
  } else {
    headline = `Good to Satisfactory Air Quality in ${telemetry.location.city}`;
    riskLevel = "Low";
    generalAdvice = "Optimal atmospheric ventilation. Ideal for outdoor running, cycling, and natural cross-ventilation in homes.";
  }

  // 2. Up-Ahead Morning Briefing (Weather-Air Fusion Day Blocks)
  const inversionRisk: "Low" | "Medium" | "High" = isSevere ? "High" : isVeryPoor ? "High" : isPoor ? "Medium" : "Low";
  
  const dayBlocks: DayBlock[] = [
    {
      timeWindow: "Morning (06:00 - 11:00)",
      aqiOutlook: isSevere ? "Peak Hazard (AQI ~470)" : isVeryPoor ? "High Haze (AQI ~340)" : "Moderate Inversion (AQI ~150)",
      exposureRisk: isSevere ? "Severe" : isVeryPoor ? "High" : "Moderate",
      recommendedActions: [
        "Keep bedroom and balcony windows tightly closed against descending smog.",
        context.hasChildren ? "Ensure school-bound children wear fitted N95 masks." : "Wear N95/FFP2 mask if commuting on two-wheeler or walking.",
        "Postpone outdoor morning walks and cardio."
      ],
      cautions: [
        "Ground-level thermal inversion traps vehicular exhaust at breathing height.",
        "Cold morning air causes bronchial constriction."
      ]
    },
    {
      timeWindow: "Midday (11:00 - 16:00)",
      aqiOutlook: isSevere ? "Marginal Improvement (AQI ~380)" : isVeryPoor ? "Moderate Dispersion (AQI ~260)" : "Optimal Window (AQI ~110)",
      exposureRisk: isSevere ? "High" : isVeryPoor ? "Moderate" : "Low",
      recommendedActions: [
        "Solar radiation breaks the inversion layer slightly; optimal window for essential outdoor errands.",
        "Short 15-minute cross-ventilation permissible only if midday breeze picks up.",
        "Safest time slot for office transit or grocery runs."
      ],
      cautions: [
        "Solar photochemical ozone may rise slightly along main arterial roads."
      ]
    },
    {
      timeWindow: "Evening (16:00 - 21:00)",
      aqiOutlook: isSevere ? "Rapid Smog Re-accumulation (AQI ~440)" : isVeryPoor ? "Rush Hour Spike (AQI ~320)" : "Moderate Haze (AQI ~140)",
      exposureRisk: isSevere ? "Severe" : isVeryPoor ? "High" : "Moderate",
      recommendedActions: [
        "Commute with windows rolled up or use air-conditioned public transit.",
        "Turn on indoor air purifiers 1 hour before family dinner and bedtime.",
        context.workoutPreference === "evening" ? "Switch workout to indoor bodyweight or yoga." : "Avoid lingering near roadside bus stops."
      ],
      cautions: [
        "Heavy evening rush hour diesel emissions combine with dropping night temperatures."
      ]
    },
    {
      timeWindow: "Night (21:00 - 06:00)",
      aqiOutlook: isSevere ? "Severe Stagnant Inversion (AQI ~480)" : isVeryPoor ? "Elevated Particulates (AQI ~350)" : "Stable (AQI ~130)",
      exposureRisk: isSevere ? "Severe" : isVeryPoor ? "High" : "Moderate",
      recommendedActions: [
        "Run HEPA purifier in sleep mode directly in the bedroom.",
        "Place Snake Plants / Sansevieria beside sleeping area for nighttime oxygenation.",
        "Seal door and window gaps with wet towels or rubber draft-stoppers."
      ],
      cautions: [
        "Longest uninterrupted exposure window occurring during deep sleep."
      ]
    }
  ];

  // 3. Daily Routine Plan (Personalized Rescheduling)
  const dailyRoutinePlan: ActivityReschedule[] = [];
  
  if (context.workoutType === "outdoor") {
    dailyRoutinePlan.push({
      activity: "Physical Exercise / Cardio",
      originalTiming: context.workoutPreference === "early-morning" ? "06:30 AM (Morning Run)" : "06:30 PM (Evening Cardio)",
      optimizedTiming: isSevere || isVeryPoor ? "Indoor Workout Only (Living Room)" : "01:30 PM (Midday Solar Window)",
      justification: isSevere || isVeryPoor
        ? "Heavy pulmonary ventilation during severe smog draws 10x more toxic particulates into deep bronchial tissue."
        : "Sunlight and convective breeze dilute particulate concentrations by up to 45% during early afternoon.",
      exposureReductionPct: isSevere ? 85 : 55
    });
  }

  dailyRoutinePlan.push({
    activity: "Home Aeration & Ventilation",
    originalTiming: "07:00 AM (Standard morning window opening)",
    optimizedTiming: isSevere ? "Keep Sealed All Day (Recirculate Indoors)" : "01:00 PM - 01:30 PM (Quick 30-min flush)",
    justification: "Opening windows at dawn invites cold smog laden with unburned diesel carbon directly into the home.",
    exposureReductionPct: 70
  });

  dailyRoutinePlan.push({
    activity: "Daily Commute & Errand Timing",
    originalTiming: "08:30 AM (Peak Rush Hour)",
    optimizedTiming: "09:45 AM or Shift to Metro",
    justification: "Avoiding the concentrated 8:00-9:00 AM diesel idling wave prevents breathing acute surges of Nitrogen Dioxide (NO2).",
    exposureReductionPct: 40
  });

  // 4. Indoor Air Quality Mitigation (Plants & Hacks)
  const roomArea = context.roomAreaSqFt || 200;
  const snakePlantCount = Math.max(2, Math.round(roomArea / 80));
  const arecaPalmCount = Math.max(1, Math.round(roomArea / 120));
  const spiderPlantCount = Math.max(2, Math.round(roomArea / 100));

  const recommendedPlants: PlantMitigation[] = [
    {
      name: "Snake Plant (Mother-in-Law's Tongue)",
      botanicalName: "Sansevieria trifasciata",
      countNeeded: snakePlantCount,
      targetedPollutants: ["Benzene", "Formaldehyde", "Trichloroethylene", "Nighttime CO2"],
      careDifficulty: "Easy",
      placementTip: "Place in bedrooms; uniquely releases oxygen and absorbs CO2 at night via Crassulacean Acid Metabolism (CAM)."
    },
    {
      name: "Areca Palm (Butterfly Palm)",
      botanicalName: "Dypsis lutescens",
      countNeeded: arecaPalmCount,
      targetedPollutants: ["Xylene", "Toluene", "Acetone"],
      careDifficulty: "Moderate",
      placementTip: "Place in living rooms near natural light; acts as an effective natural bio-humidifier during dry winter heating."
    },
    {
      name: "Spider Plant",
      botanicalName: "Chlorophytum comosum",
      countNeeded: spiderPlantCount,
      targetedPollutants: ["Carbon Monoxide", "Formaldehyde", "Particulate Settling"],
      careDifficulty: "Easy",
      placementTip: "Hang near kitchen or entrance hallways to scrub localized combustion gases."
    }
  ];

  const diyLowCostHacks: string[] = [
    "Corsi-Rosenthal Box DIY: Tape a standard 20-inch box fan to four MERV-13 furnace filters for 90% HEPA-equivalent particulate filtration at 1/5th the commercial purifier price.",
    "Draft-Proof Door Sweeps: Roll damp towels or foam weather-stripping beneath entrance doors to stop ambient smog infiltration through floor gaps.",
    "Wet Mopping over Dry Sweeping: Dry brooms resuspend settled toxic fine dust back into breathing air. Always damp-mop floors with water and mild vinegar.",
    "Simmering Citrus & Water: Boil orange peel or cinnamon in a pot of water on low heat to maintain 45-50% indoor relative humidity, which forces airborne particulate droplets to coagulate and settle."
  ];

  const purifierStrategy = context.hasAirPurifier
    ? `Run your HEPA purifier on High for 45 minutes prior to bedtime, then sustain on Sleep Mode. Keep CADR (Clean Air Delivery Rate) matched to your ${roomArea} sq ft room.`
    : `Since no commercial purifier is currently available, keep bedroom doors closed, build a low-cost DIY MERV-13 box filter, and leverage ${snakePlantCount} Snake Plants for nighttime indoor oxygenation.`;

  // 5. Sustainable Commute & Offset Justification
  let currentModeLabel = "Two-Wheeler / Motorbike";
  let suggestedMode = "Underground Metro / Electric Bus";
  let pm25SavedPct = 68;
  let co2SavedKg = 2.4;
  let commuteAdvice = "Switching from an open two-wheeler to the underground metro shields your respiratory tract from direct tailpipe exhaust plumes.";

  if (context.primaryCommuteMode === "car-petrol") {
    currentModeLabel = "Single-Occupant Petrol Car";
    suggestedMode = "Metro Rail or EV Carpool";
    pm25SavedPct = 52;
    co2SavedKg = 4.8;
    commuteAdvice = "Switching your 35-minute solo drive to the metro removes ~4.8 kg of CO2 per trip and avoids idling in stagnant street canyons.";
  } else if (context.primaryCommuteMode === "walking" || context.primaryCommuteMode === "bicycle") {
    currentModeLabel = "Active Commute (Bicycle/Walking)";
    suggestedMode = "Public Transit / Carpool during Winter Peak";
    pm25SavedPct = 75;
    co2SavedKg = 0.0;
    commuteAdvice = "While walking/cycling is zero-emission, breathing deeply at street level during severe smog causes dangerous particulate intake. Shift to enclosed public transit during peak hours.";
  }

  // 6. Vulnerable Group Alerts
  const vulnerableAlerts: VulnerableAlert[] = [];

  if (context.hasAsthmaOrRespiratory) {
    vulnerableAlerts.push({
      targetGroup: "Asthmatics",
      severity: isSevere || isVeryPoor ? "Critical" : "Warning",
      specificWarning: `Elevated PM2.5 (${telemetry.pollutants.pm25.value} µg/m³) and NO2 trigger acute airway hyper-reactivity, coughing fits, and bronchospasms.`,
      emergencyAction: "Keep fast-acting rescue inhalers (e.g. Salbutamol) immediately accessible. Take prophylactic controller doses as prescribed before leaving home."
    });
  }

  if (context.hasChildren) {
    vulnerableAlerts.push({
      targetGroup: "Children",
      severity: isSevere ? "Critical" : "Warning",
      specificWarning: "Children breathe 50% more air per pound of body weight than adults, and their developing lung alveoli are permanently vulnerable to toxic PM2.5 scarring.",
      emergencyAction: "Prohibit outdoor school sports or recess. Require snug-fitting pediatric N95 masks for school bus commutes."
    });
  }

  if (context.hasElderly || context.hasHeartCondition) {
    vulnerableAlerts.push({
      targetGroup: "Elderly",
      severity: isSevere || isVeryPoor ? "Critical" : "Warning",
      specificWarning: "Fine particulates cross directly from lungs into capillary blood vessels, increasing systemic vascular inflammation and acute cardiovascular strain.",
      emergencyAction: "Cancel early morning walks. Monitor blood pressure and blood oxygen saturation (SpO2) twice daily."
    });
  }

  return {
    airQualitySummary: {
      headline,
      cpcbCategory: category,
      primaryHazard: telemetry.primaryPollutant,
      healthRiskLevel: riskLevel,
      generalAdvice
    },
    morningBriefing: {
      title: `Daily Smog & Weather Briefing: ${telemetry.location.city}`,
      weatherSynopsis: isSevere 
        ? "Cold morning temperatures (<12°C) and calm winds (<5 km/h) are causing acute thermal inversion, trapping heavy ground particulate layers."
        : "Moderate daytime solar warming allows convective dispersal of pollutants during afternoon hours.",
      inversionRisk,
      dayBlocks
    },
    dailyRoutinePlan,
    indoorMitigation: {
      ventilationAdvice: isSevere 
        ? "Strict window lockdown. Do not open windows between 05:00 AM and 11:00 AM." 
        : "Open north-facing windows for 20 minutes between 01:00 PM and 02:00 PM for fresh air exchange.",
      purifierStrategy,
      recommendedPlants,
      diyLowCostHacks
    },
    sustainableCommute: {
      currentMode: currentModeLabel,
      suggestedMode,
      pm25InhalationSavedPct: pm25SavedPct,
      estimatedCo2SavedKg: co2SavedKg,
      actionableAdvice: commuteAdvice,
      impactJustification: `By choosing ${suggestedMode}, you cut your personal fine dust inhalation by ${pm25SavedPct}% and prevent ${co2SavedKg} kg of greenhouse gas emissions.`
    },
    vulnerableAlerts,
    meta: {
      generatedAt: new Date().toISOString(),
      engine: "deterministic-fallback"
    }
  };
}
