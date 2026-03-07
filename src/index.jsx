import React from "react";
import App from "./App";
import { MemoryRouter } from "react-router-dom";
import { createRoot } from "react-dom/client";
import { SurveyConfigProvider } from "./SurveyConfig";
import { resolveUrl } from "./Api/BaseUrl";
import { sanitizeCss, sanitizeFont } from "./utils/validation";

/**
 * Read configuration from window.SURVEY_CONFIG (programmatic) or
 * data-* attributes on <div id="primed-survey"> (declarative).
 *
 * Embed example
 * -------------
 *   <div id="primed-survey"
 *        data-treatment-plan-id="42"
 *        data-treatment-plan-name="weight-loss">
 *   </div>
 *   <script type="module" src="survey-widget.js"></script>
 *
 * Programmatic with CSS:
 *   <script>
 *     window.SURVEY_CONFIG = {
 *       referralCode: "CODE",
 *       email:        "user@example.com",
 *       firstName:    "Jane",
 *       lastName:     "Doe",
 *       phone:        "+1234567890",
 *       // CSS class names appended to existing classes
 *       submitBtnClass: "btn btn-primary",   // quiz Submit button
 *       saveBtnClass:   "btn btn-secondary", // Save Your Progress button
 *       backBtnClass:   "btn btn-outline",   // back arrow button
 *       navBtnClass:    "btn btn-outline-secondary", // Continue/Next button
 *       inputClass:     "my-input",
 *       labelClass:     "my-label",
 *       // Font family applied to question text and answer choices / inputs
 *       questionFont: "'Inter', sans-serif",
 *       answerFont:   "'Inter', sans-serif",
 *       // URL for the Medicare card image shown alongside the Medicare question
 *       medicareCardImageUrl: "https://example.com/medicare-card.png",
 *       // CSS class appended to treatment card labels on the selection screen
 *       treatmentLabelClass: "my-label",
 *       // Override treatment card images (slug → URL); unset slugs keep the default
 *       treatmentImages: { "weight-loss": "https://example.com/weight.jpg" },
 *       // Raw CSS injected into <head>
 *       styles: ".submitBtn { background: #0d6efd; }",
 *       // Backend API base URL (prod + optional dev override)
 *       apiUrl:    "https://api.example.com",
 *       apiUrlDev: "https://api-dev.example.com",
 *       // Dashboard URL shown on done screen (auto-redirects after 5 s)
 *       dashboardUrl:    "https://app.example.com/patient/dashboard",
 *       dashboardUrlDev: "https://dev.example.com/patient/dashboard",
 *       // Hostnames treated as dev (default: ["localhost","127.0.0.1"])
 *       devHosts: ["localhost", "127.0.0.1"],
 *     };
 *   </script>
 *   <div id="primed-survey"></div>
 *   <script src="survey-widget.js"></script>
 */
function readConfig() {
  const config = window.SURVEY_CONFIG || {};
  const mountEl = document.getElementById("primed-survey");
  const d = mountEl?.dataset || {};
  return { config, d };
}

function buildInitialEntry() {
  const { config, d } = readConfig();
  const treatmentPlanId   = config.treatmentPlanId   || d.treatmentPlanId   || "";
  const treatmentPlanName = config.treatmentPlanName || d.treatmentPlanName || "";

  // If a treatment plan is pre-set via data-* attributes or window.SURVEY_CONFIG,
  // skip TreatmentSelection and go directly to the assessment welcome screen.
  if (!treatmentPlanName) {
    return "/questionnaire";
  }
  return `/questionnaire/${treatmentPlanName}/${treatmentPlanId}`;
}

function buildClassConfig() {
  const { config, d } = readConfig();

  const dashboardUrl = resolveUrl(
    config.dashboardUrl    || d.dashboardUrl    || "",
    config.dashboardUrlDev || d.dashboardUrlDev || "",
    config.devHosts        || d.devHosts        || ""
  );

  return {
    submitBtnClass: config.submitBtnClass || d.submitBtnClass || "",
    saveBtnClass:   config.saveBtnClass   || d.saveBtnClass   || "",
    backBtnClass:   config.backBtnClass   || d.backBtnClass   || "",
    navBtnClass:    config.navBtnClass    || d.navBtnClass    || "",
    inputClass:     config.inputClass     || d.inputClass     || "",
    labelClass:     config.labelClass     || d.labelClass     || "",
    questionFont:   config.questionFont   || d.questionFont   || "",
    answerFont:     config.answerFont     || d.answerFont     || "",
    medicareCardImageUrl: config.medicareCardImageUrl || d.medicareCardImageUrl || "https://cdn.prod.website-files.com/6981710e75497676ffbaf22b/69a48f47624b07619d0f3dfd_medicare-irn.png",
    dashboardUrl,
    treatmentLabelClass: config.treatmentLabelClass || d.treatmentLabelClass || "",
    treatmentImages: (() => {
      // Programmatic: already an object
      if (config.treatmentImages && typeof config.treatmentImages === "object") return config.treatmentImages;
      // Declarative: JSON string on data attribute
      if (d.treatmentImages) {
        try { return JSON.parse(d.treatmentImages); } catch { return {}; }
      }
      return {};
    })(),
    treatments: (() => {
      // Programmatic: already an array
      if (Array.isArray(config.treatments)) return config.treatments;
      // Declarative: JSON string on data-treatments attribute
      if (d.treatments) {
        try { return JSON.parse(d.treatments); } catch { return null; }
      }
      return null;
    })(),
  };
}

/** Inject a raw CSS string into <head> if the host page provided one. */
function injectStyles() {
  const { config, d } = readConfig();
  const css          = config.styles       || d.styles       || "";
  const questionFont = config.questionFont || d.questionFont || "";
  const answerFont   = config.answerFont   || d.answerFont   || "";

  let fullCss = sanitizeCss(css);
  const safeQuestionFont = sanitizeFont(questionFont);
  const safeAnswerFont = sanitizeFont(answerFont);
  if (safeQuestionFont) fullCss += ` .card-question { font-family: ${safeQuestionFont}; }`;
  if (safeAnswerFont)   fullCss += ` .card-list li, .card-list li * { font-family: ${safeAnswerFont}; } .form-control { font-family: ${safeAnswerFont}; }`;

  if (!fullCss) return;
  const el = document.createElement("style");
  el.setAttribute("data-primed-survey-styles", "");
  el.textContent = fullCss;
  document.head.appendChild(el);
}

function mount() {
  injectStyles();

  const mountEl =
    document.getElementById("primed-survey") ||
    document.getElementById("root");

  if (!mountEl) {
    console.error(
      '[Primed Survey] Mount element not found. Add <div id="primed-survey"> to your page.'
    );
    return;
  }

  // Prevent the widget from overflowing its host div
  mountEl.style.position = "relative";
  mountEl.style.overflowX = "hidden";

  const root = createRoot(mountEl);
  root.render(
    <SurveyConfigProvider config={buildClassConfig()}>
      <MemoryRouter initialEntries={[buildInitialEntry()]}>
        <App />
      </MemoryRouter>
    </SurveyConfigProvider>
  );
}

// Safe mount — works whether the script is in <head> or end of <body>
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mount);
} else {
  mount();
}
