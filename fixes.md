Here's the consolidated security review. I've deduplicated findings from both audits and ranked them by real-world impact.                                                                     
                                                                                                                                                                                                 
  ---                                                                                                                                                                                              Critical Issues                                                                                                                                                                                
                                                                                                                                                                                                   1. data-api-url allows full API substitution — PII/health data sent to attacker server                                                                                                                                                                                                                                                                                                          
  src/Api/BaseUrl.jsx:33-40

  The base URL for every API call (including registration with name, email, Medicare number, medical history) comes directly from an unvalidated data-api-url attribute. Any host page can point 
  it at a malicious server and silently capture all patient data. Since this widget is designed for third-party embedding, this is a real threat.

  Fix: Validate apiUrl against an allowlist of origins baked into the build.

  ---
  2. Unvalidated open redirect via dashboardUrl

  SurveyQuestions.jsx:238-239, SignupSurveyQuestions.jsx:540-542

  After survey completion, the widget auto-redirects to dashboardUrl (from data-dashboard-url) with zero validation. A malicious host can redirect users to a phishing page. It's also rendered  
  as an <a href>.

  Fix: Validate the URL origin matches getBaseUrl() before redirecting.

  ---
  3. CSS injection via unsanitized styles/questionFont/answerFont

  src/index.jsx:131-146

  Raw CSS from data-styles, data-question-font, and data-answer-font is injected directly into <head>. CSS injection can exfiltrate data via url() selectors, overlay fake UI, or hide real UI   
  elements.

  Fix: Validate font values against a strict pattern (/^[\w\s,'"-]+$/). Strip url(), @import, expression() from style strings.

  ---
  4. Health data persists in localStorage indefinitely

  SignupSurveyQuestions.jsx:444-455, SurveyQuestions.jsx:147-154

  Full medical data (conditions, medications, allergies, Medicare number, family history) is written to localStorage on every keystroke. The expiry check only runs on mount for the current     
  token — old sessions are never cleaned up. Error paths (network failure, server 500) don't clear storage either, so PHI survives indefinitely on shared/public devices.

  Fix: Clear storage in error/catch blocks. Sweep all LOCAL_STORAGE_KEY_* entries on mount. Add beforeunload cleanup.

  ---
  5. PII in URL query parameters — visible in logs, Referer headers, browser history

  SignupSurveyQuestions.jsx:371-388

  Name, email, and phone are read from URL params and re-written back into the URL. These leak into server access logs, Referer headers (e.g., when Google Maps script loads), browser history,  
  and analytics tools.

  Fix: Consume URL params once, transfer to React state only, strip from URL immediately.

  ---
  Important Issues

  6. console.log leaking sensitive data in production

  - SignupSurveyQuestions.jsx:587 — logs answers.medications_details (prescription drugs)
  - SurveyQuestions.jsx:292 — logs residential street number
  - index.jsx:73-75 — dumps entire window.SURVEY_CONFIG including API URLs

  Fix: Remove all debug console.log statements from production code.

  7. Math.random() used as session token

  SurveyQuestions.jsx:124, SignupSurveyQuestions.jsx:341-342

  The token keying health data in localStorage uses Math.random(), which is not cryptographically secure.

  Fix: Use crypto.randomUUID().

  8. quiz_status=done URL param controls submission UI

  SurveyQuestions.jsx:206-215, SignupSurveyQuestions.jsx:458-467

  Appending ?quiz_status=done to the URL shows the "done" screen and triggers sessionStorage.clear() / localStorage.removeItem(), potentially destroying in-progress data without any actual     
  submission.

  Fix: Track submission state in React state only, not from the URL.

  9. Auth is just a localStorage flag

  src/Auth/Auth.jsx:25-32

  isAuthenticated is a bare localStorage boolean — any script on the same origin can set it. Also has a bug in the expiry calculation (setMinutes(getMinutes(), 3600) doesn't do what's
  intended).

  10. Google Maps API key fetched unauthenticated

  src/loadGoogleMaps.js:16-30

  The key is fetched from an unauthenticated endpoint and exposed in the DOM. Ensure strict HTTP referrer restrictions are set in Google Cloud Console.

  ---
  Additional Issues Found
  ---

  Critical Bugs

  11. Direct mutation of React state in isQuestionAnswered

  src/components/SignupSurveyQuestions.jsx:583-584

  Inside the pure predicate `isQuestionAnswered`, `answers.medications_details` is assigned directly (`answers.medications_details = "I can't remember..."`) instead of going through `setAnswers`. This bypasses React's state system — the mutation won't trigger a re-render and the submitted value may be wrong.

  Fix: Call `handleAnswer("medications_details", "I can't remember. I'll have these ready for the consultation.")` in a useEffect or event handler when `medicineCheckbox` becomes true, not inside a predicate function.

  ---
  12. State setter called during render — potential infinite loop

  src/components/SignupSurveyQuestions.jsx:1298

  `setCurrentQuestion(18)` is called inside `renderQuestion`, which runs during the JSX render phase. Calling a state setter during render is a React violation that can cause infinite re-render loops and throws in strict mode.

  Fix: Move this skip logic into `isQuestionVisible` or into the `handleNext` navigation handler, not inside the render function.

  ---
  13. handleAddressSelect geocodes but never populates form fields (registered-user flow)

  src/components/SurveyQuestions.jsx:284-296

  The geocode result is fetched and logged but the address fields (streetNumber, streetName, suburb, state, postcode) are never populated. Contrast with `SignupSurveyQuestions.jsx` which correctly calls `handlePersonalInfoChange` for each field. In the registered-user flow, clicking an autocomplete suggestion only fills the raw text input — all structured fields are submitted empty.

  Fix: Port the field-population logic from SignupSurveyQuestions.jsx:729-746 into this handler.

  ---
  Important Issues (continued)

  14. Auth expiry calculation is wrong — expiry is ~60 min, not 30

  src/Auth/Auth.jsx:28

  `expirationTime.setMinutes(expirationTime.getMinutes(), 3600)` — the second argument sets seconds to 3600, which Date normalises to +60 minutes. The intended 30-minute expiry is never achieved. (This is the specific bug behind the "buggy expiry" note in #9.)

  Fix: `expirationTime.setMinutes(expirationTime.getMinutes() + 30);`

  ---
  15. Stale logout closure in setInterval

  src/Auth/Auth.jsx:45-54

  The `useEffect` captures the initial render's `logout` function in a `setInterval`. The `eslint-disable-next-line` comment suppresses the exhaustive-deps warning, hiding a real bug — if `navigate` changes, the interval uses a stale reference.

  Fix: Use a `useRef` for `logout` or move the expiry check logic to avoid closing over component-scoped functions.

  ---
  16. Failed questions fetch cached permanently — no recovery, no error shown

  src/questionsCache.js:35-49

  If the initial questions API call fails (network blip, server error), the rejected promise stays cached in `promise`. No retry is possible without a full page reload. The consuming components silently `console.error` and render a blank questionnaire with no user-facing error.

  Fix: Reset `promise = null` in the `.catch` handler (same pattern used in `loadGoogleMaps.js:35`). Show a user-visible error state in the consuming components.

  ---
  17. window.initMap callback never defined — Places autocomplete may fail

  src/loadGoogleMaps.js:25

  The Maps script is loaded with `callback=initMap`, but `window.initMap` is never defined anywhere. Google Maps will call `window.initMap()` after loading and throw `TypeError: window.initMap is not a function`. This can prevent `usePlacesAutocomplete` from initialising, leaving the address input permanently disabled (`ready: false`).

  Fix: Define `window.initMap = function() {}` before loading the script, or remove the `callback` parameter and rely on `loading=async` alone.

  ---
  18. Unvalidated medicareCardImageUrl used in <img src>

  src/components/SurveyQuestions.jsx:530-537

  `medicareCardImageUrl` comes from `window.SURVEY_CONFIG` / `data-medicare-card-image-url` with no validation. An embedder can supply an attacker-controlled URL, leaking the user's IP. This is distinct from the CSS injection issue (#3) — it's an unvalidated URL in an `<img src>`.

  Fix: Validate against an allowlist of https:// origins and trusted domains before rendering.

  ---
  19. Unvalidated treatmentsOverride image URLs used in <img src>

  src/pages/TreatmentSelection.jsx:43-58

  Same pattern as #18 — `treatmentsOverride[*].img` from external config is used directly as `<img src>` without URL validation.

  Fix: Validate image URLs against an allowlist of https:// origins.

  ---
  20. embed.js has no script load ordering despite comments claiming otherwise

  public/embed.js:69-74

  Comments say "load scripts in order" but all `<script>` tags are appended synchronously in a `forEach` with no `onload` chaining. All scripts load in parallel. Currently harmless (single IIFE output), but will silently break if the build ever produces multiple chunks.

  Fix: Chain script loads via `onload` callbacks, or document that only single-chunk builds are supported.

  ---
  21. Hand-rolled .env parser doesn't strip inline comments

  build.js:26-33

  A value like `URL=https://api.example.com # production` will include ` # production` in the value, silently breaking API URLs at build time.

  Fix: Strip inline comments (everything after unquoted `#`), or use the `dotenv` package instead of a hand-rolled parser.

  ---
  Code Quality

  22. Duplicate localStorage save useEffect

  src/components/SignupSurveyQuestions.jsx:310-321 and 444-455

  Two identical `useEffect` hooks both write to localStorage on `[token, answers, currentQuestion]` change. Copy-paste duplication — if one is updated (e.g., to add throttling), the other will silently diverge.

  Fix: Remove the duplicate useEffect.

  ---
  Bottom line: The most serious concern is #1 and #2 — the widget unconditionally trusts the host page for its API URL and redirect URL. Since this is an embeddable widget by design, a
  compromised or malicious host page can silently exfiltrate all patient health data. Among the newly found issues, #13 (broken address handling) and #11 (state mutation) are the most likely to cause real user-facing data problems. Everything else is fixable but lower priority.

