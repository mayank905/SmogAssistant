# 02: Live Telemetry, Geocoding & Judge Scenario Presets

**What to build:** An end-to-end real-time air quality telemetry pipeline using Open-Meteo Air Quality & Geocoding APIs (zero keys needed) with an in-memory cache, offline judge simulation presets, a server route `/api/aqi`, and an interactive City Search + Telemetry Dashboard UI.

**Blocked by:** 01: Project Scaffolding, Domain Types & AQI Seam

**Status:** completed

- [x] Implement Open-Meteo geocoding and air quality fetch client in `lib/api/open-meteo.ts`
- [x] Implement in-memory TTL caching (15 mins) to prevent rate limits and optimize latency
- [x] Implement evaluator scenario presets (Delhi Severe Inversion AQI 465, Industrial Smog AQI 320, Clean Coastal AQI 38)
- [x] Create API Route handler `app/api/aqi/route.ts` with input validation and error handling
- [x] Build interactive Dashboard UI with City Search, Live Pollutants Cards (PM2.5, PM10, NO2, SO2, O3, CO), and Scenario Toggle
- [x] Add unit tests for telemetry parsing and scenario fallback in `lib/api/open-meteo.test.ts`
