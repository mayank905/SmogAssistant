import { GoogleGenerativeAI } from "@google/generative-ai";
import { AirQualityTelemetry } from "@/types/aqi";
import { UserContextProfile } from "@/types/context";
import { AIRecommendationResponse } from "@/types/recommendations";
import { 
  HouseholdMember, 
  HouseholdAdviceResponse, 
  CombinedHouseholdAdvice, 
  MemberPersonalAdvice, 
  INITIAL_HOUSEHOLD_MEMBERS,
  DEFAULT_HOUSEHOLD_ADVICE
} from "@/types/household";
import { isAirQualityDomainQuery, GUARDRAILS_SYSTEM_PROMPT, AIR_QUALITY_REFUSAL_MESSAGE } from "./domain-guardrails";
import { generateDeterministicRecommendations } from "./heuristic-fallback";

/**
 * Comprehensive Active Gemini Models (Starting from 3.6-Flash downwards)
 * Prioritizes high-throughput text models free from top-tier saturation:
 * 1. gemini-3.6-flash
 * 2. gemini-3.5-flash
 * 3. gemini-3.5-flash-lite
 * 4. gemini-3.1-flash-lite
 */
export const GEMINI_3_SERIES_MODELS = [
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
] as const;

/**
 * Modern Active Model Waterfall
 * Prioritizes 3.6-flash down through 3.5, 3.1, 2.5, 1.5 generations for fast text responses,
 * and finally cascades to local deterministic reasoning engines:
 * gemini-3.6-flash -> gemini-3.5-flash -> gemini-3.5-flash-lite -> gemini-3.1-flash-lite -> gemini-2.5-flash -> gemini-1.5-flash -> deterministic-fallback
 */
export const MODEL_WATERFALL = [
  ...GEMINI_3_SERIES_MODELS,
  "gemini-2.5-flash",
  "gemini-1.5-flash",
  "deterministic-fallback",
] as const;

export function is3SeriesModel(modelName: string): boolean {
  return /gemini-3(\.|\b)/i.test(modelName);
}

/**
 * Strips outer quotes, whitespace, and formatting anomalies from API keys
 */
export function cleanApiKey(key?: string): string {
  if (!key || typeof key !== "string") return "";
  return key.replace(/['"\r\n\t]/g, "").trim();
}

export type ModelTier = typeof MODEL_WATERFALL[number];

export interface WaterfallAttempt {
  model: string;
  status: "success" | "failed" | "skipped";
  durationMs?: number;
  error?: string;
}

export interface CopilotResponse {
  response: string;
  refused: boolean;
  modelUsed: string;
  category?: string;
  executionTimeMs: number;
  attempts: WaterfallAttempt[];
}

/**
 * Helper to produce a deterministic, science-grounded response for air quality queries
 * when offline or when all external API tiers are exhausted.
 */
function generateDeterministicCopilotAnswer(
  query: string,
  telemetry: AirQualityTelemetry,
  context: UserContextProfile
): string {
  const q = query.toLowerCase();
  const aqi = telemetry.overallAqi;
  const city = telemetry.location.city;
  const pm25 = telemetry.pollutants.pm25.value;
  const category = telemetry.cpcbCategory;

  let advice = "";

  if (/mask|n95|n99|ffp2|respirator|surgical/i.test(q)) {
    advice = `### Mask Filtration Advisory for ${city} (Current AQI: ${aqi} - ${category})\n\n` +
      `• **Recommended Mask**: Wear a certified **N95 or FFP2 respirator** that forms an airtight perimeter seal around the nose bridge and chin.\n` +
      `• **Filtration Efficacy**: Standard surgical or single-layer cloth masks provide less than 20% filtration against fine PM2.5 particulates (${pm25} µg/m³), whereas an N95 captures >95% of sub-micron aerosols.\n` +
      `• **Exhalation Valves**: If commuting, valved N95 masks make breathing easier, but for vulnerable family members in shared indoor transport, unvalved KF94 or N95 masks are advised to protect everyone.`;
  } else if (/jog|run|walk|exercise|outdoor|workout/i.test(q)) {
    if (aqi >= 250) {
      advice = `### Outdoor Activity Advisory for ${city}\n\n` +
        `• **Current Status**: Outdoor cardiovascular exercise is **strictly discouraged** right now (AQI: ${aqi}, PM2.5: ${pm25} µg/m³).\n` +
        `• **Physiological Impact**: Deep breathing during cardio increases your pulmonary ventilation rate by 5x-10x, driving toxic diesel soot deep into pulmonary alveoli.\n` +
        `• **Safe Window**: If you must exercise, shift strictly to **indoor yoga or bodyweight workouts** in an air-purified room, or wait for the convective midday sun window (13:00 - 15:30) when ground inversion weakens.`;
    } else {
      advice = `### Outdoor Exercise Advisory for ${city}\n\n` +
        `• **Current Status**: Air quality is currently ${category} (AQI: ${aqi}).\n` +
        `• **Timing Recommendation**: The optimal window for outdoor activities is during **midday (12:00 PM - 03:30 PM)** when solar heating disperses ground particulates. Avoid early dawn (05:00 - 08:30 AM) when thermal inversion traps vehicular exhaust at ground level.`;
    }
  } else if (/child|kid|baby|elderly|asthma|asthmatic|pregnant|heart/i.test(q)) {
    advice = `### Vulnerable Family Shielding Protocol (${city} - AQI ${aqi})\n\n` +
      `• **Children & Asthmatics**: Children inhale 50% more air per pound of body mass than adults. Asthmatic children should avoid outdoor school recess and always carry a fast-acting rescue inhaler with a spacer.\n` +
      `• **Elderly & Cardiovascular Patients**: PM2.5 particulates penetrate capillary walls into the bloodstream, triggering vascular inflammation and elevated blood pressure. Cancel early morning park walks and monitor blood pressure/SpO2 twice daily.\n` +
      `• **Indoor Sanctuary**: Keep children and seniors in a designated clean-air room with an operating HEPA purifier.`;
  } else if (/purifier|hepa|indoor|plant|snake plant|window|ventilat/i.test(q)) {
    advice = `### Indoor Air Defense Strategy\n\n` +
      `• **HEPA Operation**: Run your air purifier continuously on medium/high during evening and morning spikes. In a room of ~${context.roomAreaSqFt || 250} sq ft, ensure CADR delivers at least 4-5 air changes per hour (ACH).\n` +
      `• **Window Management**: Seal exterior window seams and balcony doors tightly from 05:00 AM to 11:00 AM. A short 15-20 minute cross-ventilation window is safe only around 14:00 PM on sunny days.\n` +
      `• **Air-Cleaning Plants**: Place Snake Plants (Sansevieria) in bedrooms for night-time oxygen release and Areca Palms in living areas to counter dry winter air.`;
  } else if (/commute|transit|metro|two-wheeler|bike|car/i.test(q)) {
    advice = `### Low-Exposure Transit Guidance\n\n` +
      `• **Avoid Open Two-Wheelers**: Motorbike commuters face 3x to 5x higher particulate inhalation than closed vehicle commuters along traffic corridors.\n` +
      `• **Switch to Underground Metro / Electric Bus**: Shifting your daily commute to the metro cuts personal PM2.5 inhalation by up to 75% and saves ~2-4 kg of CO2 per trip.\n` +
      `• **Cabin Recirculation**: If driving a car, keep windows rolled up and switch the HVAC strictly to **Internal Recirculation Mode** to block exterior exhaust plumes.`;
  } else {
    advice = `### SmogAssistant Environmental Guidance for ${city}\n\n` +
      `• **Current Environmental Snapshot**: AQI is currently **${aqi} (${category})** with **${telemetry.primaryPollutant}** as the dominant pollutant.\n` +
      `• **Immediate Action**: Sensitive family members should minimize outdoor exposure during morning peak hours (06:00 - 10:00 AM).\n` +
      `• **Home Defense**: Keep living areas sealed against ambient haze, damp-mop floors instead of sweeping, and wear certified N95 respirators for all essential outdoor transit.`;
  }

  return advice;
}

/**
 * Interactive Copilot Query with Strict Domain Guardrails and Multi-Model Waterfall.
 * 
 * 1. Checks domain boundaries: If off-topic (coding, recipes, politics, general trivia),
 *    immediately returns polite refusal with helpful redirection without calling the LLM.
 * 2. Cascades through modern active model waterfall:
 *    ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro", "deterministic-fallback"].
 * 3. Logs attempt metadata and handles quota/network errors seamlessly.
 */
export async function queryCopilotWithGuardrails(
  query: string,
  telemetry: AirQualityTelemetry,
  context: UserContextProfile,
  overrideApiKey?: string
): Promise<CopilotResponse> {
  const startTime = Date.now();
  const attempts: WaterfallAttempt[] = [];

  // Step 1: Enforce Strict Domain Guardrails
  const guardrailResult = isAirQualityDomainQuery(query);
  if (!guardrailResult.isDomainSpecific) {
    return {
      response: guardrailResult.refusalMessage || AIR_QUALITY_REFUSAL_MESSAGE,
      refused: true,
      modelUsed: "guardrail-enforcement",
      category: guardrailResult.category || "off-topic",
      executionTimeMs: Date.now() - startTime,
      attempts: [],
    };
  }

  const apiKey = cleanApiKey(overrideApiKey || process.env.GEMINI_API_KEY);

  // If no API key configured, jump straight to deterministic fallback
  if (!apiKey) {
    attempts.push({
      model: "gemini-api-key-check",
      status: "skipped",
      error: "No Gemini API key provided",
    });
    const fallbackAnswer = generateDeterministicCopilotAnswer(query, telemetry, context);
    return {
      response: fallbackAnswer,
      refused: false,
      modelUsed: "deterministic-fallback",
      category: guardrailResult.category,
      executionTimeMs: Date.now() - startTime,
      attempts,
    };
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  const prompt = `
${GUARDRAILS_SYSTEM_PROMPT}

CURRENT AIR TELEMETRY:
- City: ${telemetry.location.city}
- AQI: ${telemetry.overallAqi} (${telemetry.cpcbCategory})
- Primary Pollutant: ${telemetry.primaryPollutant}
- PM2.5: ${telemetry.pollutants.pm25.value} µg/m³
- PM10: ${telemetry.pollutants.pm10.value} µg/m³
- Ozone: ${telemetry.pollutants.o3?.value ?? "N/A"} µg/m³
- NO2: ${telemetry.pollutants.no2?.value ?? "N/A"} µg/m³

USER HOUSEHOLD PROFILE:
- Vulnerabilities: Children: ${context.hasChildren}, Elderly: ${context.hasElderly}, Asthmatic/Respiratory: ${context.hasAsthmaOrRespiratory}, Heart: ${context.hasHeartCondition}, Pregnant: ${context.isPregnant}
- Primary Commute: ${context.primaryCommuteMode} (${context.commuteDurationMinutes} min)
- Exercise Habit: ${context.workoutType} at ${context.workoutPreference}
- Home Purifier: ${context.hasAirPurifier ? "Yes" : "No"} (${context.roomAreaSqFt || 250} sq ft)

USER QUESTION: "${query}"

Provide a structured, scientifically accurate, empathetic response specifically addressing their inquiry with actionable safety measures for their air quality level.
`;

  // Waterfall through active model tiers (skipping deterministic fallback in the loop)
  const geminiTiers = MODEL_WATERFALL.filter((m) => m !== "deterministic-fallback");

  for (const modelTier of geminiTiers) {
    const tierStart = Date.now();
    try {
      const model = genAI.getGenerativeModel({
        model: modelTier,
        systemInstruction: GUARDRAILS_SYSTEM_PROMPT,
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 1024,
        },
      });

      const result = await model.generateContent(prompt);
      const text = result.response.text();

      if (text && text.trim().length > 0) {
        attempts.push({
          model: modelTier,
          status: "success",
          durationMs: Date.now() - tierStart,
        });

        return {
          response: text.trim(),
          refused: false,
          modelUsed: modelTier,
          category: guardrailResult.category,
          executionTimeMs: Date.now() - startTime,
          attempts,
        };
      }
      throw new Error(`Empty response from ${modelTier}`);
    } catch (err: any) {
      console.warn(`[SmogAssistant Waterfall] Model ${modelTier} failed: ${err?.message || err}. Cascading to next tier.`);
      attempts.push({
        model: modelTier,
        status: "failed",
        durationMs: Date.now() - tierStart,
        error: err?.message || String(err),
      });
    }
  }

  // Tier 5: Deterministic Fallback Engine
  const fallbackAnswer = generateDeterministicCopilotAnswer(query, telemetry, context);
  attempts.push({
    model: "deterministic-fallback",
    status: "success",
    durationMs: 0,
  });

  return {
    response: fallbackAnswer,
    refused: false,
    modelUsed: "deterministic-fallback",
    category: guardrailResult.category,
    executionTimeMs: Date.now() - startTime,
    attempts,
  };
}

/**
 * Deterministic generator for Household Advice when AI API is unavailable.
 * Analyzes multi-member profiles, vulnerabilities, and daily schedules against real-time AQI.
 */
export function generateDeterministicHouseholdAdvice(
  telemetry: AirQualityTelemetry,
  members: HouseholdMember[]
): HouseholdAdviceResponse {
  const aqi = telemetry.overallAqi;
  const city = telemetry.location.city;
  const isSevere = aqi >= 400;
  const isVeryPoor = aqi >= 300 && aqi < 400;
  const isPoor = aqi >= 200 && aqi < 300;

  // 1. Combined Household Strategy
  const runtimeHours = isSevere 
    ? "18 Hours/Day (Turbo: 05:30-10:30 & 17:30-22:30, Continuous Night Sleep Mode)" 
    : isVeryPoor 
    ? "14 Hours/Day (High speed during morning rush and evening inversion)" 
    : isPoor 
    ? "10 Hours/Day (Morning & Evening operational blocks)" 
    : "6 Hours/Day (Targeted evening usage)";

  const windowSealing = isSevere || isVeryPoor
    ? `Strict window lockdown in ${city}. Seal exterior sashes and door sweeps between 05:00 and 11:30 AM to stop high-density soot infiltration.`
    : `Keep exterior windows closed during morning rush hours. Brief 20-minute cross-ventilation allowed between 13:30 - 15:00 PM.`;

  const ventilationWindows = isSevere
    ? ["No natural ventilation advised. Rely strictly on indoor filtration."]
    : ["13:30 - 15:00 PM (Direct midday solar window; pause purifiers during ventilation)"];

  const familyTransitSync = `Synchronize departure times: Commuting adults should coordinate with school-going children via enclosed AC vehicles with cabin air recirculation, avoiding open two-wheelers or waiting at busy roadside stops during peak smog.`;

  const combinedStrategy: CombinedHouseholdAdvice = {
    purifierRuntimeHours: runtimeHours,
    purifierSchedule: {
      peakHours: "06:00-10:00 AM & 18:00-22:00 PM",
      recommendedSpeed: isSevere ? "Turbo / Maximum CADR" : "Medium-High Mode",
      targetRooms: ["Children's Bedroom", "Senior Room", "Shared Living Area"],
      filterLifeTip: "Pre-vacuum exterior mesh pre-filter weekly during high-smog periods to prevent early HEPA H13 saturation.",
    },
    windowSealing,
    ventilationWindows,
    familyTransitSync,
    transitSyncRecommendations: [
      "Avoid open two-wheeler riding when AQI exceeds 250; migrate trips to metro or shared electric cabs.",
      "Consolidate morning school and office commutes to minimize cumulative street-level exposure.",
      "Vulnerable elderly members must remain indoors until thermal inversion disperses in the afternoon.",
    ],
    sharedIndoorActions: [
      "Strictly adopt damp micro-fiber mopping; avoid dry brooms that resuspend settled toxic fine dust.",
      "Maintain 40-50% indoor relative humidity to promote particulate coagulation and faster settling.",
      "Position Snake Plants and Areca Palms in bedrooms and living rooms for botanical toxin reduction.",
    ],
    emergencyPreparedness: "Inspect pediatric and adult inhaler expiries; maintain calibrated digital pulse oximeter for daily oxygen saturation checks.",
    summary: `Comprehensive household shield tailored for ${city} at AQI ${aqi} (${telemetry.cpcbCategory}). Focuses on eliminating high-exposure open transit and maintaining continuous indoor filtration.`,
  };

  // 2. Member Personal Advice
  const memberAdvice: MemberPersonalAdvice[] = members.map((member) => {
    const isChild = member.role === "child" || member.age < 12;
    const isElderly = member.role === "elderly" || member.age >= 60;
    const hasRespiratory = member.healthConditions.some((c) => /asthma|bronch|lung|allerg|copd/i.test(c));
    const hasHeart = member.healthConditions.some((c) => /hyper|heart|cardio|bp/i.test(c));

    // Calculate individual risk score (15 to 99)
    let score = Math.round((Math.min(aqi, 500) / 500) * 45);
    if (isChild) score += 25;
    if (isElderly) score += 25;
    if (hasRespiratory) score += 20;
    if (hasHeart) score += 15;

    // Schedule risk bonus
    const hasMorningOutdoor = member.schedule.some((s) => s.isOutdoor && /0[5-9]:|10:/i.test(s.time));
    const hasTwoWheeler = member.schedule.some((s) => s.commuteMode === "two-wheeler");
    if (hasMorningOutdoor) score += 10;
    if (hasTwoWheeler) score += 12;

    const riskScore = Math.min(99, Math.max(15, score));
    const riskLevel: MemberPersonalAdvice["riskLevel"] = 
      riskScore >= 80 ? "Critical" : riskScore >= 60 ? "High" : riskScore >= 40 ? "Moderate" : "Low";

    // Age-specific precautions
    const ageSpecificPrecautions: string[] = [];
    if (isChild) {
      ageSpecificPrecautions.push("Developing pediatric lungs inhale 50% more air per pound of body mass than adults.");
      ageSpecificPrecautions.push("Prohibit outdoor physical training, running, or playground recess while AQI is elevated.");
      ageSpecificPrecautions.push("Equip with a small-profile child-fitting KF94/N95 mask with a tight nasal wire seal.");
    } else if (isElderly) {
      ageSpecificPrecautions.push("Inhaled PM2.5 crosses into blood vessels, exacerbating systemic vascular stiffness and hypertension.");
      ageSpecificPrecautions.push("Reschedule dawn morning walks entirely to indoor living-room stretches or post-noon sunlit strolls.");
      ageSpecificPrecautions.push("Log blood pressure and blood oxygen (SpO2) morning and night.");
    } else {
      ageSpecificPrecautions.push("Deep breathing in dense traffic deposits heavy black carbon soot directly into bronchial passages.");
      ageSpecificPrecautions.push("Avoid open two-wheeler transit during peak rush hours (08:00 - 10:30 AM).");
      ageSpecificPrecautions.push("Perform sterile saline nasal rinses and throat gargles after long highway commutes.");
    }

    // Mask recommendation
    let maskRecommendation = "N95 or FFP2 certified respirator with tight facial seal";
    if (isChild) {
      maskRecommendation = "Pediatric-sized KF94 or small N95 respirator without exhalation valve";
    } else if (isElderly) {
      maskRecommendation = "High-breathability FFP2 respirator with soft foam seal, or remain in purified indoor shelter";
    }

    // Schedule shifts
    const scheduleShifts = member.schedule.map((item) => {
      const isMorning = /0[5-9]:|10:/i.test(item.time);
      const isRushHour = /08:|09:|18:|19:/i.test(item.time);

      if (item.commuteMode === "two-wheeler" && isRushHour) {
        return {
          activity: item.activity,
          originalTime: item.time,
          proposedTime: "Shift 45 mins earlier or switch to Metro",
          reason: "Avoids highest density vehicular diesel plumes during peak atmospheric stagnation.",
          exposureReductionPct: 65,
          suggestedMode: "metro" as const,
        };
      }

      if (item.isOutdoor && isMorning) {
        return {
          activity: item.activity,
          originalTime: item.time,
          proposedTime: isSevere ? "Relocate Indoors" : "13:30 PM (Midday Solar Window)",
          reason: "Cold morning thermal inversion concentrates heavy particulates within the first 100 meters above ground.",
          exposureReductionPct: isSevere ? 85 : 55,
          suggestedMode: item.commuteMode,
        };
      }

      return {
        activity: item.activity,
        originalTime: item.time,
        proposedTime: item.time,
        reason: "Activity occurs in manageable exposure window; wear certified N95 mask.",
        exposureReductionPct: 30,
        suggestedMode: item.commuteMode,
      };
    });

    // Medical advisory
    let medicalAdvisory = "Stay hydrated and monitor for persistent dry cough, eye irritation, or morning headaches.";
    if (hasRespiratory) {
      medicalAdvisory = "Keep prescribed fast-acting bronchodilator (Salbutamol) immediately available. Administer preventive dose before necessary transit.";
    } else if (hasHeart) {
      medicalAdvisory = "Take cardiovascular medications on schedule; avoid sudden cold exposure which provokes arterial constriction.";
    }

    return {
      memberId: member.id,
      memberName: member.name,
      role: member.role,
      age: member.age,
      individualRiskScore: riskScore,
      riskLevel,
      ageSpecificPrecautions,
      maskRecommendation,
      scheduleShifts,
      medicalAdvisory,
      activityRestrictions: isSevere || isVeryPoor
        ? ["No outdoor running/cardio", "No two-wheeler commutes without N95", "No early morning walks"]
        : ["Limit strenuous outdoor workouts during morning rush hour"],
    };
  });

  return {
    combinedStrategy,
    memberAdvice,
    overallRiskSummary: `Household risk posture in ${city} at AQI ${aqi} (${telemetry.cpcbCategory}): Prioritizes pediatric and geriatric shielding, transit consolidation, and proactive window sealing.`,
    generatedAt: new Date().toISOString(),
    meta: {
      engine: "deterministic-fallback",
      aqiLevel: aqi,
    },
  };
}

/**
 * Generates personalized Multi-Member Household Advice using the Multi-Model Waterfall.
 * 
 * Evaluates combined household strategy (purifier runtime, window sealing, transit sync)
 * and tailored per-member advice (risk scores, precautions, schedule shifts).
 */
export async function generateHouseholdAdvice(
  telemetry: AirQualityTelemetry,
  members: HouseholdMember[] = INITIAL_HOUSEHOLD_MEMBERS,
  overrideApiKey?: string
): Promise<HouseholdAdviceResponse> {
  const startTime = Date.now();
  const apiKey = cleanApiKey(overrideApiKey || process.env.GEMINI_API_KEY);

  if (!apiKey) {
    const fallback = generateDeterministicHouseholdAdvice(telemetry, members);
    return {
      ...fallback,
      meta: {
        ...fallback.meta,
        engine: "deterministic-fallback",
      },
    };
  }

  const attempts: WaterfallAttempt[] = [];
  const genAI = new GoogleGenerativeAI(apiKey);

  const prompt = `
You are the Chief Environmental Medical Officer of SmogAssistant.
Analyze the following real-time environmental telemetry and multi-member household roster to generate an integrated household air defense plan.

REAL-TIME TELEMETRY:
- City: ${telemetry.location.city}
- AQI: ${telemetry.overallAqi} (${telemetry.cpcbCategory})
- Primary Pollutant: ${telemetry.primaryPollutant}
- PM2.5: ${telemetry.pollutants.pm25.value} µg/m³
- PM10: ${telemetry.pollutants.pm10.value} µg/m³

HOUSEHOLD MEMBERS ROSTER:
${JSON.stringify(members, null, 2)}

Return a JSON object conforming STRICTLY to the following schema:
{
  "combinedStrategy": {
    "purifierRuntimeHours": string,
    "purifierSchedule": {
      "peakHours": string,
      "recommendedSpeed": string,
      "targetRooms": string[],
      "filterLifeTip": string
    },
    "windowSealing": string,
    "ventilationWindows": string[],
    "familyTransitSync": string,
    "transitSyncRecommendations": string[],
    "sharedIndoorActions": string[],
    "emergencyPreparedness": string,
    "summary": string
  },
  "memberAdvice": [
    {
      "memberId": string,
      "memberName": string,
      "role": string,
      "age": number,
      "individualRiskScore": number, // 0 - 100
      "riskLevel": "Low" | "Moderate" | "High" | "Critical",
      "ageSpecificPrecautions": string[],
      "maskRecommendation": string,
      "scheduleShifts": [
        {
          "activity": string,
          "originalTime": string,
          "proposedTime": string,
          "reason": string,
          "exposureReductionPct": number,
          "suggestedMode": string
        }
      ],
      "medicalAdvisory": string,
      "activityRestrictions": string[]
    }
  ],
  "overallRiskSummary": string
}
`;

  const geminiTiers = MODEL_WATERFALL.filter((m) => m !== "deterministic-fallback");

  for (const modelTier of geminiTiers) {
    const tierStart = Date.now();
    try {
      const model = genAI.getGenerativeModel({
        model: modelTier,
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.2,
        },
      });

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const parsed = JSON.parse(text) as HouseholdAdviceResponse;

      if (parsed && parsed.combinedStrategy && Array.isArray(parsed.memberAdvice)) {
        attempts.push({
          model: modelTier,
          status: "success",
          durationMs: Date.now() - tierStart,
        });

        return {
          ...parsed,
          generatedAt: new Date().toISOString(),
          meta: {
            engine: modelTier,
            aqiLevel: telemetry.overallAqi,
          },
        };
      }
      throw new Error(`Incomplete JSON schema returned from ${modelTier}`);
    } catch (err: any) {
      console.warn(`[SmogAssistant Waterfall] Household advice on ${modelTier} failed: ${err?.message || err}. Falling back...`);
      attempts.push({
        model: modelTier,
        status: "failed",
        durationMs: Date.now() - tierStart,
        error: err?.message || String(err),
      });
    }
  }

  // Final fallback to deterministic engine
  const fallback = generateDeterministicHouseholdAdvice(telemetry, members);
  return {
    ...fallback,
    meta: {
      ...fallback.meta,
      engine: "deterministic-fallback",
    },
  };
}

/**
 * Generate full structured daily air quality and mitigation recommendations
 * using the Multi-Model Waterfall.
 */
export async function generateMultiModelRecommendations(
  telemetry: AirQualityTelemetry,
  context: UserContextProfile,
  overrideApiKey?: string
): Promise<AIRecommendationResponse> {
  const startTime = Date.now();
  const apiKey = cleanApiKey(overrideApiKey || process.env.GEMINI_API_KEY);

  if (!apiKey) {
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

  const attempts: WaterfallAttempt[] = [];
  const genAI = new GoogleGenerativeAI(apiKey);

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
        "timeWindow": string,
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
    "currentMode": "${context.primaryCommuteMode}",
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

  const geminiTiers = MODEL_WATERFALL.filter((m) => m !== "deterministic-fallback");

  for (const modelTier of geminiTiers) {
    const tierStart = Date.now();
    try {
      const model = genAI.getGenerativeModel({
        model: modelTier,
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.3,
        },
      });

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const parsed = JSON.parse(text) as AIRecommendationResponse;

      if (parsed && parsed.airQualitySummary && parsed.morningBriefing) {
        attempts.push({
          model: modelTier,
          status: "success",
          durationMs: Date.now() - tierStart,
        });

        return {
          ...parsed,
          meta: {
            generatedAt: new Date().toISOString(),
            engine: "gemini-genai",
            modelUsed: modelTier,
            executionTimeMs: Date.now() - startTime,
          },
        };
      }
      throw new Error(`Incomplete schema from ${modelTier}`);
    } catch (err: any) {
      console.warn(`[SmogAssistant Waterfall] Recommendations on ${modelTier} failed: ${err?.message || err}. Cascading...`);
      attempts.push({
        model: modelTier,
        status: "failed",
        durationMs: Date.now() - tierStart,
        error: err?.message || String(err),
      });
    }
  }

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
