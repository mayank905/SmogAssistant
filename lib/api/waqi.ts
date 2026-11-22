/**
 * WAQI (World Air Quality Index) & AQICN.org API Client
 * Provides ground monitoring station telemetry, token verification, and map tile URLs.
 */

export interface WaqiVerificationResult {
  valid: boolean;
  message: string;
  stationName?: string;
}

export interface WaqiStationData {
  aqi: number;
  stationName: string;
  coordinates: [number, number];
  dominantPollutant: string;
  time: string;
  iaqi?: Record<string, { v: number }>;
}

/**
 * Validates a WAQI / AQICN API token by testing against WAQI feed endpoint
 */
export async function verifyWaqiToken(token: string): Promise<WaqiVerificationResult> {
  if (!token || token.trim().length === 0) {
    return { valid: false, message: "WAQI API token cannot be empty" };
  }

  try {
    const cleanToken = token.trim();
    // Test against a known well-monitored ground station (Delhi or geo feed)
    const url = `https://api.waqi.info/feed/delhi/?token=${cleanToken}`;
    const res = await fetch(url, { cache: "no-store" });

    if (!res.ok) {
      return { valid: false, message: `WAQI server responded with HTTP status ${res.status}` };
    }

    const data = await res.json();
    if (data.status === "ok") {
      const station = data.data?.city?.name || "Ground Station";
      return {
        valid: true,
        message: "WAQI token verified! Connected to aqicn.org global station network.",
        stationName: station,
      };
    } else {
      const err = data.data || data.message || "Invalid or expired WAQI token";
      return { valid: false, message: typeof err === "string" ? err : "Invalid WAQI token" };
    }
  } catch (error: any) {
    return {
      valid: false,
      message: `Failed to connect to aqicn.org: ${error?.message || "Network error"}`,
    };
  }
}

/**
 * Fetch real-time ground station data from WAQI by coordinates
 */
export async function fetchWaqiByCoordinates(
  lat: number,
  lon: number,
  token: string
): Promise<WaqiStationData | null> {
  if (!token) return null;

  try {
    const url = `https://api.waqi.info/feed/geo:${lat};${lon}/?token=${token.trim()}`;
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) return null;

    const data = await res.json();
    if (data.status !== "ok" || !data.data) return null;

    return {
      aqi: data.data.aqi,
      stationName: data.data.city?.name || "WAQI Ground Monitor",
      coordinates: data.data.city?.geo || [lat, lon],
      dominantPollutant: data.data.dominentpol || "pm25",
      time: data.data.time?.iso || new Date().toISOString(),
      iaqi: data.data.iaqi,
    };
  } catch (err) {
    console.warn("Failed to fetch WAQI station data:", err);
    return null;
  }
}

/**
 * Helper to build AQICN Tile Layer URL
 */
export function getAqicnTileLayerUrl(layer: string = "usepa-aqi", token: string): string {
  return `https://tiles.aqicn.org/tiles/${layer}/{z}/{x}/{y}.png?token=${encodeURIComponent(token.trim())}`;
}
