# 03: GenAI Recommendation Pipeline & Deterministic Fallback Engine

**What to build:** An end-to-end personalized recommendation engine driven by Google Gemini (with strict JSON schema enforcement) and a deterministic heuristic fallback engine, accessible via `/api/recommendations` and backed by context input forms.

**Blocked by:** 02: Live Telemetry, Geocoding & Judge Scenario Presets

**Status:** completed

- [x] Implement user context profile schema and state management (vulnerable members, commute mode, living area)
- [x] Implement Gemini API client in `lib/ai/gemini-client.ts` with structured JSON schema output
- [x] Implement deterministic rule-based offline heuristic engine in `lib/ai/heuristic-fallback.ts` that matches the exact response schema
- [x] Create API Route handler `app/api/recommendations/route.ts` with graceful fallback if Gemini key is absent or rate-limited
- [x] Add unit tests in `lib/ai/heuristic-fallback.test.ts` verifying complete schema conformance
- [x] Build Context Profiler UI drawer/modal allowing users to toggle their household characteristics
