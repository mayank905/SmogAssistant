import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { 
  MODEL_WATERFALL, 
  GEMINI_3_SERIES_MODELS,
  is3SeriesModel,
  queryCopilotWithGuardrails, 
  generateHouseholdAdvice,
  generateDeterministicHouseholdAdvice 
} from "./multi-model-client";
import { SCENARIO_PRESETS } from "../api/scenario-presets";
import { DEFAULT_USER_CONTEXT } from "@/types/context";
import { INITIAL_HOUSEHOLD_MEMBERS, HouseholdMember } from "@/types/household";

describe("Multi-Model Client & Waterfall Architecture", () => {
  const severeTelemetry = SCENARIO_PRESETS[0].telemetry; // Delhi Severe Smog AQI 485

  describe("Model Waterfall Specifications", () => {
    it("defines the modern active model waterfall in exact priority order", () => {
      expect(MODEL_WATERFALL).toEqual([
        "gemini-3.6-flash",
        "gemini-3.5-flash",
        "gemini-3.5-flash-lite",
        "gemini-3.1-flash-lite",
        "gemini-2.5-flash",
        "gemini-1.5-flash",
        "deterministic-fallback",
      ]);
    });

    it("defines all active 3-series models in sequential fallback order", () => {
      expect(GEMINI_3_SERIES_MODELS).toEqual([
        "gemini-3.6-flash",
        "gemini-3.5-flash",
        "gemini-3.5-flash-lite",
        "gemini-3.1-flash-lite",
      ]);

      GEMINI_3_SERIES_MODELS.forEach((m) => {
        expect(is3SeriesModel(m)).toBe(true);
      });
      expect(is3SeriesModel("gemini-2.5-flash")).toBe(false);
      expect(is3SeriesModel("gemini-1.5-flash")).toBe(false);
    });
  });

  describe("queryCopilotWithGuardrails", () => {
    it("intercepts off-topic queries via guardrails before calling any AI tier", async () => {
      const offTopicQuery = "Write a python function to compute fibonacci numbers";
      const result = await queryCopilotWithGuardrails(
        offTopicQuery,
        severeTelemetry,
        DEFAULT_USER_CONTEXT,
        "dummy-api-key"
      );

      expect(result.refused).toBe(true);
      expect(result.modelUsed).toBe("guardrail-enforcement");
      expect(result.response).toContain("SmogAssistant Copilot");
      expect(result.response).toContain("exclusively dedicated to environmental health");
      expect(result.attempts.length).toBe(0); // Zero LLM calls made!
    });

    it("intercepts cooking recipes via guardrails", async () => {
      const result = await queryCopilotWithGuardrails(
        "Give me a recipe for delicious chocolate cake",
        severeTelemetry,
        DEFAULT_USER_CONTEXT
      );

      expect(result.refused).toBe(true);
      expect(result.modelUsed).toBe("guardrail-enforcement");
    });

    it("falls back to deterministic engine when no API key is provided for in-domain query", async () => {
      const inDomainQuery = "What type of mask should I wear for PM2.5 protection?";
      const result = await queryCopilotWithGuardrails(
        inDomainQuery,
        severeTelemetry,
        DEFAULT_USER_CONTEXT
      );

      expect(result.refused).toBe(false);
      expect(result.modelUsed).toBe("deterministic-fallback");
      expect(result.response).toContain("N95");
      expect(result.category).toBe("mask-filtration");
    });

    it("provides exercise guidance in deterministic fallback mode during severe smog", async () => {
      const result = await queryCopilotWithGuardrails(
        "Is it safe to go for a morning run outside today?",
        severeTelemetry,
        DEFAULT_USER_CONTEXT
      );

      expect(result.refused).toBe(false);
      expect(result.modelUsed).toBe("deterministic-fallback");
      expect(result.response.toLowerCase()).toContain("strictly discouraged");
      expect(result.response.toLowerCase()).toContain("outdoor cardiovascular exercise");
    });

    it("provides vulnerable child and asthma guidance in deterministic fallback mode", async () => {
      const result = await queryCopilotWithGuardrails(
        "How can I protect my child with asthma from smog?",
        severeTelemetry,
        DEFAULT_USER_CONTEXT
      );

      expect(result.refused).toBe(false);
      expect(result.modelUsed).toBe("deterministic-fallback");
      expect(result.response).toContain("Children & Asthmatics");
      expect(result.response).toContain("inhaler");
    });
  });

  describe("generateHouseholdAdvice & Deterministic Fallback", () => {
    it("generates comprehensive household advice covering combined strategy and member advice", async () => {
      const advice = await generateHouseholdAdvice(
        severeTelemetry,
        INITIAL_HOUSEHOLD_MEMBERS
      );

      // 1. Combined Strategy Verification
      expect(advice.combinedStrategy).toBeDefined();
      expect(advice.combinedStrategy.purifierRuntimeHours).toBeDefined();
      expect(advice.combinedStrategy.windowSealing).toContain("Strict window lockdown");
      expect(advice.combinedStrategy.familyTransitSync).toContain("Synchronize");
      expect(advice.combinedStrategy.transitSyncRecommendations?.length).toBeGreaterThan(0);

      // 2. Member Advice Verification
      expect(advice.memberAdvice).toBeDefined();
      expect(advice.memberAdvice.length).toBe(INITIAL_HOUSEHOLD_MEMBERS.length);

      // 3. Child Member Verification
      const childAdvice = advice.memberAdvice.find((m) => m.role === "child");
      expect(childAdvice).toBeDefined();
      expect(childAdvice?.individualRiskScore).toBeGreaterThanOrEqual(80);
      expect(childAdvice?.riskLevel).toBe("Critical");
      expect(childAdvice?.maskRecommendation).toContain("KF94");
      expect(childAdvice?.scheduleShifts.length).toBeGreaterThan(0);

      // 4. Commuting Parent Verification
      const parentAdvice = advice.memberAdvice.find((m) => m.role === "parent");
      expect(parentAdvice).toBeDefined();
      expect(parentAdvice?.scheduleShifts.some((s) => s.suggestedMode === "metro")).toBe(true);

      // 5. Elderly Member Verification
      const elderlyAdvice = advice.memberAdvice.find((m) => m.role === "elderly");
      expect(elderlyAdvice).toBeDefined();
      expect(elderlyAdvice?.individualRiskScore).toBeGreaterThanOrEqual(80);
      expect(elderlyAdvice?.ageSpecificPrecautions.some((p) => p.includes("hypertension") || p.includes("vascular"))).toBe(true);
    });

    it("dynamically adjusts advice based on varying AQI conditions", () => {
      const moderateTelemetry = SCENARIO_PRESETS[2].telemetry; // Bengaluru Moderate AQI 142
      const moderateAdvice = generateDeterministicHouseholdAdvice(
        moderateTelemetry,
        INITIAL_HOUSEHOLD_MEMBERS
      );

      expect(moderateAdvice.combinedStrategy.purifierRuntimeHours).not.toContain("18 Hours/Day");
      expect(moderateAdvice.combinedStrategy.windowSealing).toContain("Brief 20-minute cross-ventilation allowed");
    });
  });

  describe("generateMultiModelRecommendations", () => {
    it("generates complete daily recommendations with deterministic fallback", async () => {
      const { generateMultiModelRecommendations } = await import("./multi-model-client");
      const result = await generateMultiModelRecommendations(
        severeTelemetry,
        DEFAULT_USER_CONTEXT
      );

      expect(result.airQualitySummary).toBeDefined();
      expect(result.airQualitySummary.headline).toContain("CRITICAL SMOG ALERT");
      expect(result.morningBriefing.dayBlocks.length).toBe(4);
      expect(result.indoorMitigation.recommendedPlants.length).toBeGreaterThan(0);
      expect(result.meta.engine).toBe("deterministic-fallback");
    });

    it("includes vulnerable alerts tailored to user household profile", async () => {
      const { generateMultiModelRecommendations } = await import("./multi-model-client");
      const result = await generateMultiModelRecommendations(
        severeTelemetry,
        {
          ...DEFAULT_USER_CONTEXT,
          hasAsthmaOrRespiratory: true,
          hasChildren: true,
          hasElderly: true,
        }
      );

      expect(result.vulnerableAlerts.length).toBeGreaterThanOrEqual(3);
      expect(result.vulnerableAlerts.some((a) => a.targetGroup === "Asthmatics")).toBe(true);
      expect(result.vulnerableAlerts.some((a) => a.targetGroup === "Children")).toBe(true);
      expect(result.vulnerableAlerts.some((a) => a.targetGroup === "Elderly")).toBe(true);
    });
  });

  describe("API Routes Integration Verification", () => {
    it("exports queryCopilotWithGuardrails and generateHouseholdAdvice cleanly", () => {
      expect(typeof queryCopilotWithGuardrails).toBe("function");
      expect(typeof generateHouseholdAdvice).toBe("function");
    });
  });
});
