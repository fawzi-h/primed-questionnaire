# CSS Cleanup & Design Token Refactor

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Strip dead CSS from styles.css, replace all hardcoded colors with CSS custom properties, and update font fallbacks to match the Primed design system.

**Architecture:** The widget mounts inside `#primed-survey` and defines all design tokens as CSS custom properties on that selector with Primed-matching defaults. The parent Webflow site can override any `--primed-*` variable. We remove ~2000 lines of dead CSS for pages the widget never renders.

**Tech Stack:** CSS custom properties, no build changes needed.

---

### Task 1: Remove dead CSS — non-widget page styles

**Files:**
- Modify: `src/assets/styles.css`

**Step 1: Delete the Google Fonts import (line 1)**

The widget inherits fonts from the parent page. Remove:
```css
@import url("https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700&family=Barlow:wght@400;500&family=Montserrat:wght@900&family=Raleway:wght@300;400;500;600&display=swap");
```

**Step 2: Delete all non-widget sections**

Remove these line ranges entirely (they style header, footer, homepage, FAQ, doctors, login, get-started, how-it-works, about-us, pricing, contact, 404, testimonials, benefits, marquee, dropdown, policy pages):

- Lines 29-35: `body ul`, `body a` global resets (widget shouldn't reset host page)
- Lines 36-48: `body p, span, li...` forced Raleway font (widget uses tokens)
- Lines 50-296: `body #header` (all navigation)
- Lines 292-354: `.not-found`, `.swiper` (404 page, swiper)
- Lines 355-665: `body #home_page` (homepage hero, description, treatments)
- Lines 666-974: `.howItWorks_section`, `.howItWorks_Card`, `.treatmentSteps_Card`, `.benefits_Card` (marketing)
- Lines 975-1012: `.testimonials_div`, `.testimonials_section` (testimonials)
- Lines 1014-1273: `.faq_section`, `.faq_page`, `.doctors-page` (FAQ, doctors)
- Lines 1274-1406: `.login-wrapper` (login/auth pages)
- Lines 1407-1491: `.getStarted_page` (get started)
- Lines 1493-1646: `.how-it-works` (standalone how-it-works page)
- Lines 1647-1958: `.aboutUs_page_wrapper`, `.aboutUs_page` (about us)
- Lines 1960-2080: `.pricing_page`, `.contact_us_page` (pricing, contact)
- Lines 2081-2193: `.faq_page` search results section
- Lines 2648-2695: `body #footer` (footer)
- Lines 2697-2808: Media queries for dead sections (`@media` blocks referencing `.doctors-page`, `.getStarted_page`, `.faq_page`, etc.)
- Lines 2809-2983: `@media (max-width: 1215px)` header/nav responsive
- Lines 2985-3151: `@media (max-width: 990px)` dead section responsive
- Lines 3153-3244: `.value-prop-bar`, `.marquee`, dropdown menu, `.policy_page`

**Step 3: Keep only these sections (renumber mentally):**
- CSS custom properties block (`#primed-survey { ... }`)
- `body { overflow-x: hidden; }` (line 27-28)
- Lines 2194-2647: `.questionnaire-wrapper`, `.survey-questions`, `.survey-header`, `.survey-card`, `.card-*`, `.popup-*`, `.consent-*`, `.welcome-popup`, `.questionCheckbox`
- Lines 3246-3250: `body .form-control` base styling
- Lines 3253-3309: `.welcome-popup`, `.popup-overlay`, `.consent-*` sections

**Step 4: Verify the app still renders**

Run: `npm start` (or the dev command)
Check: TreatmentSelection, Questionnaire, and SurveyQuestions pages render correctly with no missing styles.

**Step 5: Commit**

```bash
git add src/assets/styles.css
git commit -m "chore: remove ~2000 lines of dead CSS for non-widget pages"
```

---

### Task 2: Expand CSS custom properties with Primed defaults

**Files:**
- Modify: `src/assets/styles.css` (the `#primed-survey` block)

**Step 1: Update the token block**

Replace the existing `#primed-survey { ... }` block with:

```css
#primed-survey {
  /* ── Fonts (inherit from parent by default) ─────────────────── */
  --primed-font-body: inherit;
  --primed-font-heading: inherit;
  --primed-font-mono: inherit;

  /* ── Text ───────────────────────────────────────────────────── */
  --primed-color-text: #131313;
  --primed-color-text-muted: rgba(19, 19, 19, 0.55);
  --primed-color-text-subtle: #6b7c82;

  /* ── Backgrounds ────────────────────────────────────────────── */
  --primed-color-bg: #ffffff;
  --primed-color-bg-subtle: #f8f9fa;

  /* ── Primary (teal) ─────────────────────────────────────────── */
  --primed-color-primary: #014548;
  --primed-color-primary-light: #e5ecec;
  --primed-color-primary-dark: #003739;

  /* ── Accent (gold CTA) ──────────────────────────────────────── */
  --primed-color-accent: #faf08c;
  --primed-color-accent-hover: #003739;
  --primed-color-accent-text: #014548;

  /* ── Interactive ────────────────────────────────────────────── */
  --primed-color-focus: #43a6aa;
  --primed-color-checkbox: #0d9488;

  /* ── Borders & errors ───────────────────────────────────────── */
  --primed-color-border: #dee2e6;
  --primed-color-error: #df2d3e;

  /* ── Radii ──────────────────────────────────────────────────── */
  --primed-btn-radius: 100px;
  --primed-input-radius: 6px;
  --primed-card-radius: 8px;

  /* ── Spacing ────────────────────────────────────────────────── */
  --primed-btn-padding: 0.75rem 1.5rem;

  /* ── Progress bar ───────────────────────────────────────────── */
  --primed-progress-bg: #014548;
}
```

Key changes:
- Added `--primed-font-mono` for button/label text
- Changed `--primed-color-text` from `#000304` to `#131313` (Primed body black)
- Added `--primed-color-text-subtle` for notice text
- Added `--primed-color-bg-subtle` for consent card backgrounds
- Added `--primed-color-primary-dark` for hover states
- Changed `--primed-color-focus` from `#249693` to `#43a6aa` (Primed teal accent)
- Changed `--primed-color-checkbox` from `#106759` to `#0d9488` (consistent with consent)
- Changed `--primed-color-border` from `hsla(240, 7%, 62%, 0.7)` to `#dee2e6` (cleaner)

**Step 2: Commit**

```bash
git add src/assets/styles.css
git commit -m "feat: expand CSS custom properties with Primed design system defaults"
```

---

### Task 3: Replace hardcoded colors in widget CSS with variables

**Files:**
- Modify: `src/assets/styles.css`

**Step 1: Fix all hardcoded colors in the remaining widget styles**

For each occurrence, replace the hardcoded value with the appropriate `var(--primed-*)`:

| Location (selector) | Property | Old Value | New Value |
|---|---|---|---|
| `.questionairre-startBtn:hover` | `color` | `#4d7c7e` | `var(--primed-color-accent-text)` |
| `.questionnaire-notice` | `color` | `#6b7c82` | `var(--primed-color-text-subtle)` |
| `.survey-header` | `box-shadow` | `rgba(3, 62, 71, 0.1)` | `rgba(0, 0, 0, 0.06)` |
| `.popup-container` | `background-color` | `#fff` | `var(--primed-color-bg)` |
| `.popup-container` | `box-shadow` | `0 4px 6px rgba(0, 0, 0, 0.1)` | keep (decorative shadow is fine hardcoded) |
| `.close-button` | `color` | `#9ca3af` | `var(--primed-color-text-muted)` |
| `.close-button:hover` | `color` | `#4b5563` | `var(--primed-color-text)` |
| `.popup-title` | `color` | `var(--primed-color-checkbox, #106759)` | `var(--primed-color-primary)` |
| `.popup-description` | `color` | `var(--primed-color-checkbox, #106759)` | `var(--primed-color-primary)` |
| `.create-account-button` | `background-color` | `var(--primed-color-focus, #249693)` | `var(--primed-color-focus)` (drop fallback, token always defined) |
| `.continue-button` | `color` / `border` | `var(--primed-color-focus, #249693)` | `var(--primed-color-focus)` |
| `.continue-button:hover` | `background-color` | `rgba(0, 57, 76, 0.05)` | `rgba(0, 0, 0, 0.03)` |
| `.survey-progress-bar` | `background-color` | `rgba(0, 3, 4, 0.08)` | keep (neutral track) |
| `.card-list li.selected-answer` | `color` | `white !important` | `#fff` (keep — it's always white on dark) |
| `.form-control:focus` | `box-shadow` | `rgba(25, 135, 84, 0.07)` | `none` or keep |
| `.nextBtn:hover`, `.submitQuizBtn:hover` | `color` | `#4d7c7e` | `var(--primed-color-accent-text)` |
| `.combobox-option` | `border-bottom` | `#db1919` | `var(--primed-color-border)` |
| `.consent-item` | `background` | `#f8f9fa` | `var(--primed-color-bg-subtle)` |
| `.consent-item` | `border` | `#dee2e6` | `var(--primed-color-border)` |
| `.consent-item:has(input:checked)` | `border-color` | `#0d9488` | `var(--primed-color-checkbox)` |
| `.consent-item:has(input:checked)` | `background` | `#f0fdfa` | `var(--primed-color-primary-light)` |
| `.consent-label` | `color` | `#374151` | `var(--primed-color-text)` |
| `.consent-label input` | `accent-color` | `#0d9488` | `var(--primed-color-checkbox)` |
| `.welcome-popup` | `background` | `#fff` | `var(--primed-color-bg)` |
| `.welcome-popup` | `box-shadow` | `rgba(0,0,0,0.18)` | keep (decorative) |
| `body .form-control` | `border` | `#ced4da` | `var(--primed-color-border)` |

**Step 2: Drop redundant fallbacks**

Since all `--primed-*` tokens are always defined on `#primed-survey`, we can simplify `var(--primed-color-focus, #249693)` → `var(--primed-color-focus)` throughout. The fallback values are only needed if someone uses the widget CSS without the token block, which shouldn't happen.

Keep fallbacks for safety — they don't hurt and protect against edge cases.

**Step 3: Commit**

```bash
git add src/assets/styles.css
git commit -m "fix: replace hardcoded colors with CSS custom properties"
```

---

### Task 4: Update font fallbacks in widget CSS

**Files:**
- Modify: `src/assets/styles.css`
- Modify: `src/pages/TreatmentSelection.css`

**Step 1: Replace font fallbacks in styles.css**

Search for all `font-family` declarations with old fallbacks and update:

| Old Fallback | New Fallback |
|---|---|
| `'Barlow Condensed', sans-serif` | `'Bondia', serif` |
| `'Barlow', sans-serif` | `'Stacksanstext', sans-serif` |

These are only fallbacks inside `var()` — e.g.:
```css
/* Before */
font-family: var(--primed-font-heading, 'Barlow Condensed', sans-serif);
/* After */
font-family: var(--primed-font-heading, 'Bondia', serif);
```

For button text (`.questionairre-startBtn`, `.nextBtn`, `.submitQuizBtn`), add the mono font variable:
```css
font-family: var(--primed-font-mono, 'GeistMono', monospace);
```

**Step 2: Update TreatmentSelection.css fallbacks**

Same pattern — replace `'Barlow Condensed'` and `'Barlow'` fallbacks:
```css
/* Before */
font-family: var(--primed-font-heading, 'Barlow Condensed', sans-serif);
/* After */
font-family: var(--primed-font-heading, 'Bondia', serif);
```

**Step 3: Commit**

```bash
git add src/assets/styles.css src/pages/TreatmentSelection.css
git commit -m "fix: update font fallbacks to match Primed design system"
```

---

### Task 5: Verify everything works end-to-end

**Step 1: Run the dev server**

```bash
npm start
```

**Step 2: Test all 3 widget screens**

1. Treatment Selection (`/questionnaire`) — cards render, hover states work
2. Questionnaire welcome (`/questionnaire/weight-loss/2`) — title, description, start button styled
3. Survey quiz (`/questionnaire/weight-loss/2/start-quiz`) — progress bar, question cards, answer list, next/back buttons, consent step all styled

**Step 3: Test token override**

Add to `public/index.html` (or test page) temporarily:
```html
<style>
  #primed-survey {
    --primed-color-accent: red;
    --primed-color-primary: blue;
  }
</style>
```
Verify buttons turn red and selected answers turn blue.

**Step 4: Remove test overrides and commit final state**

```bash
git add -A
git commit -m "chore: verify CSS cleanup and token refactor"
```
