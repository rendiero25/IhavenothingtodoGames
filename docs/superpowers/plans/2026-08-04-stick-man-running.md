# Stick Man Running Implementation Plan

> **For agentic workers:** Use `superpowers:subagent-driven-development`. Independent tasks may run in parallel; dependent tasks start only after their prerequisites are reviewed.

**Goal:** Add a deterministic, client-side 2D side-view brawler called `stick-man-running` that is selectable from the existing arcade and remains playable with keyboard, mouse, and touch.

**Architecture:** Keep gameplay state and wave/combat rules pure in `logic.ts`, visual drawing in `draw.ts`, and lifecycle/input/RAF ownership in `engine.ts`. The engine implements the existing `GameEngine` contract and creates/removes DOM touch controls next to the canvas. Registry/type changes are isolated to a final integration task.

**Tech Stack:** React 19, TypeScript strict, Vite, Vitest, Canvas 2D, existing GameShell/registry contracts.

## Global Constraints

- Logical canvas is exactly `960x540`; arena bounds are finite and one horizontal floor.
- Use only notebook-paper whites, graphite grays, and black ink strokes; no gradients, neon, blur, or large external assets.
- Player has five lives by default, moves horizontally, jumps, faces the last movement direction, and attacks forward with a three-hit timed combo.
- Enemies are Runner, Blocker, Thrower, and Eraser Boss. Boss appears at a deterministic milestone wave. Telegraphs use pose/strokes/arshading, not color-only distinction.
- Pickups are temporary Ruler, Eraser, Pencil, and Paperclip modifiers.
- `opts.seed` controls wave and pickup ordering. No backend, network, persistence, or ambient randomness in gameplay.
- Every listener, timer, RAF, and generated DOM control is removed by `destroy()`. Game over and fatal error callbacks are each emitted at most once.
- Respect reduced motion by shortening/omitting camera shake and impact animation, while preserving gameplay timing.
- Do not change unrelated game behavior or commit the untracked root `AGENTS.md`.

## Shared contracts

Task 1 creates and exports from `config.ts`/`logic.ts`:

```ts
export type EnemyKind = 'runner' | 'blocker' | 'thrower' | 'boss';
export type WeaponKind = 'ruler' | 'eraser' | 'pencil' | 'paperclip';
export interface InputState { left: boolean; right: boolean; jumpPressed: boolean; punchPressed: boolean; }
export interface PlayerState { x: number; y: number; vx: number; vy: number; facing: -1 | 1; grounded: boolean; comboStep: number; comboExpiresAt: number; weapon?: WeaponKind; weaponExpiresAt: number; invulnerableUntil: number; }
export interface EnemyState { id: number; kind: EnemyKind; x: number; y: number; vx: number; hp: number; maxHp: number; facing: -1 | 1; telegraph: number; stunUntil: number; knockback: number; projectileCooldown: number; }
export interface PickupState { id: number; kind: WeaponKind; x: number; y: number; active: boolean; }
export interface GameState { time: number; wave: number; score: number; combo: number; bestCombo: number; lives: number; gameOver: boolean; player: PlayerState; enemies: EnemyState[]; pickups: PickupState[]; effects: EffectState[]; }
export interface EffectState { kind: 'impact' | 'dust' | 'burst' | 'page-shift'; x: number; y: number; life: number; maxLife: number; strength: number; }
export function createInitialState(seed: number, lives: number): GameState;
export function updateGame(state: GameState, input: InputState, dtMs: number, seed: number): GameState;
export function spawnWave(seed: number, wave: number): EnemyState[];
```

Task 2 consumes those types and exports `drawStickMan(ctx, state, reducedMotion)` plus `drawNotebookScene(ctx, state, reducedMotion)`. Task 3 consumes those functions and owns input/lifecycle. Task 4 adds the registry entry and loader after the engine exists.

## Task 1: Pure gameplay state, combat, pickups, waves, and tests (parallel-safe)

**Files:** create `src/games/stick-man-running/config.ts`, `logic.ts`, `logic.test.ts` only.

- Define tuning constants for movement, jump, combo windows, enemy stats, pickup durations, arena floor/bounds, and boss milestone.
- Implement immutable-friendly state updates for horizontal movement/bounds, jump/landing, forward hitboxes, combo timing/reset, knockback, enemy contact damage, pickup effects/duration, wave escalation, deterministic seeded spawn, and five-life game over.
- Ensure a punch consumes one edge-triggered `punchPressed`; held input must not spam multiple hits in one frame.
- Include focused Vitest coverage for every required unit-test bullet in the spec, including same-seed equality and different-seed variation.
- Commit only these three files with `feat: add stick man gameplay logic`.

## Task 2: Notebook renderer and micro-interactions (parallel-safe)

**Files:** create `src/games/stick-man-running/draw.ts` only. Do not edit `config.ts` or `logic.ts`.

- Consume the shared contracts documented above; if Task 1 is not yet present, author against those exact names and do not invent a second state model.
- Draw the white ruled-paper background, finite floor/obstacles, ink stickman with facing/pose changes, distinct enemy telegraphs, pickups, graphite dust, landing pressure, impact lines, ink bursts, damage hatching, and subtle page-shift.
- Keep all drawing in logical coordinates and use stroke/line-width/timing differences instead of gradients, neon, blur, or external images.
- Respect `reducedMotion` by suppressing camera/page-shift exaggeration and shortening effect lifetimes.
- Commit only `draw.ts` with `feat: draw stick man notebook scene`.

## Task 3: Engine lifecycle, input adapter, touch controls (depends on Tasks 1 and 2)

**Files:** create `src/games/stick-man-running/engine.ts`, `engine.test.ts`.

- Implement `GameEngine` with logical canvas `960x540`, seeded options, RAF update loop, pause/resume, visibility-safe state, and `destroy()` cleanup.
- Wire keyboard (`A/D`, arrows, `W`/Space), left mouse, and pointer/touch-friendly DOM buttons for left/right/jump/punch. Create controls as siblings of the canvas, with at least 44px targets, `aria-label`s, `touch-action: none`, and remove them on destroy; never cover the playfield with canvas hitboxes.
- Translate gameplay events into `onScore`, `onLifeLost`, `onGameOver`, and `onFatalError`; guard game-over/fatal emission to once per run.
- Pause on `visibilitychange`, honor `prefers-reduced-motion`, handle resize without replacing the canvas, and prevent default only for mapped controls.
- Add tests that mock RAF/listeners enough to prove pause/resume and listener/DOM cleanup, without snapshot-only assertions.
- Commit only `engine.ts` and `engine.test.ts` with `feat: add stick man game engine`.

## Task 4: Registry and shell integration (depends on Task 3)

**Files:** modify `src/games/types.ts`, `src/games/registry.ts`, optionally `src/components/GameModal.tsx` or `src/shell/GameShell.tsx` only when needed for existing responsive contracts; create/update a focused registry test.

- Add `stick-man-running` to `GameId`, metadata category `dexterity`, icon already available in the icon map, and `viewport: 'landscape'` so desktop uses 16:9 while existing shell breakpoints retain mobile 2:3 and tablet 4:3 behavior.
- Add a lazy loader importing `StickManRunningEngine` from `./stick-man-running/engine`.
- Preserve existing eight games, i18n, theme, and modal behavior. Do not add a second route or bypass `GameShell`.
- Verify the home/game modal can select the new id and that the loader remains lazy.
- Commit only integration files with `feat: register stick man running`.

## Task 5: Final audit and verification (after all task reviews)

- Run `npm.cmd test`, `npm.cmd run build`, and a targeted grep/type check for the new registry id, logical canvas size, cleanup, and touch controls.
- Review responsive CSS at mobile/tablet/desktop breakpoints and reduced-motion branches. Use the browser only for a concise manual smoke test if the dev server is available.
- Fix only findings from task reviews or concrete verification failures, then commit `test: verify stick man running integration` if a verification-only change is required.

## Audit follow-up tasks (required before Task 5 can close)

The final audit found concrete gaps against the approved spec. These follow-ups are intentionally dependency-ordered because the renderer consumes the logic state contract.

### Task 5A: Projectile state, boss erase, stun safety, and gameplay feedback

**Files:** modify `src/games/stick-man-running/config.ts`, `logic.ts`, `logic.test.ts` only.

- Add deterministic `ProjectileState[]` to `GameState` for paper projectiles from Thrower/Boss and straight Pencil projectiles. Move projectiles, resolve enemy/player collisions, damage, knockback, expiry, and score through pure logic; remove direct ranged damage.
- Ignore contact damage from enemies while `state.time < enemy.stunUntil`.
- Add a timed `erase-lines` effect emitted by Eraser Boss attacks and a `hitStopMs` state timer emitted by successful punches.
- Emit dust on running/landing transitions and keep all updates seeded and immutable-friendly.
- Add tests for projectile travel/collision, pencil behavior, stunned contact immunity, boss erase effect, hit-stop, and deterministic projectile outcomes.
- Commit `feat: complete stick man combat feedback`.

### Task 5B: Renderer parity for new state and telegraphs (depends on 5A)

**Files:** modify `src/games/stick-man-running/draw.ts` only.

- Render paper/pencil projectiles, timed boss line erasure, dust, and hit-stop-friendly impact cues from the shared state.
- Use normalized telegraph values directly (no `/300` scaling), keep obstacles/camera look-ahead visually coherent, and preserve monochrome/reduced-motion rules.
- Commit `fix: render stick man projectiles and arena feedback`.

### Task 5C: Real engine cleanup regression test (parallel-safe with 5B)

**Files:** modify `src/games/stick-man-running/engine.test.ts` only.

- Add a focused DOM/canvas stub test that initializes `StickManRunningEngine`, proves the sibling controls/listeners exist, calls `destroy()`, and proves controls/listeners are removed without relying only on helper tests.
- Commit `test: cover stick man engine cleanup`.

## Dependency order

Tasks 1 and 2 are independent and should be dispatched together. Task 3 waits for both commits and their task reviews. Task 4 waits for Task 3. Task 5 waits for all reviews and integration.
