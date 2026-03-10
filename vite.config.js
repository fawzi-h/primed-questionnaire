import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import cssInjectedByJs from "vite-plugin-css-injected-by-js";

/**
 * Inline Vite plugin — converts static require("./asset.ext") calls in JSX/JS
 * files to ES module import statements so Rollup can process them.
 *
 * CRA supported require() for assets; Vite (Rollup) does not. This plugin
 * performs a simple text transform before Rollup sees the module.
 */
function requireTransformPlugin() {
  return {
    name: "require-transform",
    transform(src, id) {
      if (!/\.(jsx?|tsx?)$/.test(id) || !src.includes("require(")) return null;

      const importLines = [];
      let counter = 0;

      const transformed = src.replace(
        /\brequire\(\s*(["'])((?:\.{1,2}[/\\][^"']*)|(?:[^"']+\.(?:png|jpg|jpeg|svg|gif|webp|otf|ttf|woff2?)))\1\s*\)/g,
        (_, quote, assetPath) => {
          const varName = `__req_${counter++}__`;
          importLines.push(`import ${varName} from ${quote}${assetPath}${quote};`);
          return varName;
        }
      );

      if (importLines.length === 0) return null;
      return { code: importLines.join("\n") + "\n" + transformed, map: null };
    },
  };
}

const mockQuestions = [
  { id: 1,   key: "age_over_18",                        question: "Are you over 18 years of age?",                                                   type: "MCQs",         choices: ["Yes", "No"],                                                                                                                                                                                                                                  placeholder: null,                  checkbox: false, image: false },
  { id: 2,   key: "sex_at_birth",                       question: "What was your sex at birth?",                                                     type: "MCQs",         choices: ["Male", "Female"],                                                                                                                                                                                                                                placeholder: null,                  checkbox: false, image: false },
  { id: 3,   key: "pregnancy_status",                   question: "Are you currently pregnant or breastfeeding, or trying to fall pregnant?",        type: "MCQs",         choices: ["Yes", "No"],                                                                                                                                                                                                                                    placeholder: null,                  checkbox: false, image: false },
  { id: 4,   key: "date_of_birth",                      question: "What is your date of birth?",                                                     type: "date_input",   choices: null,                                                                                                                                                                                                                                             placeholder: null,                  checkbox: false, image: false },
  { id: 5,   key: "height",                             question: "What is your height (in cm)?",                                                    type: "input",        choices: null,                                                                                                                                                                                                                                             placeholder: "Enter Your Height",   checkbox: false, image: false },
  { id: 6,   key: "weight",                             question: "What is your weight (in kg)?",                                                    type: "weight_input", choices: null,                                                                                                                                                                                                                                             placeholder: "Enter Your Weight",   checkbox: false, image: false },
  { id: 7,   key: "medical_conditions_values",          question: "Do you have any current or past medical conditions or injuries? (Select all that apply)", type: "multi_select", choices: ["Heart disease", "Stroke", "Diabetes (Type 1)", "Diabetes (Type 2)", "High blood pressure", "High cholesterol", "Asthma / COPD", "Kidney disease", "Liver disease", "Cancer (current or past)", "Epilepsy / seizure disorder", "Mental health condition (e.g. depression, anxiety, bipolar)", "Thyroid disorder", "Autoimmune condition", "Blood clotting disorder", "Chronic pain / fibromyalgia", "None of the above", "Other"], placeholder: null, checkbox: false, image: false },
  { id: 8,   key: "has_family_history",                 question: "Do you have a family history of any medical condition/s or disorder/s?",          type: "MCQs",         choices: ["Yes", "No"],                                                                                                                                                                                                                                    placeholder: null,                  checkbox: false, image: false },
  { id: 9,   key: "family_history_details",             question: "Please explain the medical illness that has run within your family.",              type: "Textarea",     choices: null,                                                                                                                                                                                                                                             placeholder: "Explain Here",        checkbox: false, image: false },
  { id: 10,  key: "has_diagnosed_with_cancer",          question: "Have you ever been diagnosed with cancer?",                                       type: "MCQs",         choices: ["Yes", "No"],                                                                                                                                                                                                                                    placeholder: null,                  checkbox: false, image: false },
  { id: 11,  key: "taking_medications",                 question: "Are you currently taking or have you ever taken any medications or supplements?",  type: "MCQs",         choices: ["Yes", "No"],                                                                                                                                                                                                                                    placeholder: null,                  checkbox: false, image: false },
  { id: 12,  key: "medications_details",                question: "Please select any medications or supplements you are currently taking.",           type: "multi_select", choices: ["Blood thinners (e.g. Warfarin, Apixaban)", "Blood pressure medication", "Diabetes medication (e.g. Metformin, Insulin)", "Immunosuppressants", "Hormonal therapy (e.g. testosterone, HRT)", "Other"],                                                   placeholder: null,                  checkbox: false, image: false },
  { id: 13,  key: "has_allergies",                      question: "Do you have any known drug or food allergies?",                                   type: "MCQs",         choices: ["Yes", "No"],                                                                                                                                                                                                                                    placeholder: null,                  checkbox: false, image: false },
  { id: 14,  key: "allergies_details",                  question: "What allergies do you have?",                                                     type: "Textarea",     choices: null,                                                                                                                                                                                                                                             placeholder: "Explain Here",        checkbox: false, image: false },
  { id: 15,  key: "has_taken_peptides_hormone_therapy",  question: "Have you ever taken peptides or hormone therapy before?",                        type: "MCQs",         choices: ["Yes", "No"],                                                                                                                                                                                                                                    placeholder: null,                  checkbox: false, image: false },
  { id: 16,  key: "taken_peptides_hormone_therapy",      question: "Please tell us which peptides or hormone therapy you have used.",                type: "Textarea",     choices: null,                                                                                                                                                                                                                                             placeholder: "Explain Here",        checkbox: false, image: false },
  { id: 17,  key: "has_additional_info",                question: "Anything else your practitioner needs to consider?",                              type: "MCQs",         choices: ["Yes", "No"],                                                                                                                                                                                                                                    placeholder: null,                  checkbox: false, image: false },
  { id: 18,  key: "additional_info_details",            question: "Please provide as much detail as possible for your practitioner to consider.",     type: "Textarea",     choices: null,                                                                                                                                                                                                                                             placeholder: "Explain Here",        checkbox: false, image: false },
  { id: 19,  key: "smoke-or-vape",                      question: "Do you smoke or vape?",                                                          type: "MCQs",         choices: ["Yes", "No"],                                                                                                                                                                                                                                    placeholder: null,                  checkbox: false, image: false },
  { id: 20,  key: "drink-alcohol",                      question: "Do you drink alcohol?",                                                           type: "MCQs",         choices: ["Yes, regularly", "Yes, occasionally", "No"],                                                                                                                                                                                                 placeholder: null,                  checkbox: false, image: false },
  { id: 21,  key: "exercise",                           question: "How often do you exercise?",                                                      type: "MCQs",         choices: ["Daily", "3-5 times a week", "1-2 times a week", "Rarely", "Never"],                                                                                                                                                                          placeholder: null,                  checkbox: false, image: false },
  { id: 22,  key: "medicare_number",                    question: "What are your Medicare details?",                                                 type: "input",        choices: null,                                                                                                                                                                                                                                             placeholder: "Enter Medicare Number", checkbox: 1,  image: 1     },
  { id: 22,  key: "medicare_expiry",                    question: "What is the expiry?",                                                             type: null,           choices: null,                                                                                                                                                                                                                                             placeholder: "Enter Expiry Date",   checkbox: false, image: false },
  { id: 22,  key: "individual_reference_number",        question: "What is your Individual Reference Number?",                                      type: "input",        choices: null,                                                                                                                                                                                                                                             placeholder: "Enter Your IRN",      checkbox: 1,     image: 1     },
  { id: 23,  key: "method-of-delivery",                 question: "What is your preferred method of delivery?",                                      type: "MCQs",         choices: ["Injection", "Non-injectable form (cream, capsule, nasal spray, troche, etc.)", "Both or No preference"],                                                                                                                                     placeholder: null,                  checkbox: false, image: false },
  { id: 24,  key: "referral_source",                    question: "How did you hear about Primed?",                                                  type: "MCQs",         choices: ["Word of mouth", "Google/Bing", "Instagram", "TikTok", "Facebook", "Reddit", "YouTube", "Newspaper / Magazine", "Other"],                                                                                                                     placeholder: null,                  checkbox: false, image: false },
  { id: 25,  key: "consent_provided",                   question: "Before we submit, please confirm the following:",                                 type: "multi_select", choices: ["I consent to receiving telehealth services from Primed Clinic and understand that these services are not a substitute for emergency care.", "I confirm that all information I have provided is accurate and complete to the best of my knowledge.", "I have read and agree to Primed Clinic's Terms & Conditions and Privacy Policy."], placeholder: null, checkbox: false, image: false },
  // Treatment questions (id 100-108)
  { id: 100, key: "anti-ageing-vitality",               question: "Why are you seeking support with Anti-Ageing & Vitality? (Select all that apply)", type: "multi_select", choices: ["Fatigue / low energy / burnout", "Ageing recovery / can't bounce back like I used to", "Metabolic slowdown / unexplained weight gain", "Brain fog / poor concentration / mental fatigue", "Joint aches / inflammation / chronic pain", "Male vitality / low drive / libido decline", "Female vitality / perimenopause symptoms", "Older adult / functional decline / frailty concerns (65+)", "I am interested in evidence-based protocols to support ageing well"], placeholder: null, checkbox: false, image: false },
  { id: 101, key: "cognitive-health-performance",        question: "Why are you seeking support with Cognitive Health & Performance? (Select all that apply)", type: "multi_select", choices: ["Focus and concentration difficulties / ADHD-like symptoms", "Brain fog / low mental energy / post-viral fatigue / burnout", "Memory complaints / family history of cognitive decline", "Anxiety-linked cognitive issues / rumination", "Complex history (TBI / stroke / epilepsy / psychiatric history)", "I am interested in evidence-based protocols for brain health"], placeholder: null, checkbox: false, image: false },
  { id: 102, key: "gut-health-immunity",                 question: "Why are you seeking support with Gut Health & Immunity? (Select all that apply)", type: "multi_select", choices: ["Gut barrier issues / bloating / food sensitivities / IBS", "Post-viral fatigue / Long COVID / immune recovery", "Recurrent infections / poor immune resilience", "Autoimmune condition / chronic inflammation (stable)", "Immunosuppressed / chronic infection history", "Gut-brain axis / functional GI symptoms with anxiety", "Microbiome recovery / post-antibiotic / dysbiosis", "I am interested in evidence-based protocols for gut health"], placeholder: null, checkbox: false, image: false },
  { id: 103, key: "injury-repair-recovery",              question: "Why are you seeking support with Injury Repair & Recovery? (Select all that apply)", type: "multi_select", choices: ["Acute soft-tissue injury (muscle strain, ligament sprain)", "Chronic tendinopathy / overuse injury", "Post-operative recovery / wound healing / scar tissue", "Joint degeneration / cartilage pain / osteoarthritis", "Systemic inflammation / autoimmune overlay", "I am interested in evidence-based protocols for recovery"], placeholder: null, checkbox: false, image: false },
  { id: 104, key: "muscle-strength-building",            question: "Why are you seeking support with Muscle Strength & Building? (Select all that apply)", type: "multi_select", choices: ["Muscle loss / difficulty maintaining muscle", "Hard gainer / struggles to gain weight or size", "Post-weight-loss lean mass preservation (inc. post-GLP-1)", "Injury-limited training / tendon or soft-tissue issues", "Age-related muscle loss / sarcopenia risk (50+)", "Performance plateau / training and diet already optimised", "I am interested in evidence-based protocols for muscle growth"], placeholder: null, checkbox: false, image: false },
  { id: 105, key: "sexual-health",                       question: "Why are you seeking support with Sexual Health? (Select all that apply)", type: "multi_select", choices: ["Erectile dysfunction (situational or persistent)", "Male low libido / low energy / reduced drive", "Premature ejaculation", "Female low desire / arousal difficulties (HSDD)", "Couples / psychogenic dysfunction / performance anxiety", "Male performance optimisation (no dysfunction)", "I am interested in evidence-based protocols for sexual health"], placeholder: null, checkbox: false, image: false },
  { id: 106, key: "skin-care",                           question: "Why are you seeking support with Skin Care? (Select all that apply)", type: "multi_select", choices: ["Anti-ageing / fine lines / wrinkles / skin laxity", "Acne (comedonal, hormonal, mild-moderate)", "Hyperpigmentation / melasma / uneven skin tone", "Sensitive skin / barrier issues / redness / rosacea", "Wound healing / post-procedure recovery / scarring", "Tan enhancement (Melanotan II)", "Hyperhidrosis (excessive sweating)", "Hair and scalp health / thinning / slow growth", "I am interested in evidence-based protocols for skin health"], placeholder: null, checkbox: false, image: false },
  { id: 107, key: "weight-loss-weight-management",       question: "Why are you seeking support with Weight Loss & Weight Management? (Select all that apply)", type: "multi_select", choices: ["Primary obesity / BMI 30+ (or 27+ with comorbidity)", "Type 2 diabetes / pre-diabetes / metabolic syndrome", "Appetite and cravings-driven weight gain / injection-averse", "Female hormonal weight gain / PCOS / peri-menopausal", "Post-partum weight retention / pregnancy planning", "Sarcopenic obesity / older adult / frailty risk (65+)", "Male hormonal weight gain / low testosterone", "I am interested in evidence-based protocols for weight management"], placeholder: null, checkbox: false, image: false },
  { id: 108, key: "womens-health",                       question: "Why are you seeking support with Women's Health? (Select all that apply)", type: "multi_select", choices: ["Perimenopause symptoms (hot flushes, night sweats, mood)", "Post-menopause / systemic HRT needs", "GSM / vaginal atrophy / urogenital symptoms", "Low libido / HSDD (reduced desire with personal distress)", "Bone health / osteoporosis risk / osteopenia", "PCOS / hormonal and metabolic issues", "I am interested in evidence-based protocols for women's health"], placeholder: null, checkbox: false, image: false },
];

export default defineConfig(({ mode }) => {
  // Load .env — pass "" as prefix to capture REACT_APP_* vars (not just VITE_*)
  const env = loadEnv(mode, process.cwd(), "");

  // Make every REACT_APP_* variable available as process.env.REACT_APP_* at
  // compile time so the existing source files need no changes.
  const defines = {
    "process.env.NODE_ENV": JSON.stringify(
      mode === "production" ? "production" : "development"
    ),
  };
  Object.keys(env).forEach((key) => {
    if (key.startsWith("REACT_APP_")) {
      defines[`process.env.${key}`] = JSON.stringify(env[key]);
    }
  });

  return {
    plugins: [
      // ── Dev-only mock API plugin ─────────────────────────────────────────────
      // Intercepts /api/initial-questionnaire so the questionnaire can be
      // navigated in dev without a running backend.
      {
        name: "mock-api",
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            if (req.url?.startsWith("/api/initial-questionnaire")) {
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify(mockQuestions));
              return;
            }
            if (req.method === "POST" && req.url?.startsWith("/api/register/complete")) {
              res.setHeader("Content-Type", "application/json");
              res.statusCode = 200;
              res.end(JSON.stringify({ message: "Registration completed successfully", user: { id: 61, name: "Test User" } }));
              return;
            }
            next();
          });
        },
      },
      react({ include: /\.(jsx|js|tsx|ts)$/ }),
      requireTransformPlugin(),
      cssInjectedByJs(), // injects all CSS into the JS bundle at runtime
    ],

    server: {
      port: parseInt(process.env.PORT || "5180"),
    },

    define: defines,

    optimizeDeps: {
      esbuildOptions: {
        loader: { ".js": "jsx" },
      },
    },

    build: {
      lib: {
        entry: "src/index.jsx",
        name: "PrimedSurvey",
        // Always output as survey-widget.js regardless of hash
        fileName: () => "questionnaire.js",
        formats: ["iife"], // Self-executing — no module system required on host page
      },
      // Let Vite's built-in CJS plugin handle module.exports → ESM conversion.
      // transformMixedEsModules is needed because packages like react ship CJS
      // while their consumers (react-helmet-async, etc.) use ESM imports.
      commonjsOptions: {
        transformMixedEsModules: true,
      },
      rollupOptions: {
        output: {
          inlineDynamicImports: true, // merge all chunks into the one IIFE file
        },
      },
      // Inline ALL static assets (images, fonts) as base64 data URIs
      // so the output truly is a single self-contained file.
      assetsInlineLimit: 10 * 1024 * 1024, // 10 MB ceiling
      cssCodeSplit: false,
      sourcemap: false,
      minify: true,
      outDir: "dist",
      emptyOutDir: true,
    },
  };
});
