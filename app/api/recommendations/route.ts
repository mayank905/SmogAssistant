import { NextRequest, NextResponse } from "next/server";
import { 
  generateMultiModelRecommendations, 
  generateHouseholdAdvice 
} from "@/lib/ai/multi-model-client";
import { AirQualityTelemetry } from "@/types/aqi";
import { UserContextProfile, DEFAULT_USER_CONTEXT } from "@/types/context";
import { SCENARIO_PRESETS } from "@/lib/api/scenario-presets";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const telemetry: AirQualityTelemetry = body.telemetry || SCENARIO_PRESETS[0].telemetry;
    const context: UserContextProfile = body.context || DEFAULT_USER_CONTEXT;
    const members = body.members;
    
    // Check for client-provided Gemini key from header or body
    const clientKey = request.headers.get("x-gemini-key") || body.apiKey;

    // If client specifically requests household advice or only provides members
    if (body.action === "household" || (members && !body.context && !body.includeGeneral)) {
      const householdAdvice = await generateHouseholdAdvice(telemetry, members, clientKey);
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
  } catch (error: any) {
    console.error("Recommendations API error:", error);
    return NextResponse.json(
      { error: "Failed to generate recommendations", details: error?.message },
      { status: 500 }
    );
  }
}
