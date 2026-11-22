# 2. Technology Stack Selection

Date: 2026-11-21

## Status
Accepted

## Context
The challenge requires building an Urban Air Quality Assistant powered by Generative AI with real-time data, high practical usability, clean maintainable code, robust security, high efficiency, and accessible UI.

## Decision
We choose **Next.js 15 (App Router) + TypeScript + TailwindCSS + Lucide Icons**:
1. **Fullstack Architecture**: Server-side route handlers (`/api/aqi`, `/api/recommendations`) keep external API calls and GenAI keys secure on the server side, preventing client-side API key leakage.
2. **Type Safety & Maintainability**: Strict TypeScript contracts across environmental telemetry, user context models, and GenAI structured schemas.
3. **Accessibility (a11y)**: Semantic HTML, ARIA attributes, WCAG 2.1 AA compliant color contrasts for AQI status indicators, and screen-reader accessible interactive components.
4. **Efficiency**: Next.js built-in response caching, static/streaming optimizations, and rapid server-side rendering for low initial load latency.

## Consequences
- Single unified repository with no cross-origin CORS hurdles.
- Easy deployment to Google Cloud Run, Vercel, or Docker.
- Fully testable with Vitest for unit and integration testing.
