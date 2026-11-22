# Specification: Urban Air Quality Assistant (SmogAssistant)

Status: `ready-for-agent`
Date: 2026-11-22

---

## Problem Statement

During winter months, severe atmospheric temperature inversions trap toxic particulate matter (PM2.5, PM10) and hazardous pollutants ($NO_2, SO_2, CO, O_3$) close to the ground across urban centers. Citizens face severe health risks—ranging from acute respiratory distress to cardiovascular complications—especially vulnerable demographics like children, elderly individuals, and people with asthma. 

However, existing air quality apps merely present raw AQI numbers or passive color charts. Users lack actionable, personalized guidance: they don't know when it is safe to exercise, commute, or open windows; they do not know what practical indoor hacks (phytoremediation plants, DIY HEPA filtration) actually work; and they lack quantifiable motivation to adopt lower-emission commuting alternatives. Furthermore, users are reactive rather than proactive because they do not receive an integrated morning forecast that fuses meteorological conditions (temperature, wind stagnation) with pollutant dispersion trends for the rest of the day.

---

## Solution

The **Urban Air Quality Assistant (SmogAssistant)** is a Generative AI-powered web application that transforms complex, real-time environmental telemetry into proactive, personalized, and actionable daily mitigation plans. 

Key capabilities:
1. **Real-Time Telemetry & Weather Fusion**: Directly queries live Open-Meteo Air Quality & Weather APIs (with optional WAQI ground-station support) to monitor current pollutants and predict hourly dispersion trends without requiring mandatory API keys.
2. **Proactive Morning Briefing (Up-Ahead Plan)**: Evaluates morning thermal inversion risks and produces a time-blocked day plan (Morning, Midday, Evening, Night) with browser notification alerts and an instant evaluator preview mode.
3. **Personalized Context Profiling**: Adapts all advice to user household composition (infants, asthmatics, elderly), daily commute mode, and living conditions.
4. **Actionable Indoor Guidance**: Delivers scientifically backed indoor hacks, including room-tailored plant counts (NASA Clean Air study metrics) and DIY filtration strategies.
5. **Sustainable Transit Justifier**: Computes quantified personal exposure avoidance and estimated $CO_2$/particulate emission offsets when switching to low-emission transit modes.
6. **Robust Fallback & Evaluation Benchmarks**: Features a deterministic offline heuristic engine and judge scenario presets (e.g., Delhi Winter Inversion AQI 465, Industrial Smog AQI 185, Coastal Clean AQI 35) to ensure 100% demo uptime and resilience.

---

## User Stories

1. As a city resident with an asthmatic child, I want to input my household health profile so that all daily recommendations prioritize protecting vulnerable lungs from toxic exposure spikes.
2. As a morning jogger, I want the assistant to evaluate hourly PM2.5 and temperature inversion forecasts so that it can reschedule my workout to the safest daytime exposure window.
3. As a daily office commuter, I want to compare my current travel mode (e.g., two-wheeler or petrol car) against metro/EV transit so that I can see my exact personal PM2.5 inhalation reduction and estimated $CO_2$ emission offset.
4. As an apartment resident without an expensive central HVAC system, I want specific indoor air quality hacks and phytoremediation plant recommendations (like Snake Plants and Areca Palms) so that I can naturally clean my living space.
5. As an urban worker, I want a proactive early-morning "Up-Ahead" briefing so that I know what to expect for the rest of the day before stepping out of the house.
6. As a user on the go, I want to enable daily morning browser notifications so that I get timely alerts when air quality crosses hazardous thresholds.
7. As a citizen living in an area with fluctuating pollution, I want to search for any global or Indian city by name so that I get instant, accurate real-time air quality metrics without needing to provide geographic coordinates manually.
8. As a user curious about specific pollutants, I want to see detailed breakdowns of PM2.5, PM10, $NO_2$, $SO_2$, $O_3$, and $CO$ with CPCB and EPA category badges so that I understand which toxic agent is driving the current index.
9. As a person with color vision deficiency, I want the UI badges and charts to use high-contrast, accessible colors and textual labels so that I can interpret severity levels without relying solely on color.
10. As a hackathon judge or evaluator, I want a one-click scenario switcher (e.g., "Delhi Severe Winter Inversion" vs "Clean Mountain Air") so that I can test the assistant's behavior across extreme pollution events even without third-party API dependencies.
11. As a judge reviewing the code, I want the external API integration to work out of the box without requiring manual API key registration so that the application runs immediately upon cloning.
12. As a user experiencing a sudden network outage, I want the application to fall back gracefully to cached data and deterministic local heuristics so that I still receive safe guidance without crashes or blank screens.
13. As a community member, I want clear, natural-language justifications for every suggestion so that I understand the scientific reason behind each recommended behavioral change.
14. As an evaluator testing notification flows, I want a "Preview Morning Briefing" button so that I can immediately inspect the notification card and day plan without having to wait until 6:30 AM.
15. As a mobile phone user, I want a fully responsive layout with touch-friendly controls so that I can consult the assistant seamlessly on any device.

---

## Implementation Decisions

### 1. Architecture & Framework
- **Fullstack Next.js 15 (App Router)** with TypeScript for end-to-end type safety.
- **Styling & Components**: TailwindCSS with accessible styling primitives and Lucide React icons.
- **Client/Server Boundary**: External API calls, secret API keys (like `GEMINI_API_KEY` or `WAQI_API_TOKEN`), and LLM invocations reside strictly in server-side Route Handlers (`/api/aqi`, `/api/recommendations`, `/api/weather`) to prevent credential leakage.

### 2. External Data Engine & Weather Fusion
- **Primary Live AQI**: Open-Meteo Air Quality API (`https://air-quality-api.open-meteo.com/v1/air-quality`), fetching hourly PM2.5, PM10, $NO_2, SO_2, CO, O_3$, and European/US AQI without requiring API credentials.
- **Weather Forecast Engine**: Open-Meteo Weather API (`https://api.open-meteo.com/v1/forecast`), fetching hourly temperature, relative humidity, wind speed, and precipitation.
- **Geocoding Engine**: Open-Meteo Geocoding API (`https://geocoding-api.open-meteo.com/v1/search`) translating city queries to lat/long coordinates.
- **Ground Station Extension**: Optional WAQI API adapter activated if `WAQI_API_TOKEN` is configured.
- **Caching Layer**: In-memory 15-minute TTL cache per coordinates/city to minimize external network overhead and respect rate limits.

### 3. GenAI Recommendation Engine
- **SDK**: Google Gemini API via official `@google/genai` or `@google/generative-ai`.
- **Enforced JSON Output Contract**:
  ```typescript
  interface AIRecommendationResponse {
    airQualitySummary: {
      headline: string;
      cpcbCategory: "Good" | "Satisfactory" | "Moderate" | "Poor" | "Very Poor" | "Severe";
      primaryHazard: string;
      healthRiskLevel: "Low" | "Moderate" | "High" | "Critical";
    };
    morningBriefing: {
      title: string;
      weatherSynopsis: string;
      inversionRisk: "Low" | "Medium" | "High";
      dayBlocks: {
        timeWindow: string; // "Morning (06:00-11:00)", etc.
        aqiOutlook: string;
        recommendedActions: string[];
        cautions: string[];
      }[];
    };
    dailyRoutinePlan: {
      activity: string;
      originalTiming: string;
      optimizedTiming: string;
      justification: string;
      exposureReductionPct: number;
    }[];
    indoorMitigation: {
      ventilationAdvice: string;
      purifierStrategy: string;
      recommendedPlants: {
        name: string;
        botanicalName: string;
        quantityPer100SqFt: number;
        targetedPollutants: string[];
        careDifficulty: "Easy" | "Moderate";
      }[];
      diyLowCostHacks: string[];
    };
    sustainableCommute: {
      currentMode: string;
      suggestedMode: string;
      pm25InhalationSavedPct: number;
      estimatedCo2SavedKg: number;
      actionableAdvice: string;
    };
    vulnerableAlerts: {
      targetGroup: string; // "Children", "Asthmatics / Respiratory", "Elderly"
      specificWarning: string;
      emergencyAction: string;
    }[];
  }
  ```
- **Deterministic Heuristic Fallback Engine**: If Gemini is offline, rate-limited, or unconfigured, an internal rules engine produces equivalent high-quality structured guidance matching the exact same schema.

### 4. Interactive Simulation Presets
- Built-in scenarios:
  1. *Delhi Winter Inversion (Severe, AQI 465)*
  2. *Industrial Smog Peak (Very Poor, AQI 320)*
  3. *Urban Moderate (Moderate, AQI 135)*
  4. *Coastal Fresh (Good, AQI 38)*

---

## Testing Decisions

### What Makes a Good Test
- Tests must validate observable system behavior and output invariants, not internal implementation details or mocks of third-party network layers.
- Core algorithmic seams (AQI categorization, weather-inversion risk computation, emission calculation formulas, fallback heuristics, and schema conformity) will be covered via automated unit and integration tests using **Vitest**.

### Modules Tested
1. **`lib/aqi-calculator.test.ts`**:
   - CPCB AQI scale mapping and category boundaries.
   - Pollutant sub-index calculations ($PM2.5, PM10$).
2. **`lib/weather-air-fusion.test.ts`**:
   - Calculation of thermal inversion risk from temperature gradient and wind speed.
   - Day-block time window categorization.
3. **`lib/heuristic-fallback.test.ts`**:
   - Verification that the deterministic fallback engine returns valid data matching the `AIRecommendationResponse` TypeScript schema.
4. **`lib/emission-calculator.test.ts`**:
   - Commute mode particulate reduction and $CO_2$ offset formulas.

---

## Out of Scope

- Hardware IoT firmware development or Bluetooth physical purifier pairing.
- Municipal air quality dispatch emergency sirens or SMS telecom gateways.
- Multi-tenant enterprise billing or paid subscription tiers.

---

## Further Notes

- Evaluators will be provided with sample environment variables in `.env.example`.
- The application will run smoothly with `npm run dev` and test with `npm test`.
