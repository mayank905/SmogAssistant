import { describe, it, expect } from "vitest";
import {
  calculateInhaledPm25,
  calculateTripCarbonEmissions,
  estimateTransitDistance,
  isInversionWindow,
  getDiurnalInversionMultiplier,
  estimatePm25FromAqi,
  generateClimateAlternative,
  DEFAULT_SIMULATION_SCHEDULE,
  PRESET_SCHEDULES,
  ScheduleItemSimulation,
  BREATHING_RATES_M3_PER_MIN,
  COMMUTE_EXPOSURE_FACTORS,
} from "./decision-simulator";

describe("Decision Simulator Math & Dosimetry Engine", () => {
  describe("estimatePm25FromAqi", () => {
    it("correctly estimates ambient PM2.5 concentration from CPCB AQI", () => {
      expect(estimatePm25FromAqi(0)).toBe(0);
      expect(estimatePm25FromAqi(50)).toBe(30);
      expect(estimatePm25FromAqi(100)).toBe(60);
      expect(estimatePm25FromAqi(200)).toBe(90);
      expect(estimatePm25FromAqi(300)).toBe(120);
      expect(estimatePm25FromAqi(400)).toBe(250);
      expect(estimatePm25FromAqi(500)).toBe(400);
    });
  });

  describe("Inhaled PM2.5 Dosimetry (calculateInhaledPm25)", () => {
    it("returns 0 when duration or ambient PM2.5 is zero", () => {
      expect(calculateInhaledPm25({ durationMinutes: 0, ambientPm25: 150 })).toBe(0);
      expect(calculateInhaledPm25({ durationMinutes: 45, ambientPm25: 0 })).toBe(0);
    });

    it("scales proportionally with duration and breathing intensity", () => {
      const ambient = 100;
      // Light vs Vigorous breathing (indoor midday 12:00)
      const lightInhaled = calculateInhaledPm25({
        durationMinutes: 60,
        ambientPm25: ambient,
        intensity: "light",
        locationType: "indoor",
        timeOfDay: "12:00",
      });

      const vigorousInhaled = calculateInhaledPm25({
        durationMinutes: 60,
        ambientPm25: ambient,
        intensity: "vigorous",
        locationType: "indoor",
        timeOfDay: "12:00",
      });

      // Ratio of breathing rates: 0.060 / 0.014 ≈ 4.28
      const expectedRatio = BREATHING_RATES_M3_PER_MIN.vigorous / BREATHING_RATES_M3_PER_MIN.light;
      expect(vigorousInhaled / lightInhaled).toBeCloseTo(expectedRatio, 1);
    });

    it("applies commute mode exposure factors correctly", () => {
      const ambient = 200;
      const duration = 30;

      const metroExposure = calculateInhaledPm25({
        durationMinutes: duration,
        ambientPm25: ambient,
        commuteMode: "metro",
        locationType: "transit",
        timeOfDay: "12:00",
      });

      const twoWheelerExposure = calculateInhaledPm25({
        durationMinutes: duration,
        ambientPm25: ambient,
        commuteMode: "two-wheeler",
        locationType: "transit",
        timeOfDay: "12:00",
      });

      // Metro factor is 0.15, Two-wheeler is 1.00
      expect(metroExposure).toBeLessThan(twoWheelerExposure);
      expect(twoWheelerExposure / metroExposure).toBeCloseTo(
        COMMUTE_EXPOSURE_FACTORS["two-wheeler"] / COMMUTE_EXPOSURE_FACTORS["metro"],
        1
      );
    });

    it("amplifies exposure during morning thermal inversion window", () => {
      const ambient = 150;
      const duration = 45;

      const morningInversion = calculateInhaledPm25({
        durationMinutes: duration,
        ambientPm25: ambient,
        locationType: "outdoor",
        timeOfDay: "07:00", // Inversion peak
      });

      const middaySun = calculateInhaledPm25({
        durationMinutes: duration,
        ambientPm25: ambient,
        locationType: "outdoor",
        timeOfDay: "13:30", // Midday dispersion
      });

      expect(morningInversion).toBeGreaterThan(middaySun);
      // Diurnal multipliers: 1.40 vs 0.70 (2x ratio)
      expect(morningInversion / middaySun).toBeCloseTo(2.0, 1);
    });

    it("dramatically cuts inhaled particulate when certified N95 mask is worn", () => {
      const ambient = 250;
      const unmasked = calculateInhaledPm25({
        durationMinutes: 45,
        ambientPm25: ambient,
        commuteMode: "walking",
        locationType: "outdoor",
        hasMask: false,
      });

      const masked = calculateInhaledPm25({
        durationMinutes: 45,
        ambientPm25: ambient,
        commuteMode: "walking",
        locationType: "outdoor",
        hasMask: true,
      });

      // 90% filtration efficiency -> 10% of unmasked dose
      expect(masked).toBeCloseTo(unmasked * 0.1, 1);
      expect(masked).toBeLessThan(unmasked);
    });
  });

  describe("Trip Carbon Emissions (calculateTripCarbonEmissions)", () => {
    it("returns 0 for zero-emission transit modes (bicycle, walking)", () => {
      expect(calculateTripCarbonEmissions("bicycle", 15)).toBe(0);
      expect(calculateTripCarbonEmissions("walking", 5)).toBe(0);
    });

    it("calculates correct kg CO2 for motorized transit", () => {
      // 10 km in petrol car: 185 g/km * 10 km = 1850 g = 1.85 kg
      expect(calculateTripCarbonEmissions("car-petrol", 10)).toBe(1.85);

      // 20 km in two-wheeler: 75 g/km * 20 km = 1500 g = 1.50 kg
      expect(calculateTripCarbonEmissions("two-wheeler", 20)).toBe(1.50);

      // 20 km in Metro: 15 g/km * 20 km = 300 g = 0.30 kg
      expect(calculateTripCarbonEmissions("metro", 20)).toBe(0.30);

      // 10 km in Bus: 45 g/km * 10 km = 450 g = 0.45 kg
      expect(calculateTripCarbonEmissions("bus", 10)).toBe(0.45);
    });

    it("estimates transit distance accurately based on urban speeds", () => {
      // 30 mins walking at 5 km/h = 2.5 km
      expect(estimateTransitDistance("walking", 30)).toBe(2.5);

      // 30 mins cycling at 14 km/h = 7.0 km
      expect(estimateTransitDistance("bicycle", 30)).toBe(7.0);

      // 45 mins metro/car at 24 km/h = 18.0 km
      expect(estimateTransitDistance("car-petrol", 45)).toBe(18.0);
    });
  });

  describe("Meteorological Inversion Detection", () => {
    it("identifies peak morning and evening inversion hours", () => {
      expect(isInversionWindow("06:30")).toBe(true);
      expect(isInversionWindow("08:15")).toBe(true);
      expect(isInversionWindow("20:30")).toBe(true);
      expect(isInversionWindow("22:00")).toBe(true);

      // Midday solar window is not an inversion trap
      expect(isInversionWindow("12:00")).toBe(false);
      expect(isInversionWindow("14:30")).toBe(false);
      expect(isInversionWindow("16:00")).toBe(false);
    });

    it("computes diurnal inversion multipliers properly", () => {
      expect(getDiurnalInversionMultiplier("07:00")).toBe(1.4);
      expect(getDiurnalInversionMultiplier("13:00")).toBe(0.7);
      expect(getDiurnalInversionMultiplier("21:00")).toBe(1.25);
      expect(getDiurnalInversionMultiplier("10:30")).toBe(1.0);
    });
  });

  describe("Climate & Health Schedule Optimization (generateClimateAlternative)", () => {
    it("optimizes default realistic schedule and yields positive savings", () => {
      const aqi = 340; // Very Poor / Severe
      const result = generateClimateAlternative(DEFAULT_SIMULATION_SCHEDULE, aqi);

      expect(result.baselineSchedule.length).toBe(DEFAULT_SIMULATION_SCHEDULE.length);
      expect(result.alternativeSchedule.length).toBe(DEFAULT_SIMULATION_SCHEDULE.length);

      // Baseline should have inversion conflicts and substantial CO2
      expect(result.baselineMetrics.inversionConflictsCount).toBeGreaterThan(0);
      expect(result.baselineMetrics.totalCo2Kg).toBeGreaterThan(0);
      expect(result.baselineMetrics.totalInhaledPm25Ug).toBeGreaterThan(0);

      // Alternative should achieve significant PM2.5 and CO2 savings
      expect(result.deltas.pm25SavedPct).toBeGreaterThan(30);
      expect(result.deltas.co2AbatedKg).toBeGreaterThan(1.0);
      expect(result.deltas.inversionWindowsAvoided).toBeGreaterThanOrEqual(1);

      // Highlights should contain impact explanations
      expect(result.impactHighlights.length).toBeGreaterThan(0);
      expect(result.impactHighlights[0]).toContain("PM2.5");
    });

    it("shifts outdoor workouts out of severe inversion or into indoor filtered environments", () => {
      const outdoorWorkoutSchedule: ScheduleItemSimulation[] = [
        {
          id: "test-run",
          activity: "Morning Marathon Training",
          startTime: "06:30",
          durationMinutes: 60,
          locationType: "outdoor",
          intensity: "vigorous",
          hasMask: false,
        },
      ];

      const severeResult = generateClimateAlternative(outdoorWorkoutSchedule, 380);
      const altItem = severeResult.alternativeSchedule[0];

      // In severe smog (>300 AQI), should relocate indoors
      expect(altItem.locationType).toBe("indoor");
      expect(severeResult.deltas.pm25SavedPct).toBeGreaterThan(70);
      expect(severeResult.deltas.inversionWindowsAvoided).toBe(1);
    });

    it("replaces fossil car commutes with electrified rail (metro)", () => {
      const carCommuteSchedule: ScheduleItemSimulation[] = [
        {
          id: "test-car",
          activity: "Solo Highway Commute",
          startTime: "08:30",
          durationMinutes: 50,
          locationType: "transit",
          commuteMode: "car-petrol",
          distanceKm: 20,
          intensity: "light",
        },
      ];

      const result = generateClimateAlternative(carCommuteSchedule, 250);
      const altItem = result.alternativeSchedule[0];

      expect(altItem.commuteMode).toBe("metro");
      // Baseline CO2: 20 km * 185 g = 3.7 kg. Metro: 20 km * 15 g = 0.3 kg. Abated: 3.4 kg.
      expect(result.deltas.co2AbatedKg).toBeCloseTo(3.4, 1);
      expect(result.deltas.co2SavedPct).toBeGreaterThan(80);
    });

    it("handles preset schedules cleanly", () => {
      const fitnessResult = generateClimateAlternative(PRESET_SCHEDULES.fitnessEnthusiast.schedule, 280);
      expect(fitnessResult.deltas.pm25SavedUg).toBeGreaterThan(0);

      const familyResult = generateClimateAlternative(PRESET_SCHEDULES.schoolFamily.schedule, 220);
      expect(familyResult.deltas.co2AbatedKg).toBeGreaterThan(0);
    });

    it("handles empty schedule without throwing errors", () => {
      const emptyResult = generateClimateAlternative([], 300);
      expect(emptyResult.baselineSchedule).toEqual([]);
      expect(emptyResult.alternativeSchedule).toEqual([]);
      expect(emptyResult.baselineMetrics.totalInhaledPm25Ug).toBe(0);
      expect(emptyResult.deltas.pm25SavedPct).toBe(0);
      expect(emptyResult.deltas.co2AbatedKg).toBe(0);
    });
  });
});
