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
      const sanitizedKey = typeof geminiKey === "string" 
        ? geminiKey.replace(/['"\r\n\t]/g, "").trim() 
        : "";

      if (sanitizedKey.length === 0) {
        results.gemini = { valid: false, message: "Gemini API key is empty." };
      } else if (sanitizedKey.length < 10 || sanitizedKey.length > 512) {
        results.gemini = { valid: false, message: "Invalid Gemini API key length." };
      } else {
        results.gemini = await verifyGeminiKey(sanitizedKey);
      }
    }

    // Validate WAQI Token if requested or provided
    if ((type === "waqi" || type === "all") && waqiToken !== undefined) {
      const sanitizedToken = typeof waqiToken === "string" 
        ? waqiToken.replace(/['"\r\n\t]/g, "").trim() 
        : "";

      if (sanitizedToken.length === 0) {
        results.waqi = { valid: false, message: "WAQI API token is empty." };
      } else if (sanitizedToken.length < 5 || sanitizedToken.length > 256) {
        results.waqi = { valid: false, message: "Invalid WAQI API token length." };
      } else {
        results.waqi = await verifyWaqiToken(sanitizedToken);
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
