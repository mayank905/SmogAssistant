# 01: Project Scaffolding, Domain Types & AQI Seam

**What to build:** The foundational Next.js 15 project setup with TypeScript, TailwindCSS, Vitest runner, core domain types, CPCB AQI calculation and classification logic, and unit tests verifying mathematical correctness.

**Blocked by:** None (can start immediately)

**Status:** completed

- [x] Initialize Next.js 15 App Router project with TypeScript and TailwindCSS
- [x] Configure Vitest and testing library for test-driven development
- [x] Define shared TypeScript domain models (`types/aqi.ts`, `types/context.ts`, `types/recommendations.ts`)
- [x] Implement CPCB standard AQI breakpoint computation and color/category mapping in `lib/aqi-calculator.ts`
- [x] Write and pass unit tests in `lib/aqi-calculator.test.ts`
- [x] Verify test suite runs cleanly via `npm test`
