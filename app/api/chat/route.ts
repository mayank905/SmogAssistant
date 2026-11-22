import { NextRequest, NextResponse } from "next/server";
import { queryGeminiCopilot } from "@/lib/ai/gemini-client";
import { AirQualityTelemetry } from "@/types/aqi";
import { UserContextProfile, DEFAULT_USER_CONTEXT } from "@/types/context";
import { SCENARIO_PRESETS } from "@/lib/api/scenario-presets";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, telemetry = SCENARIO_PRESETS[0].telemetry, context = DEFAULT_USER_CONTEXT, apiKey } = body;

    const clientKey = request.headers.get("x-gemini-key") || apiKey;

    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "Query string is required" }, { status: 400 });
    }

    const responseText = await queryGeminiCopilot(query, telemetry, context, clientKey);
    return NextResponse.json({ response: responseText });
  } catch (error: any) {
    console.error("Copilot chat query error:", error);
    return NextResponse.json(
      { error: "Failed to generate copilot response", details: error?.message },
      { status: 500 }
    );
  }
}
