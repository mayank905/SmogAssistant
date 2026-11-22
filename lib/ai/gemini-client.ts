import { GoogleGenerativeAI } from "@google/generative-ai";
import { AirQualityTelemetry } from "@/types/aqi";
import { UserContextProfile } from "@/types/context";
import { AIRecommendationResponse } from "@/types/recommendations";
import { 
  queryCopilotWithGuardrails, 
  generateMultiModelRecommendations,
  generateHouseholdAdvice 
} from "./multi-model-client";
import { isAirQualityDomainQuery } from "./domain-guardrails";

/**
 * Validates a Gemini API Key with a lightweight ping test
 */
export async function verifyGeminiKey(apiKey: string): Promise<{ valid: boolean; message: string }> {
  if (!apiKey || apiKey.trim().length === 0) {
    return { valid: false, message: "API key cannot be empty" };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey.trim());
    // Test active models starting with 2.5/2.0 or 1.5
    let text = "";
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const result = await model.generateContent("Respond with the single word: OK");
      text = result.response.text();
    } catch {
      const fallbackModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await fallbackModel.generateContent("Respond with the single word: OK");
      text = result.response.text();
    }

    if (text && text.length > 0) {
      return { valid: true, message: "Gemini 3.x / 2.5 Multi-Model Active Engine authenticated successfully!" };
    }
    return { valid: false, message: "No response from Gemini API" };
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

export { generateHouseholdAdvice, queryCopilotWithGuardrails, isAirQualityDomainQuery };

