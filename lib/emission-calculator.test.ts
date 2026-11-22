import { describe, it, expect } from "vitest";
import { calculateCommuteOffset } from "./emission-calculator";

describe("Sustainable Commute Impact Calculator", () => {
  it("calculates high inhalation reduction when switching from two-wheeler to metro", () => {
    const comparison = calculateCommuteOffset("two-wheeler", 35, true);
    expect(comparison.currentMode).toContain("Motorbike");
    expect(comparison.recommendedMode).toContain("Metro");
    expect(comparison.pm25InhalationReductionPct).toBeGreaterThanOrEqual(80);
    expect(comparison.co2SavedKg).toBeGreaterThan(0.5);
    expect(comparison.healthBenefitJustification).toContain("direct exposure");
  });

  it("calculates CO2 savings when switching from solo petrol car to metro", () => {
    const comparison = calculateCommuteOffset("car-petrol", 45, true);
    expect(comparison.co2SavedKg).toBeGreaterThan(1.5);
    expect(comparison.pm25InhalationReductionPct).toBeGreaterThan(50);
  });
});
