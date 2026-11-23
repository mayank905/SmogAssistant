import { NextRequest, NextResponse } from "next/server";
import { queryCopilotWithGuardrails } from "@/lib/ai/multi-model-client";
import { AirQualityTelemetry } from "@/types/aqi";
import { UserContextProfile, DEFAULT_USER_CONTEXT } from "@/types/context";
import { SCENARIO_PRESETS } from "@/lib/api/scenario-presets";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, telemetry = SCENARIO_PRESETS[0].telemetry, context = DEFAULT_USER_CONTEXT, apiKey } = body;

    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "Query string is required" }, { status: 400 });
    }

    const sanitizedQuery = query.replace(/\0/g, "").trim();
    if (sanitizedQuery.length === 0) {
      return NextResponse.json({ error: "Query cannot be empty" }, { status: 400 });
    }

    if (sanitizedQuery.length > 1000) {
      return NextResponse.json(
        { error: "Query exceeds maximum allowed limit of 1000 characters." },
        { status: 400 }
      );
    }

    // Defensive validation and sanitization for clientKey
    let clientKey = request.headers.get("x-gemini-key") || apiKey;
    if (clientKey) {
      if (typeof clientKey !== "string") {
        return NextResponse.json({ error: "Invalid Gemini API Key format." }, { status: 400 });
      }
      clientKey = clientKey.replace(/['"\r\n\t]/g, "").trim();
      if (clientKey.length < 10 || clientKey.length > 512) {
        return NextResponse.json({ error: "Invalid Gemini API Key length." }, { status: 400 });
      }
    }

    const result = await queryCopilotWithGuardrails(sanitizedQuery, telemetry, context, clientKey);
    return NextResponse.json({ 
      response: result.response,
      refused: result.refused,
      modelUsed: result.modelUsed,
      category: result.category,
      executionTimeMs: result.executionTimeMs,
      attempts: result.attempts,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal processing error";
    console.error("Copilot chat query error:", message);
    return NextResponse.json(
      { error: "Failed to generate copilot response", details: message },
      { status: 500 }
    );
  }
}
