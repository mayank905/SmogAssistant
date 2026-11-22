import { NextRequest, NextResponse } from "next/server";
import { queryCopilotWithGuardrails } from "@/lib/ai/multi-model-client";
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

    const result = await queryCopilotWithGuardrails(query, telemetry, context, clientKey);
    return NextResponse.json({ 
      response: result.response,
      refused: result.refused,
      modelUsed: result.modelUsed,
      category: result.category,
      executionTimeMs: result.executionTimeMs,
      attempts: result.attempts,
    });
  } catch (error: any) {
    console.error("Copilot chat query error:", error);
    return NextResponse.json(
      { error: "Failed to generate copilot response", details: error?.message },
      { status: 500 }
    );
  }
}
