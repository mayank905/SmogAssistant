# ADR 0005: In-UI Key Management, AQICN Map Tile Layers, and Named Personalized Profiles

## Status
Accepted

## Context
Initial iterations of SmogAssistant relied on zero-configuration offline deterministic fallbacks or server-side environment variables (`GEMINI_API_KEY`, `WAQI_API_TOKEN`). In practical hackathon and user evaluation settings:
1. Evaluators and users need the freedom to provide their own personal Gemini and WAQI developer keys directly within the UI, verify them live with one click, and immediately observe corresponding features unlock in real-time.
2. Next.js React hydration warnings occurred due to server-side `toLocaleTimeString()` evaluation differing from the client's local browser timezone, as well as non-deterministic timestamps in preset scenarios.
3. Users requested geospatial visualization of regional smog plumes via `aqicn.org` map tile layers (`usepa-aqi`, `usepa-pm25`, `usepa-pm10`, `usepa-no2`).
4. Users have multiple environments (e.g., home with children and asthmatic grandparents vs an office in Gurugram) and needed an easy mechanism to save, name, and switch between personalized household profiles without retyping configuration each time.

## Decisions

1. **Client-Managed API Keys with In-App Live Verification**:
   - Implemented an `ApiKeyModal` with password toggles for `GEMINI_API_KEY` and `WAQI_API_TOKEN`.
   - Created `/api/auth-keys` route to validate keys asynchronously against upstream APIs (lightweight model check for Gemini, feed query for WAQI).
   - Validated keys are stored in `localStorage` (`smogassistant_gemini_key`, `smogassistant_waqi_token`) and passed to backend endpoints via request headers (`x-gemini-key`, `x-waqi-token`).
   - Authenticated state unlocks:
     - **Gemini**: Pulsing green badge in Header, GenAI live morning briefing synthesis, and interactive `GeminiCopilotChat` allowing users to ask bespoke questions about air quality.
     - **WAQI**: Live AQICN raster map tiles with multi-pollutant layers, verified ground station metadata, and real-time station feeds.

2. **React Hydration Mismatch Resolution**:
   - Added `suppressHydrationWarning` to `<html>` and `<body>` in `app/layout.tsx`.
   - Replaced dynamic `new Date().toISOString()` in `lib/api/scenario-presets.ts` with deterministic base timestamps.
   - Enforced client-side `isMounted` checks and fallback rendering for all localized timestamp displays (`components/LiveTelemetryCard.tsx`, `app/page.tsx`).

3. **Leaflet & AQICN Map Integration**:
   - Integrated Leaflet dynamic client-side rendering (`components/AqiMapView.tsx`) with OpenStreetMap base tiles and AQICN tile overlays (`https://tiles.aqicn.org/tiles/{layer}/{z}/{x}/{y}.png?token={token}`).
   - Provided interactive layer toggling for AQI, PM2.5, PM10, NO2, and O3.
   - Designed dual-state presentation: Preview Mode (with CTA to connect token) vs Live Tiles Active.

4. **Named Profile Management**:
   - Extended `UserContextProfile` with `profileName`.
   - Introduced `SavedProfile` interface and persistent storage in `localStorage` (`smogassistant_saved_profiles`).
   - Enhanced `ContextProfiler` with tabbed configuration, "Save as New Profile" naming, and a saved profiles gallery for 1-click routine switching.

## Consequences
- **Positive**: Eliminates friction for hackathon judges testing with custom API keys; eliminates hydration warnings; gives users geospatial visual insights into pollution; provides seamless switching between work and home health profiles.
- **Resilience**: The app remains 100% operational in offline/fallback mode if no keys are provided, preserving zero-setup evaluation.
