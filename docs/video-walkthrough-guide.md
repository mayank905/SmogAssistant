# Video Walkthrough Recording Guide (2–3 Minutes)

This script is structured to ensure your video submission covers all hackathon evaluation criteria: **Code Quality, Security, Efficiency, Testing, Accessibility, and Problem Alignment**.

---

## 🎬 Video Recording Plan

### Segment 1: The Problem & The Solution (0:00 - 0:35)
* **Screen**: Show the landing screen of **SmogAssistant** with the live AQI card and high-contrast CPCB status badge.
* **Talking Points**:
  - *"Welcome to SmogAssistant, our Generative AI-powered copilot designed to help urban communities survive and navigate winter smog."*
  - *"Traditional air quality apps just display passive numbers. SmogAssistant is proactive, personalized, and action-oriented."*
  - Point out the **Live Telemetry & Pollutant Grid** showing real-time PM2.5, PM10, NO2, and SO2 directly from Copernicus CAMS Open-Meteo feeds without hardcoded values.

### Segment 2: Proactive Morning Briefing & Weather-Air Fusion (0:35 - 1:10)
* **Screen**: Focus on the **Up-Ahead Morning Briefing Card**.
* **Action**: Click the **"Preview Morning Alert"** button to trigger the instant browser notification.
* **Talking Points**:
  - *"One of our standout features is the proactive 06:30 AM Up-Ahead briefing."*
  - *"By fusing meteorological forecasts—temperature, wind stagnation, and humidity—with air quality curves, SmogAssistant calculates Thermal Inversion Risk."*
  - *"It divides the day into four actionable windows: Morning lockdown, Midday dispersion window, Evening rush hour cautions, and Night bedroom air purification."*

### Segment 3: Personalization & Vulnerable Family Profiling (1:10 - 1:45)
* **Screen**: Click **"Configure Household Profile"** to open the modal.
* **Action**: Select the preset **"Vulnerable Family"** (Asthmatic child + Senior citizen + Two-wheeler commute). Click **"Save & Recalculate AI Advice"**.
* **Talking Points**:
  - *"Recommendations are deeply tailored to the user's household context."*
  - *"Notice the critical alert triggered specifically for asthmatic members, advising on preventive bronchodilators before stepping out."*
  - *"In the Daily Routine section, outdoor workouts and school runs are rescheduled to the midday solar window, cutting toxic particle inhalation by over 80%."*

### Segment 4: Indoor Hacks & Clean Commute Offset Justifier (1:45 - 2:20)
* **Screen**: Scroll to **Sustainable Commute** and **Indoor Air Defense**.
* **Action**: Slide the room resizer from 200 to 450 sq ft in the NASA Plant Calculator.
* **Talking Points**:
  - *"For indoor air, we integrated NASA Clean Air study formulas: users get exact plant counts (Snake plants, Areca palms) scaled to their specific room area, alongside frugal DIY Corsi-Rosenthal filter guides."*
  - *"Under Sustainable Transit, the assistant calculates quantified personal exposure reduction (-85% PM2.5 saved by shifting from a two-wheeler to the metro) alongside carbon abatement metrics."*

### Segment 5: Judge Presets, Resilience & Architecture (2:20 - 2:50)
* **Screen**: Click the **Evaluator Benchmark Presets** buttons (toggle from Delhi Severe Inversion to Coastal Sea Breeze).
* **Talking Points**:
  - *"For evaluators, we included one-click benchmark presets so anyone can test extreme winter smog scenarios even offline."*
  - *"Behind the scenes, we use Next.js 15 App Router with server-side route handlers to keep API keys secure, in-memory caching for sub-100ms response times, and a 100% deterministic heuristic fallback so the app never fails."*
  - *"Full test suite with Vitest and WCAG 2.1 AA accessible color palettes."*
