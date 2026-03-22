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
	{ id: 1,	key: "age_over_18",	question: "Are you over 18 years of age?",	choices: ["Yes", "No"],	type: "MCQs",	placeholder: null,	checkbox: 0,	image: 0 },
	{ id: 2,	key: "sex_at_birth",	question: "What was your sex at birth?",	choices: ["Male", "Female"],	type: "MCQs",	placeholder: null,	checkbox: 0,	image: 0 },
	{ id: 3,	key: "date_of_birth",	question: "What is your date of birth?",	choices: null,	type: "date_input",	placeholder: null,	checkbox: 0,	image: 0 },
	{ id: 4,	key: "height",	question: "What is your height (in cm)?",	choices: null,	type: "input",	placeholder: "Enter Your Height",	checkbox: 0,	image: 0 },
	{ id: 5,	key: "weight",	question: "What is your weight (in kg)?",	choices: null,	type: "weight_input",	placeholder: "Enter Your Weight",	checkbox: 0,	image: 0 },
	{ id: 6,	key: " smoke-or-vape",	question: "Do you currently smoke or vape?",	choices: ["Yes, daily", "Yes, occasionally", "No"],	type: "MCQs",	placeholder: null,	checkbox: 0,	image: 0 },
	{ id: 7,	key: "drink-alcohol",	question: "Do you drink alcohol?",	choices: ["Yes, weekly", "Yes, occasionally", "No"],	type: "MCQs",	placeholder: null,	checkbox: 0,	image: 0 },
	{ id: 8,	key: "exercise",	question: "How often do you exercise? ",	choices: ["Daily", "3-5 times a week", "1-2 times a week", "No exercise"],	type: "MCQs",	placeholder: null,	checkbox: 0,	image: 0 },
	{ id: 9,	key: "pregnancy_status",	question: "Are you currently pregnant or breastfeeding, or trying to fall pregnant?",	choices: ["Yes", "No"],	type: "MCQs",	placeholder: null,	checkbox: 0,	image: 0 },
	{ id: 10,	key: "medical_conditions_values",	question: "Do you currently have or have you ever been diagnosed with any of the following?\n                    (Select all that apply)",	choices: ["Diabetes (Type 1 or Type 2)", "High blood pressure", "High cholesterol", "Thyroid condition", "Heart disease or heart attack", "Irregular heart rhythm", "Stroke or TIA", "Epilepsy or seizures", "Depression", "Anxiety", "Bipolar disorder", "Other mental health condition", "Gastrointestinal disease (e.g. IBS, IBD, Coeliac)", "Autoimmune disease", "Chronic kidney disease", "Chronic liver disease", "None of the above", "Other"],	type: "multi_select",	placeholder: null,	checkbox: 0,	image: 0 },
	{ id: 11,	key: "has_diagnosed_with_cancer",	question: "Have you been diagnosed with cancer in the past 5 years?",	choices: ["Yes", "No"],	type: "MCQs",	placeholder: null,	checkbox: 0,	image: 0 },
	{ id: 12,	key: "has_family_history",	question: "Do you have a family history of any medical condition(s) or disorder(s)?",	choices: ["Yes", "No"],	type: "MCQs",	placeholder: null,	checkbox: 0,	image: 0 },
	{ id: 13,	key: "family_history_details",	question: "Please explain the medical illness that has run within your family.",	choices: null,	type: "Textarea",	placeholder: "Explain Here",	checkbox: 0,	image: 0 },
	{ id: 14,	key: "taking_medications",	question: "Are you currently taking or have you ever taken any medications or supplements?",	choices: ["Yes", "No"],	type: "MCQs",	placeholder: null,	checkbox: 0,	image: 0 },
	{ id: 15,	key: "medications_details",	question: "Do you currently take any of the following? (Select all that apply)",	choices: ["Blood pressure medication", "Diabetes medication (including insulin)", "Blood thinners", "Antidepressants or anti-anxiety medication", "Hormone therapy (including HRT or testosterone)", "None of the above"],	type: "multi_select",	placeholder: "(eg) Ibuprofen 200mg twice daily",	checkbox: 0,	image: 0 },
	{ id: 16,	key: "has_allergies",	question: "Do you have any known drug or food allergies?",	choices: ["Yes", "No"],	type: "MCQs",	placeholder: null,	checkbox: 0,	image: 0 },
	{ id: 17,	key: "allergies_details",	question: "What allergies do you have?",	choices: null,	type: "Textarea",	placeholder: "Explain Here",	checkbox: 0,	image: 0 },
	{ id: 18,	key: "has_taken_peptides_hormone_therapy",	question: "Have you ever taken peptides and/or hormone-based therapies?",	choices: ["Yes", "No"],	type: "MCQs",	placeholder: null,	checkbox: 0,	image: 0 },
	{ id: 19,	key: "taken_peptides_hormone_therapy",	question: "What peptide and/or hormone therapies have you used?",	choices: null,	type: "Textarea",	placeholder: "Explain Here",	checkbox: 0,	image: 0 },
	{ id: 20,	key: "has_additional_info",	question: "Anything else your practitioner needs to consider?",	choices: ["Yes", "No"],	type: "MCQs",	placeholder: null,	checkbox: 0,	image: 0 },
	{ id: 21,	key: "additional_info_details",	question: "Please provide as much detail as possible for your practitioner to consider.",	choices: null,	type: "Textarea",	placeholder: "Explain Here",	checkbox: 0,	image: 0 },
	{ id: 22,	key: "medicare_number",	question: "What are your Medicare details?",	choices: null,	type: "input",	placeholder: "Enter Medicare Number",	checkbox: 1,	image: 1 },
	{ id: 22,	key: "individual_reference_number",	question: "What is your Individual Reference Number?",	choices: null,	type: "input",	placeholder: "Enter Your IRN",	checkbox: 1,	image: 1 },
	{ id: 22,	key: "medicare_expiry",	question: "What is the expiry?",	choices: null,	type: "date_input",	placeholder: "Enter Expiry Date",	checkbox: 0,	image: 0 },
	{ id: 23,	key: "method-of-delivery",	question: "What is your preferred method of delivery? (Select one)",	choices: ["Injection", "Non-injectable form (cream, capsule, nasal spray, troche, etc.)", "Both / No preference"],	type: "MCQs",	placeholder: null,	checkbox: 0,	image: 0 },
	{ id: 25,	key: "referral_source",	question: "How did you hear about Primed?",	choices: ["Word of mouth", "Google/Bing", "Instagram", "Tiktok", "Facebook", "Reddit", "Youtube", "Newspaper / Magazine", "Other"],	type: "MCQs",	placeholder: null,	checkbox: 0,	image: 0 },
	{ id: 26,	key: "consent_provided",	question: "Please provide your consent.",	choices: ["I confirm the information provided is true and correct.", "I understand this is not a diagnosis and a clinician will review my responses before prescribing any treatment.", "I consent to being contacted by Primed Clinic via phone, SMS or email regarding my consult and treatment options."],	type: "multi_select",	placeholder: null,	checkbox: 0,	image: 0 },
	//treatment specific questions (keys must match backend for correct ordering and display)
  { id: 100,	key: "anti-ageing-vitality",	question: "Why are you seeking support with Anti-Ageing? (Select all that apply)",	choices: ["Fatigue / low energy / burnout", "Ageing recovery / can't bounce back like I used to", "Metabolic slowdown / unexplained weight gain / body composition changes", "Brain fog / poor concentration / mental fatigue", "Joint aches / inflammation / chronic pain", "Male vitality / low drive / libido decline", "Female vitality / perimenopause symptoms", "Older adult / functional decline / frailty concerns (65+)", "I am interested in evidence-based protocols to support ageing well and optimising my health"],	type: "multi_select",	placeholder: null,	checkbox: 0,	image: 0 },
	{ id: 101,	key: "cognitive-health-performance",	question: "Why are you seeking support with Cognitive Health & Performance? (Select all that apply)",	choices: ["Focus and concentration difficulties / executive function / ADHD-like symptoms", "Brain fog / low mental energy / post-viral fatigue / burnout", "Memory complaints / forgetfulness / family history of cognitive decline", "Anxiety-linked cognitive issues / rumination / 'wired but tired'", "Complex history (TBI / stroke / epilepsy / significant psychiatric or cardiac history)", "I am interested in evidence-based protocols to support cognitive wellness and brain health optimisation"],	type: "multi_select",	placeholder: null,	checkbox: 0,	image: 0 },
	{ id: 102,	key: "gut-health-immunity",	question: "Why are you seeking support with Gut Health & Immunity? (Select all that apply)",	choices: ["Gut barrier issues / bloating / food sensitivities / IBS-type symptoms", "Post-viral fatigue / Long COVID / immune recovery", "Recurrent infections / poor immune resilience", "Autoimmune condition / chronic inflammation (stable)", "Immunosuppressed / chronic infection history", "Gut–brain axis / functional GI symptoms with anxiety or mood issues", "Microbiome recovery / post-antibiotic / dysbiosis", "I am interested in evidence-based protocols to support gut health and immune optimisation"],	type: "multi_select",	placeholder: null,	checkbox: 0,	image: 0 },
	{ id: 103,	key: "muscle-strength-building",	question: "Why are you seeking support with Muscle Strength & Building? (Select all that apply)",	choices: ["Muscle loss / difficulty maintaining muscle", "Hard gainer / struggles to gain weight or size", "Post-weight-loss (including post-GLP-1) lean mass preservation", "Injury-limited training / tendon or soft-tissue issues impacting my training", "Age-related muscle loss / sarcopenia risk / functional decline (50+)", "Performance plateau / training and diet are optimised but progress has stalled", "I am interested in evidence-based protocols to optimise muscle growth, strength, and physical performance"],	type: "multi_select",	placeholder: null,	checkbox: 0,	image: 0 },
	{ id: 104,	key: "sexual-health",	question: "Why are you seeking support with Sexual Health? (Select all that apply)",	choices: ["Erectile dysfunction (situational or persistent)", "Male low libido / low energy / reduced drive", "Female low desire / arousal difficulties (HSDD)", "Couples / psychogenic dysfunction / performance anxiety", "Male performance optimisation (no dysfunction — seeking enhancement)", "I am interested in evidence-based protocols to maintain and optimise sexual health and vitality"],	type: "multi_select",	placeholder: null,	checkbox: 0,	image: 0 },
	{ id: 105,	key: "skin-care",	question: "Why are you seeking support with Skin Care? (Select all that apply)",	choices: ["Anti-ageing / fine lines / wrinkles / skin laxity", "Acne (comedonal, hormonal, mild-moderate)", "Hyperpigmentation / melasma / uneven skin tone", "Gut-skin axis conditions impacting skin", "Sensitive skin / barrier issues / redness / rosacea-like / eczema-prone", "Wound healing / post-procedure recovery / scarring", "I am interested in evidence-based protocols to support healthier, stronger, better-looking skin"],	type: "multi_select",	placeholder: null,	checkbox: 0,	image: 0 },
	{ id: 106,	key: "weight-loss-weight-management",	question: "Why are you seeking support with Weight Loss & Management? (Select all that apply)",	choices: ["Primary obesity / BMI ≥30 (or ≥27 with comorbidity) / lifestyle alone insufficient", "Type 2 diabetes / pre-diabetes / metabolic syndrome / insulin resistance", "Appetite and cravings-driven weight gain / emotional eating / injection-averse", "Female hormonal weight gain / PCOS / peri-menopausal weight changes", "Post-partum weight retention / pregnancy planning / breastfeeding", "Sarcopenic obesity / older adult / frailty risk (65+)", "Male hormonal weight gain / low testosterone / hypogonadal symptoms", "I am interested in evidence-based protocols to support healthy, sustainable weight management and metabolic optimisation"],	type: "multi_select",	placeholder: null,	checkbox: 0,	image: 0 },
	{ id: 107,	key: "womens-health",	question: "Why are you seeking support with Women's Health? (Select all that apply)",	choices: ["Perimenopause symptoms (hot flushes, night sweats, sleep, mood, brain fog)", "Post-menopause / systemic HRT needs", "GSM / vaginal atrophy / urogenital symptoms (dryness, dyspareunia, recurrent UTIs)", "Low libido / HSDD (reduced desire with personal distress)", "Bone health / osteoporosis risk / osteopenia", "PCOS / hormonal and metabolic issues", "I am interested in evidence-based protocols to support women's health, hormonal wellness, and healthy ageing"],	type: "multi_select",	placeholder: null,	checkbox: 0,	image: 0 },
	{ id: 108,	key: "injury-repair-recovery",	question: "Why are you seeking support with Injury Repair & Recovery? (Select all that apply)",	choices: ["Acute soft-tissue injury (muscle strain, ligament sprain, sports injury)", "Chronic tendinopathy / overuse injury (Achilles, rotator cuff, tennis elbow, etc.)", "Post-operative recovery / wound healing / scar tissue", "Joint degeneration / cartilage pain / osteoarthritis", "Systemic inflammation / autoimmune overlay affecting recovery", "I am interested in evidence-based protocols to support recovery, tissue repair, and physical resilience"],	type: "multi_select",	placeholder: null,	checkbox: 0,	image: 0 },
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

