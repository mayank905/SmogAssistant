import { describe, it, expect } from "vitest";
import { generateDeterministicRecommendations } from "./heuristic-fallback";
import { SCENARIO_PRESETS } from "../api/scenario-presets";
import { DEFAULT_USER_CONTEXT } from "@/types/context";

describe("Deterministic Heuristic Engine", () => {
  it("produces complete schema for Severe winter smog scenario", () => {
    const severeTelemetry = SCENARIO_PRESETS[0].telemetry;
    const recommendations = generateDeterministicRecommendations(severeTelemetry, DEFAULT_USER_CONTEXT);

    expect(recommendations).toBeDefined();
    expect(recommendations.airQualitySummary.cpcbCategory).toBe("Severe");
    expect(recommendations.airQualitySummary.healthRiskLevel).toBe("Critical");

    // Morning Briefing / Day blocks
    expect(recommendations.morningBriefing.inversionRisk).toBe("High");
    expect(recommendations.morningBriefing.dayBlocks.length).toBe(4);
    expect(recommendations.morningBriefing.dayBlocks[0].timeWindow).toContain("Morning");

    // Daily routine plan
    expect(recommendations.dailyRoutinePlan.length).toBeGreaterThan(0);
    const cardio = recommendations.dailyRoutinePlan.find(r => r.activity.includes("Cardio") || r.activity.includes("Exercise"));
    expect(cardio).toBeDefined();
    expect(cardio?.exposureReductionPct).toBeGreaterThanOrEqual(50);

    // Indoor mitigation & plants
    expect(recommendations.indoorMitigation.recommendedPlants.length).toBeGreaterThanOrEqual(3);
    const snakePlant = recommendations.indoorMitigation.recommendedPlants.find(p => p.name.includes("Snake"));
    expect(snakePlant).toBeDefined();
    expect(snakePlant?.countNeeded).toBeGreaterThan(0);

    // Sustainable commute
    expect(recommendations.sustainableCommute.pm25InhalationSavedPct).toBeGreaterThan(0);
    expect(recommendations.sustainableCommute.estimatedCo2SavedKg).toBeGreaterThan(0);

    // Vulnerable alerts
    expect(recommendations.vulnerableAlerts.length).toBeGreaterThanOrEqual(2);
    const asthmaticAlert = recommendations.vulnerableAlerts.find(a => a.targetGroup === "Asthmatics");
    expect(asthmaticAlert).toBeDefined();
    expect(asthmaticAlert?.severity).toBe("Critical");
  });

  it("adapts recommendations appropriately for Clean coastal air", () => {
    const cleanTelemetry = SCENARIO_PRESETS[3].telemetry;
    const cleanContext = {
      ...DEFAULT_USER_CONTEXT,
      hasAsthmaOrRespiratory: false,
      hasChildren: false,
      hasElderly: false,
    };
    const recommendations = generateDeterministicRecommendations(cleanTelemetry, cleanContext);

    expect(recommendations.airQualitySummary.cpcbCategory).toBe("Good");
    expect(recommendations.airQualitySummary.healthRiskLevel).toBe("Low");
    expect(recommendations.morningBriefing.inversionRisk).toBe("Low");
  });
});
