import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { GET as aqiGet } from "@/app/api/aqi/route";
import { POST as authKeysPost } from "@/app/api/auth-keys/route";
import { POST as chatPost } from "@/app/api/chat/route";
import { POST as recommendationsPost } from "@/app/api/recommendations/route";
import { POST as simulatorPost } from "@/app/api/simulator/route";
import { SCENARIO_PRESETS } from "@/lib/api/scenario-presets";

describe("API Route Handlers Integration & Security", () => {
  describe("GET /api/aqi", () => {
    it("returns scenario preset telemetry when scenario parameter matches", async () => {
      const req = new NextRequest("http://localhost:3000/api/aqi?scenario=delhi-winter-severe");
      const res = await aqiGet(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.telemetry).toBeDefined();
      expect(data.telemetry.overallAqi).toBe(468);
      expect(data.presetMeta).toBeDefined();
      expect(data.presetMeta.id).toBe("delhi-winter-severe");
    });

    it("returns search results array for valid city queries", async () => {
      const req = new NextRequest("http://localhost:3000/api/aqi?search=Delhi");
      const res = await aqiGet(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(Array.isArray(data.results)).toBe(true);
    });

    it("returns default Delhi Severe telemetry when no query parameters are provided", async () => {
      const req = new NextRequest("http://localhost:3000/api/aqi");
      const res = await aqiGet(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.telemetry).toBeDefined();
      expect(data.telemetry.overallAqi).toBeGreaterThan(0);
    });
  });

  describe("POST /api/auth-keys", () => {
    it("returns 400 error when request body is not valid JSON", async () => {
      const req = new NextRequest("http://localhost:3000/api/auth-keys", {
        method: "POST",
        body: "{malformed-json",
      });
      const res = await authKeysPost(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("Invalid JSON");
    });

    it("returns 400 error when validation type is invalid", async () => {
      const req = new NextRequest("http://localhost:3000/api/auth-keys", {
        method: "POST",
        body: JSON.stringify({ type: "unsupported-type" }),
      });
      const res = await authKeysPost(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("Invalid validation type");
    });

    it("validates empty Gemini API key gracefully without crashing", async () => {
      const req = new NextRequest("http://localhost:3000/api/auth-keys", {
        method: "POST",
        body: JSON.stringify({ type: "gemini", geminiKey: "" }),
      });
      const res = await authKeysPost(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.gemini).toBeDefined();
      expect(data.gemini.valid).toBe(false);
    });

    it("validates empty WAQI token gracefully without crashing", async () => {
      const req = new NextRequest("http://localhost:3000/api/auth-keys", {
        method: "POST",
        body: JSON.stringify({ type: "waqi", waqiToken: "" }),
      });
      const res = await authKeysPost(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.waqi).toBeDefined();
      expect(data.waqi.valid).toBe(false);
    });
  });

  describe("POST /api/chat", () => {
    it("returns 400 error on malformed JSON body", async () => {
      const req = new NextRequest("http://localhost:3000/api/chat", {
        method: "POST",
        body: "bad-body",
      });
      const res = await chatPost(req);
      expect(res.status).toBe(400);
    });

    it("returns 400 error when query is missing", async () => {
      const req = new NextRequest("http://localhost:3000/api/chat", {
        method: "POST",
        body: JSON.stringify({}),
      });
      const res = await chatPost(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("Query string is required");
    });

    it("returns 400 error when query is empty whitespace", async () => {
      const req = new NextRequest("http://localhost:3000/api/chat", {
        method: "POST",
        body: JSON.stringify({ query: "   " }),
      });
      const res = await chatPost(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("Query cannot be empty");
    });

    it("returns 400 error when query exceeds 1000 characters", async () => {
      const longQuery = "a".repeat(1001);
      const req = new NextRequest("http://localhost:3000/api/chat", {
        method: "POST",
        body: JSON.stringify({ query: longQuery }),
      });
      const res = await chatPost(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("exceeds maximum allowed limit");
    });

    it("successfully evaluates in-scope air quality queries", async () => {
      const req = new NextRequest("http://localhost:3000/api/chat", {
        method: "POST",
        body: JSON.stringify({
          query: "What is the inversion risk and should my asthmatic child go to school?",
          telemetry: SCENARIO_PRESETS[0].telemetry,
        }),
      });
      const res = await chatPost(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.response).toBeDefined();
      expect(data.refused).toBe(false);
      expect(data.category).toBe("environmental-health");
    });

    it("safely enforces domain guardrails against off-topic queries", async () => {
      const req = new NextRequest("http://localhost:3000/api/chat", {
        method: "POST",
        body: JSON.stringify({
          query: "Write a python script to scrape stock prices from Yahoo Finance",
        }),
      });
      const res = await chatPost(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.refused).toBe(true);
      expect(data.category).toBe("off-topic");
    });
  });

  describe("POST /api/recommendations", () => {
    it("returns 400 on malformed JSON payload", async () => {
      const req = new NextRequest("http://localhost:3000/api/recommendations", {
        method: "POST",
        body: "invalid",
      });
      const res = await recommendationsPost(req);
      expect(res.status).toBe(400);
    });

    it("returns 400 when members is not an array", async () => {
      const req = new NextRequest("http://localhost:3000/api/recommendations", {
        method: "POST",
        body: JSON.stringify({ members: "not-an-array" }),
      });
      const res = await recommendationsPost(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("must be an array");
    });

    it("generates deterministic fallback recommendations when no API key provided", async () => {
      const req = new NextRequest("http://localhost:3000/api/recommendations", {
        method: "POST",
        body: JSON.stringify({
          telemetry: SCENARIO_PRESETS[0].telemetry,
        }),
      });
      const res = await recommendationsPost(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.dailyRoutinePlan).toBeDefined();
      expect(data.indoorMitigation).toBeDefined();
      expect(data.sustainableCommute).toBeDefined();
    });
  });

  describe("POST /api/simulator", () => {
    it("returns 400 on malformed JSON body", async () => {
      const req = new NextRequest("http://localhost:3000/api/simulator", {
        method: "POST",
        body: "{broken-json",
      });
      const res = await simulatorPost(req);
      expect(res.status).toBe(400);
    });

    it("returns 400 when schedule is missing or empty", async () => {
      const req = new NextRequest("http://localhost:3000/api/simulator", {
        method: "POST",
        body: JSON.stringify({ schedule: [] }),
      });
      const res = await simulatorPost(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("Invalid or empty schedule");
    });

    it("correctly simulates schedule and calculates delta consequences", async () => {
      const sampleSchedule = [
        {
          id: "item-1",
          time: "07:00 AM",
          activity: "Morning Jog",
          commuteMode: "walk",
          locationType: "outdoor",
          durationMinutes: 45,
          isHighIntensity: true,
          isMasked: false,
        },
      ];

      const req = new NextRequest("http://localhost:3000/api/simulator", {
        method: "POST",
        body: JSON.stringify({
          schedule: sampleSchedule,
          currentAqi: 350,
          ambientPm25: 180,
        }),
      });
      const res = await simulatorPost(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.baselineMetrics).toBeDefined();
      expect(data.alternativeMetrics).toBeDefined();
      expect(data.deltas).toBeDefined();
      expect(data.alternativeSchedule.length).toBeGreaterThan(0);
    });
  });
});
