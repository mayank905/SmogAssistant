import { describe, it, expect, vi, beforeEach } from "vitest";
import { verifyWaqiToken, getAqicnTileLayerUrl } from "./waqi";

describe("WAQI API & Tile Layer Helpers", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should fail validation if token is empty", async () => {
    const res = await verifyWaqiToken("");
    expect(res.valid).toBe(false);
    expect(res.message).toContain("empty");
  });

  it("should generate correct AQICN tile layer URL with token", () => {
    const url = getAqicnTileLayerUrl("usepa-pm25", "demo_token_123");
    expect(url).toBe("https://tiles.aqicn.org/tiles/usepa-pm25/{z}/{x}/{y}.png?token=demo_token_123");
  });

  it("should correctly handle valid WAQI mock response", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        status: "ok",
        data: {
          aqi: 345,
          city: { name: "Anand Vihar, Delhi", geo: [28.64, 77.31] },
        },
      }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const res = await verifyWaqiToken("valid_token_abc");
    expect(res.valid).toBe(true);
    expect(res.stationName).toBe("Anand Vihar, Delhi");
  });

  it("should correctly handle invalid WAQI token error response", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        status: "error",
        data: "Invalid key",
      }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const res = await verifyWaqiToken("invalid_key_xyz");
    expect(res.valid).toBe(false);
    expect(res.message).toContain("Invalid key");
  });
});
