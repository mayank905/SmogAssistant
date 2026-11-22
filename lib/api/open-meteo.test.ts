import { describe, it, expect, vi, beforeEach } from "vitest";
import { searchCities, fetchLiveAirQuality } from "./open-meteo";
import { SCENARIO_PRESETS } from "./scenario-presets";

describe("Open-Meteo Client & Caching", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("loads scenario presets correctly", () => {
    expect(SCENARIO_PRESETS.length).toBeGreaterThanOrEqual(4);
    const delhi = SCENARIO_PRESETS.find(p => p.id === "delhi-winter-severe");
    expect(delhi).toBeDefined();
    expect(delhi?.category).toBe("Severe");
    expect(delhi?.aqi).toBeGreaterThan(400);
  });

  it("handles empty or short search queries safely", async () => {
    const res = await searchCities("");
    expect(res).toEqual([]);
    const resShort = await searchCities("a");
    expect(resShort).toEqual([]);
  });

  it("falls back gracefully when network request fails", async () => {
    // Mock global fetch failure
    global.fetch = vi.fn().mockRejectedValue(new Error("Network offline"));
    
    const telemetry = await fetchLiveAirQuality(28.61, 77.23, "Delhi Fallback");
    expect(telemetry).toBeDefined();
    expect(telemetry.overallAqi).toBeGreaterThan(0);
    expect(telemetry.isSimulated).toBe(true);
  });
});
