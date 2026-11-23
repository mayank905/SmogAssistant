import { NextRequest, NextResponse } from "next/server";
import { 
  generateMultiModelRecommendations, 
  generateHouseholdAdvice 
} from "@/lib/ai/multi-model-client";
import { AirQualityTelemetry } from "@/types/aqi";
import { UserContextProfile, DEFAULT_USER_CONTEXT } from "@/types/context";
import { SCENARIO_PRESETS } from "@/lib/api/scenario-presets";
import { logger } from "@/lib/utils/logger";

interface RecommendationsBody {
  telemetry?: AirQualityTelemetry;
  context?: UserContextProfile;
  members?: unknown;
  apiKey?: string;
  action?: string;
  includeGeneral?: boolean;
}

export async function POST(request: NextRequest) {
  let body: RecommendationsBody;
  try {
    body = (await request.json()) as RecommendationsBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 });
  }

  try {
    const telemetry: AirQualityTelemetry = body.telemetry || SCENARIO_PRESETS[0].telemetry;
    const context: UserContextProfile = body.context || DEFAULT_USER_CONTEXT;
    
    // Defensive validation for members array
    let members = body.members;
    if (members !== undefined) {
      if (!Array.isArray(members)) {
        return NextResponse.json({ error: "Members payload must be an array" }, { status: 400 });
      }
      if (members.length > 20) {
        members = members.slice(0, 20); // Clamp maximum members to prevent payload bombing
      }
    }
    
    // Defensive check and sanitization for client-provided Gemini key
    let clientKey = request.headers.get("x-gemini-key") || body.apiKey;
    if (clientKey) {
      if (typeof clientKey !== "string") {
        return NextResponse.json({ error: "Invalid Gemini API Key format." }, { status: 400 });
      }
      clientKey = clientKey.replace(/['"\r\n\t]/g, "").trim();
      if (clientKey.length < 10 || clientKey.length > 512) {
        return NextResponse.json({ error: "Invalid Gemini API Key length." }, { status: 400 });
      }
    }

    // If client specifically requests household advice or only provides members
    if (body.action === "household" || (members && !body.context && !body.includeGeneral)) {
      const householdAdvice = await generateHouseholdAdvice(telemetry, Array.isArray(members) ? members : [], clientKey);
      return NextResponse.json(householdAdvice);
    }

    const recommendations = await generateMultiModelRecommendations(telemetry, context, clientKey);

    // If members array is also provided, enrich payload with household advice
    if (members && Array.isArray(members)) {
      const householdAdvice = await generateHouseholdAdvice(telemetry, members, clientKey);
      return NextResponse.json({
        ...recommendations,
        householdAdvice,
      });
    }

    return NextResponse.json(recommendations);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal error";
    logger.error("Recommendations API error:", message);
    return NextResponse.json(
      { error: "Failed to generate recommendations", details: message },
      { status: 500 }
    );
  }
}
