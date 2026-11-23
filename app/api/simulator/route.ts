import { NextRequest, NextResponse } from "next/server";
import { generateAiSimulationAlternatives } from "@/lib/ai/multi-model-client";
import { 
  ScheduleItemSimulation, 
  evaluateScheduleItem, 
  buildSimulationResult, 
  estimatePm25FromAqi 
} from "@/lib/decision-simulator";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { schedule, currentAqi = 280, ambientPm25: customPm25, apiKey } = body;

    if (!Array.isArray(schedule) || schedule.length === 0) {
      return NextResponse.json({ error: "Invalid or empty schedule provided" }, { status: 400 });
    }

    // Defensive check & sanitize client-provided Gemini key
    let clientKey = request.headers.get("x-gemini-key") || apiKey;
    if (clientKey) {
      if (typeof clientKey !== "string") {
        return NextResponse.json({ error: "Invalid Gemini API Key format." }, { status: 400 });
      }
      clientKey = clientKey.replace(/['"\r\n\t]/g, "").trim();
      if (clientKey.length < 10 || clientKey.length > 512) {
        clientKey = undefined; // Gracefully drop malformed key and fall back to heuristics
      }
    }

    const aqiNum = typeof currentAqi === "number" ? currentAqi : 280;
    const pm25Val = typeof customPm25 === "number" ? customPm25 : estimatePm25FromAqi(aqiNum);

    // Evaluate baseline schedule using physical formulas
    const evaluatedBaseline = schedule.map((item: ScheduleItemSimulation) =>
      evaluateScheduleItem(item, pm25Val)
    );

    // Generate AI alternative or deterministic alternative
    const { alternativeSchedule, engineUsed } = await generateAiSimulationAlternatives(
      evaluatedBaseline,
      aqiNum,
      pm25Val,
      clientKey
    );

    const fullResult = buildSimulationResult(evaluatedBaseline, alternativeSchedule);

    return NextResponse.json({
      ...fullResult,
      engineUsed,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal simulator error";
    console.error("Simulator API error:", message);
    return NextResponse.json(
      { error: "Failed to generate simulation alternatives", details: message },
      { status: 500 }
    );
  }
}
