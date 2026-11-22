import { CommuteMode } from "@/types/context";

export interface CommuteImpactComparison {
  currentMode: string;
  recommendedMode: string;
  distanceKm: number;
  currentCo2Kg: number;
  newCo2Kg: number;
  co2SavedKg: number;
  pm25InhalationReductionPct: number;
  healthBenefitJustification: string;
}

const EMISSION_FACTORS_G_PER_KM: Record<CommuteMode, number> = {
  "car-petrol": 185,
  "car-ev": 35,
  "two-wheeler": 75,
  "bus": 45,
  "metro": 15,
  "bicycle": 0,
  "walking": 0,
};

const EXPOSURE_INDEX: Record<CommuteMode, number> = {
  "walking": 1.20, // highest due to increased respiration rate
  "bicycle": 1.25,
  "two-wheeler": 1.00,
  "bus": 0.70,
  "car-petrol": 0.45,
  "car-ev": 0.40,
  "metro": 0.15, // sealed, underground/elevated filtered air
};

const MODE_LABELS: Record<CommuteMode, string> = {
  "two-wheeler": "Motorbike / Scooter",
  "car-petrol": "Solo Petrol Car",
  "car-ev": "Electric Vehicle",
  "bus": "City Public Bus",
  "metro": "Metro Rail System",
  "bicycle": "Bicycle",
  "walking": "Walking",
};

export function calculateCommuteOffset(
  currentMode: CommuteMode,
  durationMinutes: number,
  isWinterSmogEmergency: boolean
): CommuteImpactComparison {
  // Approximate urban distance based on average urban speed (~25 km/h for motor, ~12 km/h for bike)
  const averageSpeedKmH = currentMode === "walking" ? 5 : currentMode === "bicycle" ? 14 : 24;
  const distanceKm = Math.round(((durationMinutes / 60) * averageSpeedKmH) * 10) / 10;

  // Decide best recommended mode
  let targetMode: CommuteMode = "metro";
  if (currentMode === "metro") {
    targetMode = "metro"; // already optimal
  } else if (currentMode === "car-petrol") {
    targetMode = "metro";
  } else if (currentMode === "two-wheeler") {
    targetMode = "metro";
  } else if ((currentMode === "walking" || currentMode === "bicycle") && isWinterSmogEmergency) {
    // During severe smog, active travel exposes lungs to high toxic inhalation
    targetMode = "metro";
  }

  const currentEmissionFactor = EMISSION_FACTORS_G_PER_KM[currentMode];
  const targetEmissionFactor = EMISSION_FACTORS_G_PER_KM[targetMode];

  const currentCo2Kg = Math.round(((currentEmissionFactor * distanceKm) / 1000) * 100) / 100;
  const newCo2Kg = Math.round(((targetEmissionFactor * distanceKm) / 1000) * 100) / 100;
  const co2SavedKg = Math.max(0, Math.round((currentCo2Kg - newCo2Kg) * 100) / 100);

  const currentExposure = EXPOSURE_INDEX[currentMode];
  const targetExposure = EXPOSURE_INDEX[targetMode];
  const pm25ReductionPct = Math.max(
    0,
    Math.round(((currentExposure - targetExposure) / currentExposure) * 100)
  );

  let justification = "";
  if (currentMode === "two-wheeler") {
    justification = `Switching to ${MODE_LABELS[targetMode]} eliminates direct exposure to diesel exhaust pipes at street level, slashing personal fine dust inhalation by ${pm25ReductionPct}% while saving ${co2SavedKg} kg of CO2 per trip.`;
  } else if (currentMode === "car-petrol") {
    justification = `Opting for ${MODE_LABELS[targetMode]} removes a solo fossil-fuel vehicle from crowded traffic choke points, abating ${co2SavedKg} kg of CO2 emissions and reducing congestion-induced NO2 accumulation.`;
  } else if (currentMode === "bicycle" || currentMode === "walking") {
    justification = isWinterSmogEmergency
      ? `While active commuting produces 0 emissions, physical exertion in winter smog causes deep alveolar PM2.5 deposition. Taking the sealed ${MODE_LABELS[targetMode]} during smog peaks shields your lungs by ${pm25ReductionPct}%.`
      : `Bicycling and walking are stellar zero-emission choices. Continue active transit during midday hours when the air is clearer.`;
  } else {
    justification = `Using ${MODE_LABELS[targetMode]} is already one of the cleanest, lowest-emission urban transit options available.`;
  }

  return {
    currentMode: MODE_LABELS[currentMode],
    recommendedMode: MODE_LABELS[targetMode],
    distanceKm,
    currentCo2Kg,
    newCo2Kg,
    co2SavedKg,
    pm25InhalationReductionPct: pm25ReductionPct,
    healthBenefitJustification: justification,
  };
}
