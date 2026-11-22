import { NextRequest, NextResponse } from "next/server";
import { generateAIRecommendations } from "@/lib/ai/gemini-client";
import { AirQualityTelemetry } from "@/types/aqi";
import { UserContextProfile, DEFAULT_USER_CONTEXT } from "@/types/context";
import { SCENARIO_PRESETS } from "@/lib/api/scenario-presets";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const telemetry: AirQualityTelemetry = body.telemetry || SCENARIO_PRESETS[0].telemetry;
    const context: UserContextProfile = body.context || DEFAULT_USER_CONTEXT;

    const recommendations = await generateAIRecommendations(telemetry, context);
    return NextResponse.json(recommendations);
  } catch (error: any) {
    console.error("Recommendations API error:", error);
    return NextResponse.json(
      { error: "Failed to generate recommendations", details: error?.message },
      { status: 500 }
    );
  }
}
