# 04: Weather-Air Fusion & Proactive Morning Briefing ("Up-Ahead" Planner)

**What to build:** An end-to-end meteorological fusion engine combining hourly weather forecasts (wind speed, temperature inversion) with air quality metrics to deliver a proactive rest-of-day planner (Morning, Midday, Evening, Night) with Web Notifications integration and an instant judge preview button.

**Blocked by:** 03: GenAI Recommendation Pipeline & Deterministic Fallback Engine

**Status:** completed

- [x] Implement Open-Meteo Weather forecast client (temperature, wind speed, relative humidity) in `lib/api/weather.ts`
- [x] Implement thermal inversion risk computation in `lib/weather-fusion.ts`
- [x] Implement time-blocked daily planner synthesizer (Morning, Midday, Evening, Night windows)
- [x] Build Up-Ahead Morning Briefing Card component in the UI
- [x] Add browser Web Notifications API integration with permission request and simulated trigger
- [x] Add "Preview Morning Briefing" button so evaluators can inspect the up-ahead notification and day plan immediately
- [x] Add unit tests in `lib/weather-fusion.test.ts`
