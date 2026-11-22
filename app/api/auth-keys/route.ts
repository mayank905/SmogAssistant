import { NextRequest, NextResponse } from "next/server";
import { verifyGeminiKey } from "@/lib/ai/gemini-client";
import { verifyWaqiToken } from "@/lib/api/waqi";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type = "all", geminiKey, waqiToken } = body;

    const allowedTypes = ["all", "gemini", "waqi"];
    if (typeof type !== "string" || !allowedTypes.includes(type)) {
      return NextResponse.json({ error: "Invalid validation type specified" }, { status: 400 });
    }

    const results: {
      gemini?: { valid: boolean; message: string };
      waqi?: { valid: boolean; message: string; stationName?: string };
    } = {};

    // Validate Gemini Key if requested or provided
    if ((type === "gemini" || type === "all") && geminiKey !== undefined) {
      if (typeof geminiKey !== "string" || geminiKey.trim() === "") {
        results.gemini = { valid: false, message: "Gemini API key is empty." };
      } else if (geminiKey.length > 256 || !/^[A-Za-z0-9_-]+$/.test(geminiKey.trim())) {
        results.gemini = { valid: false, message: "Malformed Gemini API Key format." };
      } else {
        results.gemini = await verifyGeminiKey(geminiKey.trim());
      }
    }

    // Validate WAQI Token if requested or provided
    if ((type === "waqi" || type === "all") && waqiToken !== undefined) {
      if (typeof waqiToken !== "string" || waqiToken.trim() === "") {
        results.waqi = { valid: false, message: "WAQI API token is empty." };
      } else if (waqiToken.length > 128 || !/^[A-Za-z0-9_-]+$/.test(waqiToken.trim())) {
        results.waqi = { valid: false, message: "Malformed WAQI API Token format." };
      } else {
        results.waqi = await verifyWaqiToken(waqiToken.trim());
      }
    }

    return NextResponse.json(results);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal error";
    console.error("Auth keys validation error:", message);
    return NextResponse.json(
      { error: "Validation processing failed", details: message },
      { status: 500 }
    );
  }
}
