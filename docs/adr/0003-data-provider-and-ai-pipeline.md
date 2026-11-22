# 3. Live Data Ingestion and GenAI Recommendation Engine

Date: 2026-11-21

## Status
Accepted

## Context
The project must rely on real-time external data (no hardcoded static user data) while avoiding evaluation failure if third-party keys expire or fail during live grading. Furthermore, the GenAI engine must generate personalized recommendations with actionable impact justifications.

## Decision
1. **Zero-Friction Live Data Provider**:
   - Utilize **Open-Meteo Air Quality API** (Copernicus CAMS atmospheric model) and **Open-Meteo Geocoding API** as the primary live telemetry source requiring zero API keys.
   - Support optional **WAQI (World Air Quality Index)** integration for official ground stations (CPCB) when a key is provided.
2. **Defensive Caching & Simulation Fallback**:
   - In-memory time-to-live (TTL) cache (15 minutes) for live pollutant coordinates and readings.
   - Built-in "Evaluation Benchmark Scenarios" allowing judges to toggle realistic winter smog conditions (e.g., Delhi Severe Inversion AQI 465, Moderate Urban AQI 145, Clean Coastal AQI 32).
3. **Structured GenAI Output via Google Gemini**:
   - Use Google Gemini SDK with strict JSON schema enforcement (`response_mime_type: "application/json"`).
   - Structured response contract:
     - `airQualitySummary`: Human-readable condition synthesis.
     - `dailyRoutine`: Hour-by-hour safe exposure windows, activity rescheduling (exercise, transit, school runs).
     - `indoorMitigation`: Actionable hacks (HEPA purifier runtimes, DIY box filters, phytoremediation plant counts tailored to room size).
     - `sustainableCommute`: Alternative transit comparison with calculated PM2.5 avoidance and estimated $CO_2$ emission offsets.
     - `vulnerableAlerts`: Targeted cautions for children, elderly, and asthmatic household members.
   - Robust offline deterministic heuristic fallback if the Gemini API key is not configured or encounters rate limits.

## Consequences
- The application runs out of the box with zero third-party blockers.
- Evaluators can test with full real-time data or switch scenarios during a demo walkthrough.
- All AI outputs are strictly structured and type-safe.
