import { AirQualityTelemetry, CpcbCategory } from "@/types/aqi";
import { calculatePm10SubIndex, calculatePm25SubIndex, getCpcbCategory } from "../aqi-calculator";
import { SCENARIO_PRESETS } from "./scenario-presets";
import { logger } from "@/lib/utils/logger";

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes
const MAX_CACHE_ENTRIES = 500; // Maximum items in memory to guarantee bounded footprint
const memoryCache = new Map<string, CacheEntry<unknown>>();

function getFromCache<T>(key: string): T | null {
  const entry = memoryCache.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    memoryCache.delete(key);
    return null;
  }
  // LRU Refresh: re-insert so it becomes the most recently accessed
  memoryCache.delete(key);
  memoryCache.set(key, entry);
  return entry.data;
}

function setInCache<T>(key: string, data: T, ttlMs: number = CACHE_TTL_MS): void {
  // If key already exists, delete first to refresh its LRU position
  if (memoryCache.has(key)) {
    memoryCache.delete(key);
  } else if (memoryCache.size >= MAX_CACHE_ENTRIES) {
    // Evict least-recently used entry (first entry in Map insertion order)
    const oldestKey = memoryCache.keys().next().value;
    if (oldestKey) {
      memoryCache.delete(oldestKey);
    }
  }

  memoryCache.set(key, {
    data,
    expiresAt: Date.now() + ttlMs,
  });
}

interface RawGeocodingItem {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  admin1?: string;
}

export interface GeocodingResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  admin1?: string;
}

/**
 * Searches for cities via Open-Meteo Geocoding API (Zero-API Key required)
 */
export async function searchCities(query: string): Promise<GeocodingResult[]> {
  const trimmed = query.trim();
  if (!trimmed || trimmed.length < 2) return [];

  const cacheKey = `geo:${trimmed.toLowerCase()}`;
  const cached = getFromCache<GeocodingResult[]>(cacheKey);
  if (cached) return cached;

  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(trimmed)}&count=5&language=en&format=json`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Geocoding failed with status: ${res.status}`);
    
    const data = await res.json();
    const results: GeocodingResult[] = (data.results || []).map((item: RawGeocodingItem) => ({
      id: item.id,
      name: item.name,
      latitude: item.latitude,
      longitude: item.longitude,
      country: item.country || "",
      admin1: item.admin1 || "",
    }));

    setInCache(cacheKey, results, 60 * 60 * 1000); // 1 hr cache for geo
    return results;
  } catch (error) {
    logger.warn("Geocoding fetch error:", error);
    // Fallback: match predefined scenario cities if offline
    return SCENARIO_PRESETS
      .filter(p => p.telemetry.location.city.toLowerCase().includes(trimmed.toLowerCase()))
      .map((p, idx) => ({
        id: idx + 999,
        name: p.telemetry.location.city,
        latitude: p.telemetry.location.latitude,
        longitude: p.telemetry.location.longitude,
        country: "India",
      }));
  }
}

/**
 * Fetches real-time Air Quality telemetry from Open-Meteo with WAQI extension support
 */
export async function fetchLiveAirQuality(
  latitude: number, 
  longitude: number, 
  cityName: string
): Promise<AirQualityTelemetry> {
  const cacheKey = `aqi:${latitude.toFixed(2)},${longitude.toFixed(2)}`;
  const cached = getFromCache<AirQualityTelemetry>(cacheKey);
  if (cached) return cached;

  // 1. Check if WAQI token is configured for official ground-station readings
  const waqiToken = process.env.WAQI_API_TOKEN;
  if (waqiToken) {
    try {
      const waqiRes = await fetch(`https://api.waqi.info/feed/geo:${latitude};${longitude}/?token=${waqiToken}`);
      if (waqiRes.ok) {
        const waqiData = await waqiRes.json();
        if (waqiData.status === "ok" && waqiData.data) {
          const iaqi = waqiData.data.iaqi || {};
          const pm25Val = iaqi.pm25?.v ?? 45;
          const pm10Val = iaqi.pm10?.v ?? 75;
          const aqiVal = waqiData.data.aqi ?? calculatePm25SubIndex(pm25Val);
          
          const result: AirQualityTelemetry = {
            location: {
              city: cityName || waqiData.data.city?.name || "Ground Station",
              latitude,
              longitude,
              stationName: waqiData.data.city?.name,
            },
            timestamp: new Date().toISOString(),
            overallAqi: aqiVal,
            cpcbCategory: getCpcbCategory(aqiVal),
            primaryPollutant: waqiData.data.dominentpol?.toUpperCase() || "PM2.5",
            pollutants: {
              pm25: { value: pm25Val, unit: "µg/m³", subIndex: calculatePm25SubIndex(pm25Val) },
              pm10: { value: pm10Val, unit: "µg/m³", subIndex: calculatePm10SubIndex(pm10Val) },
              no2: iaqi.no2 ? { value: iaqi.no2.v, unit: "µg/m³" } : undefined,
              so2: iaqi.so2 ? { value: iaqi.so2.v, unit: "µg/m³" } : undefined,
              o3: iaqi.o3 ? { value: iaqi.o3.v, unit: "µg/m³" } : undefined,
              co: iaqi.co ? { value: iaqi.co.v, unit: "mg/m³" } : undefined,
            },
            source: "waqi",
          };

          setInCache(cacheKey, result);
          return result;
        }
      }
    } catch (e) {
      logger.warn("WAQI station fetch failed, falling back to Open-Meteo:", e);
    }
  }

  // 2. Open-Meteo Air Quality API (No key required)
  try {
    const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}&current=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,european_aqi,us_aqi&hourly=pm10,pm2_5,european_aqi,us_aqi&timezone=auto&forecast_days=2`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Open-Meteo returned status ${res.status}`);

    const data = await res.json();
    const current = data.current || {};
    const pm25 = Number(current.pm2_5 ?? 35);
    const pm10 = Number(current.pm10 ?? 65);
    const no2 = Number(current.nitrogen_dioxide ?? 25);
    const so2 = Number(current.sulphur_dioxide ?? 15);
    const o3 = Number(current.ozone ?? 40);
    const co = Number(current.carbon_monoxide ?? 400) / 1000; // convert µg/m³ to mg/m³

    const pm25Sub = calculatePm25SubIndex(pm25);
    const pm10Sub = calculatePm10SubIndex(pm10);
    const overallAqi = Math.max(pm25Sub, pm10Sub);
    const category: CpcbCategory = getCpcbCategory(overallAqi);
    const primary = pm25Sub >= pm10Sub ? "PM2.5" : "PM10";

    // Hourly outlook for rest of day
    const hourly = data.hourly || {};
    const times: string[] = hourly.time || [];
    const pm25List: number[] = hourly.pm2_5 || [];
    const hourlyForecast = times.slice(0, 12).map((timeStr, idx) => {
      const pmVal = pm25List[idx] ?? pm25;
      const sub = calculatePm25SubIndex(pmVal);
      const hour = new Date(timeStr).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
      return {
        time: hour || timeStr.split("T")[1] || "12:00",
        aqi: sub,
        pm25: Math.round(pmVal * 10) / 10,
      };
    });

    const result: AirQualityTelemetry = {
      location: {
        city: cityName || "Target City",
        latitude,
        longitude,
      },
      timestamp: new Date().toISOString(),
      overallAqi,
      cpcbCategory: category,
      primaryPollutant: primary,
      pollutants: {
        pm25: { value: Math.round(pm25 * 10) / 10, unit: "µg/m³", subIndex: pm25Sub },
        pm10: { value: Math.round(pm10 * 10) / 10, unit: "µg/m³", subIndex: pm10Sub },
        no2: { value: Math.round(no2 * 10) / 10, unit: "µg/m³" },
        so2: { value: Math.round(so2 * 10) / 10, unit: "µg/m³" },
        o3: { value: Math.round(o3 * 10) / 10, unit: "µg/m³" },
        co: { value: Math.round(co * 10) / 10, unit: "mg/m³" },
      },
      hourlyForecast,
      source: "open-meteo",
    };

    setInCache(cacheKey, result);
    return result;
  } catch (error) {
    logger.warn("Live AQI fetch failed, using fallback scenario:", error);
    // Graceful fallback to Delhi Severe preset
    const fallback = SCENARIO_PRESETS[0].telemetry;
    return {
      ...fallback,
      location: {
        ...fallback.location,
        city: cityName || fallback.location.city,
      },
      isSimulated: true,
    };
  }
}
