# Below the Surface Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Build a source-backed, bilingual education scroll journey from the earth's surface to its core at /education/below-the-surface.

**Architecture:** Keep the feature client-side and data-driven. A typed static dataset owns depth stops, facts, comparisons, sources, and visual kinds. Focused React components render the depth ruler, strata, discovery card, and object scene. IntersectionObserver selects the active stop while CSS/SVG handles reveal, settle, and small idle motion without a React frame loop.

**Tech Stack:** React 19, TypeScript 7, React Router 7, Tailwind CSS 4, existing motion/react setup, Vitest 4, SVG/CSS illustration.

## Global Constraints

- Route /education/below-the-surface; /education must open this experience.
- Minimum 12 source-backed stops; LIFE, HUMAN, GEOLOGY, and TECH each appear at least twice.
- Every stop has a unique ID, ascending depthMeters, ID/EN copy, source URL, and a visual renderer or fallback.
- Keep monochrome dark paper/off-white ink; no gradient, glassmorphism, decorative shadow, backend, account, analytics, or new dependency.
- One hero object per viewport; motion sequence is dormant, reveal, settle, optional idle.
- Scroll drives state; CSS/SVG drives motion; React does not run a per-frame render loop.
- Mobile stays linear with no horizontal overflow; touch targets remain at least 44px.
- Respect prefers-reduced-motion; reduced motion uses crossfade and minimal position changes.
- Preserve existing arcade mechanics, /weird placeholder, Header behavior, theme toggle, language toggle, and current uncommitted user files.
- Add all user-facing copy to both dictionaries; keep dictionary key sets identical.
- Use apply_patch for source edits and run focused tests before each task commit.

---

## File Map

New:

- src/education/types.ts — shared category, layer, source, visual, and stop contracts.
- src/education/below-the-surface.ts — ordered static content dataset and runtime validation.
- src/education/below-the-surface.test.ts — dataset contract tests.
- src/education/scroll.ts — pure active-stop and progress calculations.
- src/education/scroll.test.ts — scroll helper tests.
- src/components/education/DepthRuler.tsx — depth markers and active-stop indicator.
- src/components/education/DepthRuler.test.ts — marker and label helper tests.
- src/components/education/LayerBand.tsx — visual strata and active-layer presentation.
- src/components/education/LayerBand.test.ts — layer presentation helper tests.
- src/components/education/ObjectScene.tsx — category-aware SVG/CSS scene and fallback.
- src/components/education/ObjectScene.test.ts — visual-kind fallback tests.
- src/components/education/DiscoveryCard.tsx — fact, comparison, category, and source presentation.
- src/components/education/DiscoveryCard.test.ts — card formatting and source helper tests.
- src/components/education/DepthJourney.tsx — section composition and observer lifecycle.
- src/pages/Education.tsx — route page shell and journey integration.

Modified:

- src/App.tsx — route /education to Education instead of the placeholder.
- src/i18n/dict.ts — add complete ID/EN Education UI copy.

Do not modify SectionPlaceholder except if a type error proves a minimal change is required; /weird keeps using it.

## Dependency Waves

Wave 0:

- Task 1: content contract and source-backed dataset.

Wave 1, parallel after Task 1:

- Task 2: pure scroll model.
- Task 3: depth ruler and strata primitives.
- Task 4: object scene and discovery card primitives.

Wave 2:

- Task 5: journey page, route, i18n, and responsive composition after Tasks 2–4 pass.

Wave 3:

- Task 6: integration checks, browser audit, and handoff after Task 5 passes.

---

### Task 1: Define Education Contracts and Source-Backed Dataset

Files:

- Create src/education/types.ts
- Create src/education/below-the-surface.ts
- Test src/education/below-the-surface.test.ts

Interfaces:

- Produces EducationCategory, EducationLayer, EducationSource, EducationVisual, and EducationStop.
- Produces BELOW_THE_SURFACE_STOPS: readonly EducationStop[].
- Produces validateEducationStops(stops: readonly EducationStop[]): string[].
- Later tasks consume EducationStop and BELOW_THE_SURFACE_STOPS; names are fixed.

- [ ] Step 1: Write failing contract tests.

Assert at least 12 stops, empty validation issues, all four categories, strictly ascending depths, unique IDs, and non-empty ID/EN title, fact, comparison, source URL, and visual label.

~~~ts
expect(BELOW_THE_SURFACE_STOPS.length).toBeGreaterThanOrEqual(12);
expect(validateEducationStops(BELOW_THE_SURFACE_STOPS)).toEqual([]);
expect(new Set(BELOW_THE_SURFACE_STOPS.map((stop) => stop.category))).toEqual(
  new Set(['life', 'human', 'geology', 'tech']),
);
~~~

- [ ] Step 2: Run the focused test and verify failure.

~~~powershell
npm.cmd test -- --run src/education/below-the-surface.test.ts
~~~

Expected: FAIL because the education modules do not exist.

- [ ] Step 3: Implement the shared types.

Use these exact fields:

~~~ts
export type EducationCategory = 'life' | 'human' | 'geology' | 'tech';
export type EducationLayer =
  | 'surface' | 'soil' | 'groundwater' | 'underground'
  | 'crust' | 'mantle' | 'core';
export interface EducationSource { label: string; url: string; }
export interface EducationVisual { kind: string; label: string; }
export interface EducationStop {
  id: string;
  depthMeters: number;
  layer: EducationLayer;
  category: EducationCategory;
  title: { id: string; en: string };
  fact: { id: string; en: string };
  comparison: { id: string; en: string };
  source: EducationSource;
  visual: EducationVisual;
}
~~~

- [ ] Step 4: Add the ordered dataset.

Add at least 12 source-backed stops covering surface life, root zone, soil organisms, groundwater, buried infrastructure, tunnel or subway, cave or fossil layer, deep mine, deep borehole or crust, crust-to-mantle transition, mantle, and outer or inner core. Use authoritative source URLs for each claim. Facts are one or two sentences; comparisons are one short sentence; every user-visible field has ID/EN copy.

- [ ] Step 5: Implement validation.

validateEducationStops returns readable issue strings for duplicate IDs, non-positive or non-ascending depths, invalid category/layer, empty ID/EN copy, source URL not beginning with https://, and empty visual kind/label.

- [ ] Step 6: Run focused tests and typecheck.

~~~powershell
npm.cmd test -- --run src/education/below-the-surface.test.ts
npm.cmd run build
~~~

Expected: PASS.

- [ ] Step 7: Commit.

~~~powershell
git add src/education/types.ts src/education/below-the-surface.ts src/education/below-the-surface.test.ts
git commit -m "feat: add below the surface education data"
~~~

---

### Task 2: Build Pure Scroll Selection and Progress Helpers

Files:

- Create src/education/scroll.ts
- Test src/education/scroll.test.ts

Interfaces:

- Consumes EducationStop from Task 1.
- Produces getActiveStopId(entries, viewportCenter): string | null.
- Produces clampProgress(value: number): number.
- Produces getStopProgress(top: number, height: number, viewportHeight: number): number.

- [ ] Step 1: Write failing pure-function tests.

Test clamping below zero, inside range, and above one; zero and negative heights; progress before, during, and after a stop; closest-center active selection; and empty selection returning null.

- [ ] Step 2: Run focused test and verify failure.

~~~powershell
npm.cmd test -- --run src/education/scroll.test.ts
~~~

Expected: FAIL because scroll.ts does not exist.

- [ ] Step 3: Implement pure browser-independent helpers.

Use absolute center distance for active selection, clamp progress to [0, 1], and return zero for invalid heights.

- [ ] Step 4: Run focused test.

~~~powershell
npm.cmd test -- --run src/education/scroll.test.ts
~~~

Expected: PASS.

- [ ] Step 5: Commit.

~~~powershell
git add src/education/scroll.ts src/education/scroll.test.ts
git commit -m "feat: add education scroll helpers"
~~~

---

### Task 3: Build Depth Ruler and Layer Band Primitives

Files:

- Create src/components/education/DepthRuler.tsx
- Create src/components/education/DepthRuler.test.ts
- Create src/components/education/LayerBand.tsx
- Create src/components/education/LayerBand.test.ts

Interfaces:

- Consumes EducationStop and EducationLayer from Task 1, Locale from src/i18n/dict.ts, and the existing useI18n hook.
- DepthRulerProps: stops, activeStopId, and optional onSelect(stopId).
- LayerBandProps: layer, active, and progress.
- Produces semantic marker buttons with aria-current and a strata band with stable layer-specific classes.

- [ ] Step 1: Write helper tests.

Export getDepthLabel(depthMeters, locale) and getLayerToken(layer). Test zero, meter, kilometer, and large-depth labels in both locales; every valid layer maps to a non-empty token.

- [ ] Step 2: Run focused tests and verify failure.

~~~powershell
npm.cmd test -- --run src/components/education/DepthRuler.test.ts src/components/education/LayerBand.test.ts
~~~

Expected: FAIL because components and helpers do not exist.

- [ ] Step 3: Implement DepthRuler.

Render a sticky-friendly nav with one marker button per stop. Each marker is at least 44px high, has an accessible title/depth label, and marks the active stop with aria-current="step". The parent owns responsive overflow.

- [ ] Step 4: Implement LayerBand.

Render a semantic layer element with layer and active data attributes. Use monochrome texture/contrast classes, not color-only meaning. Apply progress as a CSS custom property or transform input; never start requestAnimationFrame.

- [ ] Step 5: Run focused tests and typecheck.

~~~powershell
npm.cmd test -- --run src/components/education/DepthRuler.test.ts src/components/education/LayerBand.test.ts
npm.cmd run build
~~~

Expected: PASS.

- [ ] Step 6: Commit.

~~~powershell
git add src/components/education/DepthRuler.tsx src/components/education/DepthRuler.test.ts src/components/education/LayerBand.tsx src/components/education/LayerBand.test.ts
git commit -m "feat: add education depth and layer primitives"
~~~

---

### Task 4: Build Object Scenes and Discovery Card

Files:

- Create src/components/education/ObjectScene.tsx
- Create src/components/education/ObjectScene.test.ts
- Create src/components/education/DiscoveryCard.tsx
- Create src/components/education/DiscoveryCard.test.ts
- Modify src/i18n/dict.ts — add shared Education labels used by the card.

Interfaces:

- Consumes EducationStop, EducationCategory, EducationSource, EducationVisual, and useI18n.
- ObjectSceneProps: stop, active, and reducedMotion.
- DiscoveryCardProps: stop.
- Produces category-aware SVG/CSS scene, fallback line-art for unknown visual kinds, and source-backed card.

- [ ] Step 1: Write failing helper tests.

Export getVisualRendererKind(visual), getCategoryToken(category), and formatSourceLabel(source). Unknown visual kinds resolve to line; all categories return stable tokens; source labels remain non-empty.

- [ ] Step 2: Run focused tests and verify failure.

~~~powershell
npm.cmd test -- --run src/components/education/ObjectScene.test.ts src/components/education/DiscoveryCard.test.ts
~~~

Expected: FAIL because components and helpers do not exist.

- [ ] Step 3: Implement ObjectScene.

Use small inline SVG/HTML scenes keyed by visual.kind. Every scene has a visible text label and line-art fallback. Active scenes run reveal/settle classes; idle motion is subtle and disabled when reducedMotion is true. Decorative shapes may be aria-hidden, but the object label remains accessible.

- [ ] Step 4: Add shared card labels to both dictionaries and implement DiscoveryCard.

Add matching ID/EN keys for category labels, depth, comparison, and source label to src/i18n/dict.ts. Render title, category, depth, fact, comparison, and source link. Source opens in the same tab, has visible focus, and uses supplied label and URL. Copy comes from the active locale; shared UI strings are not hard-coded.

- [ ] Step 5: Run focused tests and typecheck.

~~~powershell
npm.cmd test -- --run src/components/education/ObjectScene.test.ts src/components/education/DiscoveryCard.test.ts
npm.cmd run build
~~~

Expected: PASS.

- [ ] Step 6: Commit.

~~~powershell
git add src/components/education/ObjectScene.tsx src/components/education/ObjectScene.test.ts src/components/education/DiscoveryCard.tsx src/components/education/DiscoveryCard.test.ts src/i18n/dict.ts
git commit -m "feat: add education object scenes and discovery cards"
~~~

---

### Task 5: Compose Journey Page, Route, and i18n

Files:

- Create src/components/education/DepthJourney.tsx
- Create src/pages/Education.tsx
- Modify src/App.tsx
- Modify src/i18n/dict.ts

Interfaces:

- Consumes BELOW_THE_SURFACE_STOPS, EducationStop, scroll helpers, and Tasks 3–4 components.
- DepthJourney owns activeStopId, observer setup/cleanup, and reduced-motion state.
- Education owns page title, header, intro, ending, and link back to games.

- [ ] Step 1: Add remaining page-level ID/EN dictionary keys.

Add matching keys for page title, intro, surface/depth journey labels, ending copy, back-to-games CTA, and fallback copy. Preserve the shared category/depth/comparison/source keys added by Task 4. Keep DictKey inferred from the ID dictionary and make EN satisfy Record<DictKey, string>.

- [ ] Step 2: Implement DepthJourney.

Render one section per stop with stable id and data-stop-id. Use IntersectionObserver with root margin activating near viewport center. Disconnect on unmount. Pass active stop to ruler, layer band, object scene, and discovery card.

- [ ] Step 3: Implement Education page shell and ending.

Use existing Header wide, bg-paper, text-ink, typography tokens, theme, and language controls. Add semantic main, opening, journey, ending, and link back to /. Render the defined fallback message if the dataset is empty.

- [ ] Step 4: Replace only the education route.

Change /education in src/App.tsx to render Education. Leave /weird on SectionPlaceholder.

- [ ] Step 5: Add responsive styles.

Use single-column mobile and desktop grid with sticky ruler, scene, and card. Remove horizontal overflow, preserve 44px controls, and add reduced-motion selectors for reveal/settle/idle classes.

- [ ] Step 6: Run all tests and build.

~~~powershell
npm.cmd test -- --run
npm.cmd run build
~~~

Expected: PASS.

- [ ] Step 7: Commit.

~~~powershell
git add src/components/education/DepthJourney.tsx src/pages/Education.tsx src/App.tsx src/i18n/dict.ts
git commit -m "feat: add below the surface education page"
~~~

---

### Task 6: Final Verification and Browser Audit

Files:

- Modify only files required to fix verification findings.
- Test all existing and new test files.

Interfaces:

- Consumes the complete route and components from Task 5.
- Produces browser evidence for desktop, mobile, keyboard, theme, locale, and reduced motion.

- [ ] Step 1: Run project verification.

~~~powershell
npm.cmd test -- --run
npm.cmd run build
git -c safe.directory=G:/WebsiteDevelopment/IhavenothingtodoWebsite diff --check
~~~

Expected: PASS with no new errors.

- [ ] Step 2: Run dev server and inspect /education.

~~~powershell
npm.cmd run dev -- --host 127.0.0.1
~~~

Verify opening copy, ruler, strata, one hero object and fact per stop, working source links, final core section, and back-to-games link.

- [ ] Step 3: Verify responsive and accessibility behavior.

Inspect narrow mobile and desktop. Check no horizontal overflow, 44px controls, visible keyboard focus, both ID/EN locales, light/dark theme, and reduced motion. Confirm locale changes preserve route and active-stop selection.

- [ ] Step 4: Fix findings with smallest relevant edits.

Run each focused test, then rerun the full test and build commands. Do not refactor unrelated arcade code.

- [ ] Step 5: Inspect final Git state.

~~~powershell
git -c safe.directory=G:/WebsiteDevelopment/IhavenothingtodoWebsite status -sb
git -c safe.directory=G:/WebsiteDevelopment/IhavenothingtodoWebsite log --oneline -8
~~~

Confirm only intended feature commits are present and pre-existing user files remain untouched.
