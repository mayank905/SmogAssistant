import { GoogleGenerativeAI } from "@google/generative-ai";
import { AirQualityTelemetry } from "@/types/aqi";
import { UserContextProfile } from "@/types/context";
import { AIRecommendationResponse } from "@/types/recommendations";
import { 
  queryCopilotWithGuardrails, 
  generateMultiModelRecommendations,
  generateHouseholdAdvice,
  GEMINI_3_SERIES_MODELS,
  MODEL_WATERFALL,
  is3SeriesModel,
} from "./multi-model-client";
import { isAirQualityDomainQuery } from "./domain-guardrails";

/**
 * Validates a Gemini API Key with a lightweight ping test,
 * prioritizing 3-series models with multi-model fallback cascading.
 */
export async function verifyGeminiKey(apiKey: string): Promise<{ valid: boolean; message: string; modelAuthenticated?: string }> {
  if (!apiKey || apiKey.trim().length === 0) {
    return { valid: false, message: "API key cannot be empty" };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey.trim());
    const candidates = [
      "gemini-3.8-flash",
      "gemini-3.6-flash",
      "gemini-3.5-flash",
      "gemini-3.5-flash-lite",
      "gemini-3.1-flash-lite",
      "gemini-2.5-flash",
      "gemini-1.5-flash",
    ];

    let authedModel = "";
    let lastError = "";

    for (const testModel of candidates) {
      try {
        const model = genAI.getGenerativeModel({ model: testModel });
        const result = await model.generateContent("Respond with the single word: OK");
        const text = result.response.text();
        if (text && text.length > 0) {
          authedModel = testModel;
          break;
        }
      } catch (err: any) {
        lastError = err?.message || String(err);
      }
    }

    if (authedModel) {
      return { 
        valid: true, 
        message: `Gemini 3-Series Multi-Model Waterfall (${authedModel}) authenticated successfully!`,
        modelAuthenticated: authedModel,
      };
    }
    return { valid: false, message: lastError || "No response from Gemini API" };
  } catch (err: any) {
    const errorMessage = err?.message || "Invalid or restricted API key";
    return { valid: false, message: errorMessage };
  }
}

/**
 * Interactive Copilot Query with domain guardrails and multi-model waterfall
 */
export async function queryGeminiCopilot(
  userQuestion: string,
  telemetry: AirQualityTelemetry,
  context: UserContextProfile,
  overrideApiKey?: string
): Promise<string> {
  const result = await queryCopilotWithGuardrails(userQuestion, telemetry, context, overrideApiKey);
  return result.response;
}

/**
 * Generate full structured daily air quality and mitigation recommendations
 * using the Multi-Model Waterfall
 */
export async function generateAIRecommendations(
  telemetry: AirQualityTelemetry,
  context: UserContextProfile,
  overrideApiKey?: string
): Promise<AIRecommendationResponse> {
  return generateMultiModelRecommendations(telemetry, context, overrideApiKey);
}

export { 
  generateHouseholdAdvice, 
  queryCopilotWithGuardrails, 
  isAirQualityDomainQuery,
  GEMINI_3_SERIES_MODELS,
  MODEL_WATERFALL,
  is3SeriesModel,
};

