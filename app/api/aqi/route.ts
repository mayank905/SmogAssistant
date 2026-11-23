import { NextRequest, NextResponse } from "next/server";
import { searchCities, fetchLiveAirQuality } from "@/lib/api/open-meteo";
import { SCENARIO_PRESETS } from "@/lib/api/scenario-presets";
import { fetchWaqiByCoordinates } from "@/lib/api/waqi";
import { AirQualityTelemetry } from "@/types/aqi";
import { logger } from "@/lib/utils/logger";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const rawScenarioId = searchParams.get("scenario");
    const rawSearch = searchParams.get("search");
    const rawCity = searchParams.get("city");
    const latParam = searchParams.get("lat");
    const lonParam = searchParams.get("lon");
    const rawWaqiToken = request.headers.get("x-waqi-token") || searchParams.get("waqiToken");

    // Sanitize parameters
    const search = rawSearch ? rawSearch.replace(/[^\w\s.,-]/g, "").trim().slice(0, 100) : null;
    const city = rawCity ? rawCity.replace(/[^\w\s.,-]/g, "").trim().slice(0, 100) : null;
    const scenarioId = rawScenarioId ? rawScenarioId.replace(/[^\w-]/g, "").trim().slice(0, 50) : null;
    const waqiToken = rawWaqiToken ? rawWaqiToken.replace(/[^\w-]/g, "").trim().slice(0, 128) : null;

    // 1. If searching for cities for auto-complete
    if (search && search.length >= 2) {
      const results = await searchCities(search);
      return NextResponse.json({ results });
    }

    // 2. If judge scenario preset is requested
    if (scenarioId) {
      const preset = SCENARIO_PRESETS.find(p => p.id === scenarioId);
      if (preset) {
        return NextResponse.json({
          telemetry: preset.telemetry,
          presetMeta: {
            id: preset.id,
            title: preset.title,
            description: preset.description,
          },
        });
      }
    }

    // Helper to enrich with WAQI if token is available
    const enrichWithWaqi = async (telemetry: AirQualityTelemetry, lat: number, lon: number): Promise<AirQualityTelemetry> => {
      if (!waqiToken) return telemetry;
      try {
        const waqiData = await fetchWaqiByCoordinates(lat, lon, waqiToken);
        if (waqiData && typeof waqiData.aqi === "number") {
          return {
            ...telemetry,
            overallAqi: waqiData.aqi,
            location: {
              ...telemetry.location,
              stationName: waqiData.stationName,
            },
            source: "waqi",
            isSimulated: false,
          };
        }
      } catch (e) {
        logger.warn("WAQI enrichment skipped:", e);
      }
      return telemetry;
    };

    // 3. If explicit coordinates are provided (validated within bounds)
    if (latParam && lonParam) {
      const lat = parseFloat(latParam);
      const lon = parseFloat(lonParam);
      if (Number.isFinite(lat) && Number.isFinite(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
        let telemetry = await fetchLiveAirQuality(lat, lon, city || "Target Location");
        telemetry = await enrichWithWaqi(telemetry, lat, lon);
        return NextResponse.json({ telemetry });
      }
    }

    // 4. If city name is provided, geocode and fetch
    if (city && city.length >= 2) {
      const cities = await searchCities(city);
      if (cities.length > 0) {
        const target = cities[0];
        let telemetry = await fetchLiveAirQuality(target.latitude, target.longitude, target.name);
        telemetry = await enrichWithWaqi(telemetry, target.latitude, target.longitude);
        return NextResponse.json({ telemetry });
      }
    }

    // Default: Return Delhi Severe Winter preset
    return NextResponse.json({
      telemetry: SCENARIO_PRESETS[0].telemetry,
      presetMeta: {
        id: SCENARIO_PRESETS[0].id,
        title: SCENARIO_PRESETS[0].title,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal error";
    logger.error("AQI API route error:", message);
    return NextResponse.json(
      { 
        error: "Failed to fetch air quality telemetry", 
        fallback: SCENARIO_PRESETS[0].telemetry 
      },
      { status: 500 }
    );
  }
}
