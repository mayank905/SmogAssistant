# 4. Proactive Morning Briefing & Weather-Air Quality Fusion

Date: 2026-11-22

## Status
Accepted

## Context
Urban winter smog fluctuates dramatically over 24 hours due to temperature inversions, morning traffic peaks, and afternoon wind dispersion. Users need a proactive "up-ahead" capability—delivered as a daily early-morning briefing/notification—that inspects both **current conditions** and **predicted weather + air quality** to lay out an actionable, customized plan for the rest of the day.

## Decision
1. **Weather + Air Quality Telemetry Fusion**:
   - Pair **Open-Meteo Air Quality API** (hourly AQI, PM2.5, PM10, $NO_2$, $O_3$) with **Open-Meteo Weather Forecast API** (hourly temperature, relative humidity, wind speed, precipitation, and boundary-layer dispersion proxy) — both requiring zero API keys.
   - Compute a **Thermal Inversion / Stagnation Risk** signal when wind speed is low and morning temperature is cold.
2. **Proactive Morning Briefing & Notification Engine**:
   - **Time-Blocked Day Plan**: Synthesizes current + next 18-24h forecast into Morning (06:00–11:00), Midday (11:00–16:00), Evening (16:00–21:00), and Night (21:00–06:00) recommendations tailored to the user's Context Profile.
   - **Daily Notification Preferences**: Configurable alert time (default `06:30 AM`) using the browser's **Web Notifications API** (with permission prompt and local persistence) plus an in-app **Morning Briefing Banner / Digest Card**.
   - **Instant Preview Trigger**: A *"Preview Morning Briefing"* button so evaluators and demo walkthroughs can trigger and inspect the early-morning notification and full-day plan immediately without waiting for 6:30 AM.

## Consequences
- Directly strengthens problem alignment and practical real-world usability by making the assistant proactive rather than purely reactive.
- Works seamlessly offline/demo via scenario simulation presets and without extra paid weather API keys.
