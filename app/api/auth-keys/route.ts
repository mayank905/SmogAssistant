import { NextRequest, NextResponse } from "next/server";
import { verifyGeminiKey } from "@/lib/ai/gemini-client";
import { verifyWaqiToken } from "@/lib/api/waqi";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type = "all", geminiKey, waqiToken } = body;

    const results: {
      gemini?: { valid: boolean; message: string };
      waqi?: { valid: boolean; message: string; stationName?: string };
    } = {};

    // Validate Gemini Key if requested or provided
    if ((type === "gemini" || type === "all") && geminiKey !== undefined) {
      if (!geminiKey || geminiKey.trim() === "") {
        results.gemini = { valid: false, message: "Gemini API key is empty." };
      } else {
        results.gemini = await verifyGeminiKey(geminiKey);
      }
    }

    // Validate WAQI Token if requested or provided
    if ((type === "waqi" || type === "all") && waqiToken !== undefined) {
      if (!waqiToken || waqiToken.trim() === "") {
        results.waqi = { valid: false, message: "WAQI API token is empty." };
      } else {
        results.waqi = await verifyWaqiToken(waqiToken);
      }
    }

    return NextResponse.json(results);
  } catch (error: any) {
    console.error("Auth keys validation error:", error);
    return NextResponse.json(
      { error: "Validation processing failed", details: error?.message },
      { status: 500 }
    );
  }
}
