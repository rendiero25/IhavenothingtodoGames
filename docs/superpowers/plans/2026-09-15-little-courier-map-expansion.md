# Little Courier Map Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand Little Courier to a connected 176 by 176 town with longer delivery routes.

**Architecture:** `logic.ts` remains the source for bounds, roads, buildings, residents, and routing. `scene.ts` consumes those arrays without owning gameplay state. Existing distance-derived deadlines and batched Rapier physics remain unchanged.

**Tech Stack:** TypeScript, Three.js, Rapier, Vitest, Vite

**Spec:** `docs/superpowers/specs/2026-09-15-little-courier-map-expansion-design.md`

## Global Constraints

- Bounds must be exactly `-88..88` on X and Z.
- Keep five deliveries and six existing localized resident identities.
- Keep current mesh and triangle test budgets.
- Add no dependency, backend, persistence, or account system.

---

### Task 1: Define expansion contract

**Files:**
- Modify: `src/games/kurir-gabut/logic.test.ts`

**Interfaces:**
- Consumes: `MAP_HALF_SIZE`, `BUILDINGS`, `STREETS`, `RESIDENTS`, `routeTo`, `deliveryDistances`
- Produces: regression coverage for the expanded map

- [x] Add failing assertions for `MAP_HALF_SIZE === 88`, twelve outer buildings, outer resident positions, connected motorcycle routes, and delivery distance above the current 111-unit maximum.
- [x] Run `npm.cmd test -- --run src/games/kurir-gabut/logic.test.ts` and confirm failure from the old 68-unit bounds.

### Task 2: Expand connected town data

**Files:**
- Modify: `src/games/kurir-gabut/logic.ts`
- Modify: `src/games/kurir-gabut/activity.ts`

**Interfaces:**
- Produces: `MAP_HALF_SIZE = 88`; outer buildings, roads, sidewalks, resident stops, and traffic loop

- [x] Add twelve low-detail outer buildings inside the new bounds.
- [x] Add the outer road ring and sidewalks before resident driveway generation.
- [x] Point three `HOME_BUILDINGS` entries to outer buildings.
- [x] Extend deterministic trees and traffic to the new district without blocking roads.
- [x] Run courier logic, activity, simulation, physics, scene, and engine tests.

### Task 3: Verify product contract

**Files:**
- Modify: `docs/kurir-gabut.md`

**Interfaces:**
- Consumes: measured map counts, distances, deadlines, mesh count, and triangle count
- Produces: current product documentation

- [x] Update documented dimensions and performance measurements from fresh tests.
- [x] Run `npm.cmd test -- --run`.
- [x] Run `npm.cmd run build`.
- [x] Run `git -c safe.directory=G:/WebsiteDevelopment/IhavenothingtodoWebsite diff --check` and `git -c safe.directory=G:/WebsiteDevelopment/IhavenothingtodoWebsite status -sb`.
