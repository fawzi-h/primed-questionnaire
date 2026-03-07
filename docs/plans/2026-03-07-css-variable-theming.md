# CSS Variable Theming Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace all hardcoded colors, fonts, border-radii, and button styles in the widget CSS with CSS custom properties (`var(--primed-*, fallback)`) so the widget inherits theming from any parent website.

**Architecture:** Define CSS variables on `#primed-survey` (the widget root). All widget selectors reference these variables with hardcoded fallbacks. Fonts default to `inherit` so the widget picks up the host page's typography. Host pages override by setting `--primed-*` on `#primed-survey` or any ancestor.

**Tech Stack:** CSS custom properties, no JS changes needed.

---

### Task 1: Add CSS Variable Definitions

**Files:**
- Modify: `src/assets/styles.css:1`

**Step 1: Add variable block after the @import**

Insert after line 1 (the Google Fonts @import):

```css
/* ── Theming tokens ─────────────────────────────────────────────── */
#primed-survey {
  --primed-font-body: inherit;
  --primed-font-heading: inherit;
  --primed-color-text: #000304;
  --primed-color-text-muted: rgba(0, 3, 4, 0.55);
  --primed-color-bg: #ffffff;
  --primed-color-primary: #014548;
  --primed-color-primary-light: #e5ecec;
  --primed-color-accent: #faf08c;
  --primed-color-accent-hover: #003739;
  --primed-color-accent-text: #014548;
  --primed-color-focus: #249693;
  --primed-color-border: hsla(240, 7%, 62%, 0.7);
  --primed-color-error: #df2d3e;
  --primed-color-checkbox: #106759;
  --primed-btn-radius: 100px;
  --primed-btn-padding: 0.75rem 1.5rem;
  --primed-input-radius: 6px;
  --primed-card-radius: 8px;
  --primed-progress-bg: #014548;
}
```

**Step 2: Build to verify no errors**

Run: `npx vite build`
Expected: Build succeeds. Variables are defined but not yet consumed.

---

### Task 2: Replace Hardcoded Values in styles.css — Questionnaire Section (lines 2170–2278)

**Files:**
- Modify: `src/assets/styles.css:2170-2278`

**Replacements:**

| Line | Property | Old Value | New Value |
|------|----------|-----------|-----------|
| 2171 | background | `#ffffff` | `var(--primed-color-bg, #ffffff)` |
| 2194 | color | `#000304` | `var(--primed-color-text, #000304)` |
| 2201 | font-family | `'Barlow Condensed', sans-serif` | `var(--primed-font-heading, 'Barlow Condensed', sans-serif)` |
| 2204 | color | `#000304` | `var(--primed-color-text, #000304)` |
| 2208 | font-family | `'Barlow', sans-serif` | `var(--primed-font-body, 'Barlow', sans-serif)` |
| 2217 | background-color | `#e6f5f5` | `var(--primed-color-primary-light, #e5ecec)` |
| 2218 | color | `#000304` | `var(--primed-color-text, #000304)` |
| 2228 | font-family | `'Barlow', sans-serif` | `var(--primed-font-body, 'Barlow', sans-serif)` |
| 2234 | color | `#249693` | `var(--primed-color-focus, #249693)` |
| 2238 | background-color | `#faf08c` | `var(--primed-color-accent, #faf08c)` |
| 2239 | padding | `0.75rem 1.5rem` | `var(--primed-btn-padding, 0.75rem 1.5rem)` |
| 2241 | color | `#014548` | `var(--primed-color-accent-text, #014548)` |
| 2247 | border-radius | `100px` | `var(--primed-btn-radius, 100px)` |
| 2252 | background-color | `#003739` | `var(--primed-color-accent-hover, #003739)` |
| 2261 | font-family | `'Barlow Condensed', sans-serif` | `var(--primed-font-heading, 'Barlow Condensed', sans-serif)` |
| 2263 | color | `#000304` | `var(--primed-color-text, #000304)` |
| 2266 | background-color | `white` | `var(--primed-color-bg, #ffffff)` |
| 2267 | border-radius | `8px` | `var(--primed-card-radius, 8px)` |

---

### Task 3: Replace Hardcoded Values in styles.css — Survey Questions Section (lines 2279–2623)

**Files:**
- Modify: `src/assets/styles.css:2279-2623`

**Replacements:**

| Line | Property | Old Value | New Value |
|------|----------|-----------|-----------|
| 2294 | border-bottom | `1px solid #d1e4e4` | `1px solid var(--primed-color-primary-light, #e5ecec)` |
| 2392 | color | `#106759` | `var(--primed-color-checkbox, #106759)` |
| 2398 | color | `#106759` | `var(--primed-color-checkbox, #106759)` |
| 2417 | background-color | `#249693` | `var(--primed-color-focus, #249693)` |
| 2428 | color | `#249693` | `var(--primed-color-focus, #249693)` |
| 2429 | border | `1px solid #249693` | `1px solid var(--primed-color-focus, #249693)` |
| 2444 | background-color | `#014548` | `var(--primed-progress-bg, #014548)` |
| 2455 | color | `#249693` | `var(--primed-color-focus, #249693)` |
| 2487 | border-color | `#249693` | `var(--primed-color-focus, #249693)` |
| 2500 | border | `1px solid #df2d3e` | `1px solid var(--primed-color-error, #df2d3e)` |
| 2501 | border-radius | `6px` | `var(--primed-input-radius, 6px)` |
| 2508 | background-color | `#faf08c` | `var(--primed-color-accent, #faf08c)` |
| 2509 | padding | `0.75rem 1.5rem` | `var(--primed-btn-padding, 0.75rem 1.5rem)` |
| 2510 | color | `#014548` | `var(--primed-color-accent-text, #014548)` |
| 2512 | border-radius | `100px` | `var(--primed-btn-radius, 100px)` |
| 2518 | background-color | `#003739` | `var(--primed-color-accent-hover, #003739)` |
| 2537 | border | `1px solid hsla(240, 7%, 62%, 0.7)` | `1px solid var(--primed-color-border, hsla(240, 7%, 62%, 0.7))` |
| 2540 | border-radius | `6px` | `var(--primed-input-radius, 6px)` |
| 2549 | border | `1px solid hsla(240, 7%, 62%, 0.7)` | `1px solid var(--primed-color-border, hsla(240, 7%, 62%, 0.7))` |
| 2550 | border-radius | `6px` | `var(--primed-input-radius, 6px)` |
| 2557 | background-color | `#e5ecec` | `var(--primed-color-primary-light, #e5ecec)` |
| 2558 | color | `#014548` | `var(--primed-color-primary, #014548)` |
| 2559 | border-color | `#014548` | `var(--primed-color-primary, #014548)` |
| 2563 | background-color | `#014548` | `var(--primed-color-primary, #014548)` |
| 2565 | border | `1px solid #014548` | `1px solid var(--primed-color-primary, #014548)` |
| 2577 | color | `#000304` | `var(--primed-color-text, #000304)` |
| 2587 | background-color | `#faf08c` | `var(--primed-color-accent, #faf08c)` |
| 2588 | border-radius | `100px` | `var(--primed-btn-radius, 100px)` |
| 2589 | color | `#014548` | `var(--primed-color-accent-text, #014548)` |
| 2590 | padding | `0.75rem 1.5rem` | `var(--primed-btn-padding, 0.75rem 1.5rem)` |
| 2598 | background-color | `#003739` | `var(--primed-color-accent-hover, #003739)` |
| 2602 | background-color | `#faf08c` | `var(--primed-color-accent, #faf08c)` |
| 2603 | border-radius | `100px` | `var(--primed-btn-radius, 100px)` |
| 2604 | color | `#014548` | `var(--primed-color-accent-text, #014548)` |
| 2605 | padding | `0.75rem 1.5rem` | `var(--primed-btn-padding, 0.75rem 1.5rem)` |
| 2612 | background-color | `#003739` | `var(--primed-color-accent-hover, #003739)` |
| 2622 | accent-color | `#106759` | `var(--primed-color-checkbox, #106759)` |
| 2627 | background-color | `#249693` | `var(--primed-color-focus, #249693)` |

---

### Task 4: Replace Hardcoded Values in TreatmentSelection.css

**Files:**
- Modify: `src/pages/TreatmentSelection.css` (full file, 112 lines)

**Replacements:**

| Line | Property | Old Value | New Value |
|------|----------|-----------|-----------|
| 2 | background | `#ffffff` | `var(--primed-color-bg, #ffffff)` |
| 22 | color | `#000304` | `var(--primed-color-text, #000304)` |
| 23 | font-family | `'Barlow Condensed', sans-serif` | `var(--primed-font-heading, 'Barlow Condensed', sans-serif)` |
| 33 | color | `rgba(0, 3, 4, 0.55)` | `var(--primed-color-text-muted, rgba(0, 3, 4, 0.55))` |
| 34 | font-family | `'Barlow', sans-serif` | `var(--primed-font-body, 'Barlow', sans-serif)` |
| 51 | background | `#ffffff` | `var(--primed-color-bg, #ffffff)` |
| 53 | border-radius | `8px` | `var(--primed-card-radius, 8px)` |
| 68 | border-color | `#014548` | `var(--primed-color-primary, #014548)` |
| 75 | background-color | `#e5ecec` | `var(--primed-color-primary-light, #e5ecec)` |
| 102 | font-family | `'Barlow', sans-serif` | `var(--primed-font-body, 'Barlow', sans-serif)` |
| 105 | color | `#000304` | `var(--primed-color-text, #000304)` |

---

### Task 5: Build Verification

**Step 1: Run build**

Run: `npx vite build`
Expected: Build succeeds with no errors.

**Step 2: Verify CSS variables are in output**

Run: `grep --include="*.js" -c "primed-color" dist/survey-widget.js`
Expected: Count > 0, confirming variables made it into the bundle.

---

## Host Page Usage Example

After implementation, any host page can theme the widget:

```html
<style>
  #primed-survey {
    --primed-font-body: 'Inter', sans-serif;
    --primed-font-heading: 'Inter', sans-serif;
    --primed-color-primary: #1a73e8;
    --primed-color-accent: #fbbc04;
    --primed-color-accent-hover: #f9a825;
    --primed-color-accent-text: #202124;
    --primed-btn-radius: 8px;
  }
</style>
```

Without any overrides, the widget renders with its original Primed branding.
