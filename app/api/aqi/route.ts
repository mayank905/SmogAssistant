import { NextRequest, NextResponse } from "next/server";
import { searchCities, fetchLiveAirQuality } from "@/lib/api/open-meteo";
import { SCENARIO_PRESETS } from "@/lib/api/scenario-presets";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const scenarioId = searchParams.get("scenario");
    const search = searchParams.get("search");
    const city = searchParams.get("city");
    const latParam = searchParams.get("lat");
    const lonParam = searchParams.get("lon");

    // 1. If searching for cities for auto-complete
    if (search) {
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

    // 3. If explicit coordinates are provided
    if (latParam && lonParam) {
      const lat = parseFloat(latParam);
      const lon = parseFloat(lonParam);
      if (!isNaN(lat) && !isNaN(lon)) {
        const telemetry = await fetchLiveAirQuality(lat, lon, city || "Target Location");
        return NextResponse.json({ telemetry });
      }
    }

    // 4. If city name is provided, geocode and fetch
    if (city) {
      const cities = await searchCities(city);
      if (cities.length > 0) {
        const target = cities[0];
        const telemetry = await fetchLiveAirQuality(target.latitude, target.longitude, target.name);
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
  } catch (error: any) {
    console.error("AQI API route error:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch air quality telemetry", 
        fallback: SCENARIO_PRESETS[0].telemetry 
      },
      { status: 500 }
    );
  }
}
