import { PlantMitigation } from "@/types/recommendations";

export interface PlantSpecies {
  name: string;
  botanicalName: string;
  recommendedPer100SqFt: number;
  targetedPollutants: string[];
  careDifficulty: "Easy" | "Moderate";
  placementTip: string;
  benefit: string;
}

export const NASA_CLEAN_AIR_PLANTS: PlantSpecies[] = [
  {
    name: "Snake Plant (Mother-in-Law's Tongue)",
    botanicalName: "Sansevieria trifasciata",
    recommendedPer100SqFt: 1.0,
    targetedPollutants: ["Benzene", "Formaldehyde", "Trichloroethylene", "Nighttime CO2"],
    careDifficulty: "Easy",
    placementTip: "Bedroom bedside table; releases oxygen at night via Crassulacean Acid Metabolism (CAM).",
    benefit: "One of the few plants that converts CO2 into oxygen during the night.",
  },
  {
    name: "Areca Palm (Butterfly Palm)",
    botanicalName: "Dypsis lutescens",
    recommendedPer100SqFt: 0.6,
    targetedPollutants: ["Xylene", "Toluene", "Acetone", "Formaldehyde"],
    careDifficulty: "Moderate",
    placementTip: "Living room corners near filtered sunlight; acts as a natural air humidifier.",
    benefit: "Transpires roughly 1 liter of moisture per 24 hours, counteracting dry winter smog irritation.",
  },
  {
    name: "Spider Plant",
    botanicalName: "Chlorophytum comosum",
    recommendedPer100SqFt: 0.8,
    targetedPollutants: ["Carbon Monoxide", "Formaldehyde", "Fine Particulates"],
    careDifficulty: "Easy",
    placementTip: "Kitchen or entrance corridor in hanging baskets.",
    benefit: "Removes up to 95% of toxic formaldehyde and carbon monoxide in enclosed test chambers.",
  },
  {
    name: "Peace Lily",
    botanicalName: "Spathiphyllum",
    recommendedPer100SqFt: 0.5,
    targetedPollutants: ["Ammonia", "Benzene", "Formaldehyde", "Airborne Mold Spores"],
    careDifficulty: "Moderate",
    placementTip: "Bathrooms or shady corridors away from direct sunlight.",
    benefit: "Suppresses airborne microbes and absorbs volatile organic compounds (VOCs).",
  },
];

export function calculatePlantRequirements(roomAreaSqFt: number): PlantMitigation[] {
  const normalizedArea = Math.max(80, roomAreaSqFt);
  
  return NASA_CLEAN_AIR_PLANTS.map(plant => ({
    name: plant.name,
    botanicalName: plant.botanicalName,
    countNeeded: Math.max(1, Math.round((normalizedArea / 100) * plant.recommendedPer100SqFt)),
    targetedPollutants: plant.targetedPollutants,
    careDifficulty: plant.careDifficulty,
    placementTip: plant.placementTip,
  }));
}
