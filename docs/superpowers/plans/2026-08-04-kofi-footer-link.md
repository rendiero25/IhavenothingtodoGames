# Ko-fi Footer Link Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a monochrome `Buy me a Coffee` link to the home footer that opens `https://ko-fi.com/rendiero` in a new tab without loading Ko-fi scripts.

**Architecture:** Reuse the existing `Home` footer and i18n dictionary. Add one shared `home.kofi` string to both locales, then render a semantic external anchor in a responsive three-column footer. No new component, dependency, API, widget, or payment state is needed.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, Vitest, Vite.

## Global Constraints

- Use the public URL `https://ko-fi.com/rendiero`.
- Display the exact CTA `Buy me a Coffee` in both locales.
- Open the link in a new tab with `rel="noopener noreferrer"`.
- Do not add the supplied Ko-fi widget script.
- Do not add password, API key, webhook, or payment data to the repository.
- Preserve the existing header, wheel scroller, and footer copy behavior.
- Keep the layout monochrome and responsive without horizontal overflow.

---

### Task 1: Add the Ko-fi i18n key

**Files:**
- Modify: `src/i18n/dict.ts` near `home.footer`
- Test: `src/i18n/dict.test.ts`

**Interfaces:**
- Produces the `DictKey` value `home.kofi`, consumed by `Home.tsx` through the existing `t()` helper.

- [x] **Step 1: Add the same CTA to both dictionaries**

Insert this entry after `home.footer` in both `id` and `en`:

```ts
  'home.kofi': 'Buy me a Coffee',
```

- [x] **Step 2: Extend the i18n test with an exact CTA assertion**

Add this test to `src/i18n/dict.test.ts`:

```ts
  it('memiliki CTA Ko-fi yang konsisten', () => {
    expect(dictionaries.id['home.kofi']).toBe('Buy me a Coffee');
    expect(dictionaries.en['home.kofi']).toBe('Buy me a Coffee');
  });
```

- [x] **Step 3: Run the focused i18n test**

Run: `npm.cmd test -- --run src/i18n/dict.test.ts`

Expected: PASS, including identical key sets, non-empty strings, and the exact Ko-fi CTA.

### Task 2: Render the responsive footer link

**Files:**
- Modify: `src/pages/Home.tsx` footer near the existing `home.footer` copy

**Interfaces:**
- Consumes: `t('home.kofi')`, `t('home.footer')`, and the existing `locale`-independent i18n contract.
- Produces: semantic external anchor with `href="https://ko-fi.com/rendiero"`, `target="_blank"`, and `rel="noopener noreferrer"`.

- [x] **Step 1: Replace the two-item flex footer with a responsive three-area grid**

Use this structure while preserving the existing footer typography classes:

```tsx
        <footer className="grid min-h-12 grid-cols-2 items-center gap-x-4 gap-y-2 py-3 font-mono text-[9px] uppercase tracking-[0.12em] text-ink-soft sm:grid-cols-[1fr_auto_1fr] sm:py-0">
          <span>ihavenothingtodo</span>
          <a
            href="https://ko-fi.com/rendiero"
            target="_blank"
            rel="noopener noreferrer"
            className="justify-self-start text-ink outline-none underline-offset-4 transition-colors duration-200 hover:text-ink/65 hover:underline focus-visible:text-ink focus-visible:underline sm:justify-self-center"
          >
            {t('home.kofi')}
          </a>
          <span className="col-span-2 sm:col-span-1 sm:justify-self-end">{t('home.footer')}</span>
        </footer>
```

- [x] **Step 2: Verify the static contract**

Run: `rg -n "home.kofi|ko-fi.com/rendiero|noopener noreferrer|target=\"_blank\"" src/pages/Home.tsx src/i18n/dict.ts`

Expected: the key exists in both dictionaries and the footer contains exactly one secure external link with the approved URL.

### Task 3: Run the full verification and hand off

**Files:**
- Test: repository test suite
- Verify: production build and Git state

- [x] **Step 1: Run all tests**

Run: `npm.cmd test -- --run`

Expected: all existing test files pass.

- [x] **Step 2: Run the production build**

Run: `npm.cmd run build`

Expected: TypeScript check and Vite build pass. Existing chunk-size warning is acceptable if no new error appears.

- [x] **Step 3: Check whitespace and working tree**

Run: `git -c safe.directory=G:/WebsiteDevelopment/IhavenothingtodoWebsite diff --check` and `git -c safe.directory=G:/WebsiteDevelopment/IhavenothingtodoWebsite status -sb`

Expected: no whitespace errors; only the intended Ko-fi implementation files are changed before commit.

- [x] **Step 4: Commit the implementation**

```bash
git add src/i18n/dict.ts src/i18n/dict.test.ts src/pages/Home.tsx
git commit -m "feat: add Ko-fi footer link"
```

- [x] **Step 5: Push `development`**

```bash
git push origin development
```

Expected: remote `development` contains the implementation commit and the worktree is clean.
