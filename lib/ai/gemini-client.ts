import { GoogleGenerativeAI } from "@google/generative-ai";
import { AirQualityTelemetry } from "@/types/aqi";
import { UserContextProfile } from "@/types/context";
import { AIRecommendationResponse } from "@/types/recommendations";
import { generateDeterministicRecommendations } from "./heuristic-fallback";

export async function generateAIRecommendations(
  telemetry: AirQualityTelemetry,
  context: UserContextProfile
): Promise<AIRecommendationResponse> {
  const startTime = Date.now();
  const apiKey = process.env.GEMINI_API_KEY;

  // If no Gemini API key is configured, immediately use the deterministic fallback engine
  if (!apiKey) {
    const result = generateDeterministicRecommendations(telemetry, context);
    return {
      ...result,
      meta: {
        ...result.meta,
        engine: "deterministic-fallback",
        executionTimeMs: Date.now() - startTime,
      },
    };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.3,
      },
    });

    const prompt = `
You are the AI engine of the Urban Air Quality Assistant (SmogAssistant).
Analyze the following real-time environmental telemetry and user household context profile to generate actionable, personalized, scientifically grounded guidance.

REAL-TIME TELEMETRY:
- City: ${telemetry.location.city}
- AQI: ${telemetry.overallAqi} (${telemetry.cpcbCategory})
- Primary Pollutant: ${telemetry.primaryPollutant}
- PM2.5: ${telemetry.pollutants.pm25.value} ${telemetry.pollutants.pm25.unit}
- PM10: ${telemetry.pollutants.pm10.value} ${telemetry.pollutants.pm10.unit}
- NO2: ${telemetry.pollutants.no2?.value ?? "N/A"} µg/m³
- SO2: ${telemetry.pollutants.so2?.value ?? "N/A"} µg/m³
- Ozone: ${telemetry.pollutants.o3?.value ?? "N/A"} µg/m³
- Carbon Monoxide: ${telemetry.pollutants.co?.value ?? "N/A"} mg/m³

USER HOUSEHOLD CONTEXT:
- Has Children: ${context.hasChildren}
- Has Elderly: ${context.hasElderly}
- Has Asthmatics / Respiratory Pre-conditions: ${context.hasAsthmaOrRespiratory}
- Has Cardiovascular Condition: ${context.hasHeartCondition}
- Is Pregnant: ${context.isPregnant}
- Primary Commute: ${context.primaryCommuteMode} (${context.commuteDurationMinutes} mins)
- Workout Habit: ${context.workoutType} at ${context.workoutPreference}
- Home Purifier: ${context.hasAirPurifier ? "Yes" : "No"}
- Room Area: ${context.roomAreaSqFt} sq ft

Return a JSON object conforming STRICTLY to the following structure:
{
  "airQualitySummary": {
    "headline": string,
    "cpcbCategory": "${telemetry.cpcbCategory}",
    "primaryHazard": string,
    "healthRiskLevel": "Low" | "Moderate" | "High" | "Critical",
    "generalAdvice": string
  },
  "morningBriefing": {
    "title": string,
    "weatherSynopsis": string,
    "inversionRisk": "Low" | "Medium" | "High",
    "dayBlocks": [
      {
        "timeWindow": string, // "Morning (06:00 - 11:00)", "Midday (11:00 - 16:00)", "Evening (16:00 - 21:00)", "Night (21:00 - 06:00)"
        "aqiOutlook": string,
        "exposureRisk": "Low" | "Moderate" | "High" | "Severe",
        "recommendedActions": string[],
        "cautions": string[]
      }
    ]
  },
  "dailyRoutinePlan": [
    {
      "activity": string,
      "originalTiming": string,
      "optimizedTiming": string,
      "justification": string,
      "exposureReductionPct": number
    }
  ],
  "indoorMitigation": {
    "ventilationAdvice": string,
    "purifierStrategy": string,
    "recommendedPlants": [
      {
        "name": string,
        "botanicalName": string,
        "countNeeded": number,
        "targetedPollutants": string[],
        "careDifficulty": "Easy" | "Moderate",
        "placementTip": string
      }
    ],
    "diyLowCostHacks": string[]
  },
  "sustainableCommute": {
    "currentMode": string,
    "suggestedMode": string,
    "pm25InhalationSavedPct": number,
    "estimatedCo2SavedKg": number,
    "actionableAdvice": string,
    "impactJustification": string
  },
  "vulnerableAlerts": [
    {
      "targetGroup": "Children" | "Elderly" | "Asthmatics" | "Pregnant" | "General Public",
      "severity": "Warning" | "Critical",
      "specificWarning": string,
      "emergencyAction": string
    }
  ]
}
`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const parsed = JSON.parse(text) as AIRecommendationResponse;

    return {
      ...parsed,
      meta: {
        generatedAt: new Date().toISOString(),
        engine: "gemini-genai",
        executionTimeMs: Date.now() - startTime,
      },
    };
  } catch (error) {
    console.warn("Gemini generation failed or timed out, falling back to deterministic engine:", error);
    const fallback = generateDeterministicRecommendations(telemetry, context);
    return {
      ...fallback,
      meta: {
        ...fallback.meta,
        engine: "deterministic-fallback",
        executionTimeMs: Date.now() - startTime,
      },
    };
  }
}
