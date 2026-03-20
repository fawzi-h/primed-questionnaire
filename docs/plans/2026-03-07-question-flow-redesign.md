# Question Flow Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign the questionnaire flow to remove 4 questions (age_over_18, has_diagnosed_with_cancer, peptides pair), change medical_conditions from multi-select to MCQ+textarea, change medications_details from multi-select to textarea, add IHI field to Medicare group, add method-of-delivery single-select, add treatment-goal-specific Q19 multi-select, add womens-health treatment, fix sexual-health-libido typo.

**Architecture:** Key-based visibility logic (already used by SurveyQuestions.jsx) replaces index-based logic in SignupSurveyQuestions.jsx. A new `src/data/treatmentQuestions.js` module holds the treatment-goal Q19 choices mapping. Both questionnaire components get identical question flow changes. Mock questions in vite.config.js updated to match.

**Tech Stack:** React 18, esbuild, Vite dev server

---

### Task 1: Create treatment questions data module

**Files:**
- Create: `src/data/treatmentQuestions.js`

**Step 1: Create the data file**

```js
// Treatment slug -> Q19 key mapping and choices
export const TREATMENT_QUESTION_MAP = {
  "anti-ageing": "anti-ageing-vitality",
  "cognitive-support": "cognitive-health-performance",
  "gut-health-immunity": "gut-health-immunity",
  "injury-repair-recovery": "injury-repair-recovery",
  "muscle-strength-support": "muscle-strength-building",
  "sexual-health-libido": "sexual-health",
  "skin-care": "skin-care",
  "weight-loss": "weight-loss-weight-management",
  "womens-health": "womens-health",
  "hormone-therapy": "womens-health",
};

export const TREATMENT_QUESTION_CHOICES = {
  "anti-ageing-vitality": [
    "Fatigue / low energy / burnout",
    "Ageing recovery / can't bounce back like I used to",
    "Metabolic slowdown / unexplained weight gain",
    "Brain fog / poor concentration / mental fatigue",
    "Joint aches / inflammation / chronic pain",
    "Male vitality / low drive / libido decline",
    "Female vitality / perimenopause symptoms",
    "Older adult / functional decline / frailty concerns (65+)",
    "I am interested in evidence-based protocols to support ageing well",
  ],
  "cognitive-health-performance": [
    "Focus and concentration difficulties / ADHD-like symptoms",
    "Brain fog / low mental energy / post-viral fatigue / burnout",
    "Memory complaints / family history of cognitive decline",
    "Anxiety-linked cognitive issues / rumination",
    "Complex history (TBI / stroke / epilepsy / psychiatric history)",
    "I am interested in evidence-based protocols for brain health",
  ],
  "gut-health-immunity": [
    "Gut barrier issues / bloating / food sensitivities / IBS",
    "Post-viral fatigue / Long COVID / immune recovery",
    "Recurrent infections / poor immune resilience",
    "Autoimmune condition / chronic inflammation (stable)",
    "Immunosuppressed / chronic infection history",
    "Gut-brain axis / functional GI symptoms with anxiety",
    "Microbiome recovery / post-antibiotic / dysbiosis",
    "I am interested in evidence-based protocols for gut health",
  ],
  "injury-repair-recovery": [
    "Acute soft-tissue injury (muscle strain, ligament sprain)",
    "Chronic tendinopathy / overuse injury",
    "Post-operative recovery / wound healing / scar tissue",
    "Joint degeneration / cartilage pain / osteoarthritis",
    "Systemic inflammation / autoimmune overlay",
    "I am interested in evidence-based protocols for recovery",
  ],
  "muscle-strength-building": [
    "Muscle loss / difficulty maintaining muscle",
    "Hard gainer / struggles to gain weight or size",
    "Post-weight-loss lean mass preservation (inc. post-GLP-1)",
    "Injury-limited training / tendon or soft-tissue issues",
    "Age-related muscle loss / sarcopenia risk (50+)",
    "Performance plateau / training and diet already optimised",
    "I am interested in evidence-based protocols for muscle growth",
  ],
  "sexual-health": [
    "Erectile dysfunction (situational or persistent)",
    "Male low libido / low energy / reduced drive",
    "Premature ejaculation",
    "Female low desire / arousal difficulties (HSDD)",
    "Couples / psychogenic dysfunction / performance anxiety",
    "Male performance optimisation (no dysfunction)",
    "I am interested in evidence-based protocols for sexual health",
  ],
  "skin-care": [
    "Anti-ageing / fine lines / wrinkles / skin laxity",
    "Acne (comedonal, hormonal, mild-moderate)",
    "Hyperpigmentation / melasma / uneven skin tone",
    "Sensitive skin / barrier issues / redness / rosacea",
    "Wound healing / post-procedure recovery / scarring",
    "Tan enhancement (Melanotan II)",
    "Hyperhidrosis (excessive sweating)",
    "Hair and scalp health / thinning / slow growth",
    "I am interested in evidence-based protocols for skin health",
  ],
  "weight-loss-weight-management": [
    "Primary obesity / BMI 30+ (or 27+ with comorbidity)",
    "Type 2 diabetes / pre-diabetes / metabolic syndrome",
    "Appetite and cravings-driven weight gain / injection-averse",
    "Female hormonal weight gain / PCOS / peri-menopausal",
    "Post-partum weight retention / pregnancy planning",
    "Sarcopenic obesity / older adult / frailty risk (65+)",
    "Male hormonal weight gain / low testosterone",
    "I am interested in evidence-based protocols for weight management",
  ],
  "womens-health": [
    "Perimenopause symptoms (hot flushes, night sweats, mood)",
    "Post-menopause / systemic HRT needs",
    "GSM / vaginal atrophy / urogenital symptoms",
    "Low libido / HSDD (reduced desire with personal distress)",
    "Bone health / osteoporosis risk / osteopenia",
    "PCOS / hormonal and metabolic issues",
    "I am interested in evidence-based protocols for women's health",
  ],
};

export const METHOD_OF_DELIVERY_CHOICES = [
  "Injection",
  "Non-injectable form (cream, capsule, nasal spray, troche, etc.)",
  "Both or No preference",
];

/**
 * Get the Q19 question text for a treatment slug.
 */
const TREATMENT_LABELS = {
  "anti-ageing-vitality": "Anti-Ageing & Vitality",
  "cognitive-health-performance": "Cognitive Health & Performance",
  "gut-health-immunity": "Gut Health & Immunity",
  "injury-repair-recovery": "Injury Repair & Recovery",
  "muscle-strength-building": "Muscle Strength & Building",
  "sexual-health": "Sexual Health",
  "skin-care": "Skin Care",
  "weight-loss-weight-management": "Weight Loss & Weight Management",
  "womens-health": "Women's Health",
};

export function getTreatmentQuestionText(questionKey) {
  const label = TREATMENT_LABELS[questionKey] || questionKey;
  return `Why are you seeking support with ${label}? (Select all that apply)`;
}
```

**Step 2: Verify file is importable**

Run: `node -e "import('./src/data/treatmentQuestions.js').then(m => console.log(Object.keys(m)))"`
Expected: lists the exports

**Step 3: Commit**
```bash
git add src/data/treatmentQuestions.js
git commit -m "feat: add treatment-goal Q19 choices data module"
```

---

### Task 2: Update mock questions in vite.config.js

**Files:**
- Modify: `vite.config.js` — replace `mockQuestions` array

**Step 1: Replace the mockQuestions array**

The new array must match this order (20 visible questions + 3 hidden medicare sub-fields):

```js
const mockQuestions = [
  { key: "sex_at_birth",                question: "What was your sex at birth?",                                                              type: "MCQs",         choices: ["Male", "Female"],  placeholder: null, checkbox: false, image: false },
  { key: "pregnancy_status",            question: "Are you currently pregnant or breastfeeding, or trying to fall pregnant?",                 type: "MCQs",         choices: ["Yes", "No"],      placeholder: null, checkbox: false, image: false },
  { key: "date_of_birth",               question: "What is your date of birth?",                                                              type: "date_input",   choices: null,               placeholder: null, checkbox: false, image: false },
  { key: "height",                      question: "What is your height (in cm)?",                                                             type: "input",        choices: null,               placeholder: "Enter Your Height", checkbox: false, image: false },
  { key: "weight",                      question: "What is your weight (in kg)?",                                                             type: "weight_input", choices: null,               placeholder: "Enter Your Weight", checkbox: false, image: false },
  { key: "has_medical_conditions",      question: "Do you have any current or past medical conditions or injuries?",                          type: "MCQs",         choices: ["Yes", "No"],      placeholder: null, checkbox: false, image: false },
  { key: "medical_conditions_details",  question: "Please provide details about your medical conditions or injuries.",                        type: "Textarea",     choices: null,               placeholder: "Explain Here", checkbox: false, image: false },
  { key: "has_family_history",          question: "Do you have a family history of any medical condition(s) or disorder(s)?",                 type: "MCQs",         choices: ["Yes", "No"],      placeholder: null, checkbox: false, image: false },
  { key: "family_history_details",      question: "Please explain the medical illness that has run within your family.",                       type: "Textarea",     choices: null,               placeholder: "Explain Here", checkbox: false, image: false },
  { key: "taking_medications",          question: "Are you currently taking or have you ever taken any medications or supplements?",           type: "MCQs",         choices: ["Yes", "No"],      placeholder: null, checkbox: false, image: false },
  { key: "medications_details",         question: "Please list all medications and supplements you are currently taking.",                     type: "Textarea",     choices: null,               placeholder: "(eg) Ibuprofen 200mg twice daily", checkbox: 1, image: false },
  { key: "has_allergies",               question: "Do you have any known drug or food allergies?",                                            type: "MCQs",         choices: ["Yes", "No"],      placeholder: null, checkbox: false, image: false },
  { key: "allergies_details",           question: "What allergies do you have?",                                                              type: "Textarea",     choices: null,               placeholder: "Explain Here", checkbox: false, image: false },
  { key: "has_additional_info",         question: "Anything else your practitioner needs to consider?",                                       type: "MCQs",         choices: ["Yes", "No"],      placeholder: null, checkbox: false, image: false },
  { key: "additional_info_details",     question: "Please provide as much detail as possible for your practitioner to consider.",              type: "Textarea",     choices: null,               placeholder: "Explain Here", checkbox: false, image: false },
  { key: "medicare_number",             question: "What are your Medicare details?",                                                          type: "input",        choices: null,               placeholder: "Enter Medicare Number", checkbox: 1, image: 1, description: "Don't have a Medicare card? You can provide your Individual Healthcare Identifier (IHI) number instead." },
  { key: "medicare_expiry",             question: "What is the expiry?",                                                                      type: null,           choices: null,               placeholder: "Enter Expiry Date", checkbox: false, image: false },
  { key: "individual_reference_number", question: "What is your Individual Reference Number?",                                                type: "input",        choices: null,               placeholder: "Enter Your IRN", checkbox: 1, image: 1 },
  { key: "referral_source",             question: "How did you hear about Primed?",                                                           type: "MCQs",         choices: ["Word of mouth", "Google/Bing", "Instagram", "TikTok", "Facebook", "Reddit", "YouTube", "Newspaper / Magazine", "Other"], placeholder: null, checkbox: false, image: false },
  { key: "method_of_delivery",          question: "What is your preferred method of delivery?",                                               type: "single_select", choices: ["Injection", "Non-injectable form (cream, capsule, nasal spray, troche, etc.)", "Both or No preference"], placeholder: null, checkbox: false, image: false },
  { key: "treatment_goal_question",     question: "Why are you seeking support? (Select all that apply)",                                     type: "treatment_goal_multi_select", choices: null, placeholder: null, checkbox: false, image: false },
];
```

Note: `age_over_18`, `has_diagnosed_with_cancer`, `has_taken_peptides_hormone_therapy`, `taken_peptides_hormone_therapy` are removed from the mock. The real API should also be updated, but that's a backend change.

**Step 2: Verify dev server starts**

Run: `npm start` (confirm no crash)

**Step 3: Commit**
```bash
git add vite.config.js
git commit -m "feat: update mock questions for new flow"
```

---

### Task 3: Fix TreatmentSelection — add womens-health, fix typo

**Files:**
- Modify: `src/pages/TreatmentSelection.jsx`

**Step 1: Fix the typo and add womens-health**

In the `treatments` array:
- Change `"sexual-health-libido"` to `"sexual-health-libido"` (slug, id stays 5)
- Add new entry after the last treatment:
  ```js
  { slug: "womens-health", id: 11, label: "Women's Health", img: CDN + "6993e4f3c649c536843ad00f_Thyroid%20Disease%20Hypothyroidism%20Jan%208%202026%20(1).webp" },
  ```
  (Reuse hormone-therapy image as placeholder — update when a real image is available)

**Step 2: Commit**
```bash
git add src/pages/TreatmentSelection.jsx
git commit -m "feat: add womens-health treatment, fix sexual-health-libido typo"
```

---

### Task 4: Update SignupSurveyQuestions — answers state, visibility, isQuestionAnswered

**Files:**
- Modify: `src/components/SignupSurveyQuestions.jsx`

**Step 1: Update imports**

Add at top of file:
```js
import { TREATMENT_QUESTION_MAP, TREATMENT_QUESTION_CHOICES, METHOD_OF_DELIVERY_CHOICES, getTreatmentQuestionText } from "../data/treatmentQuestions";
```

**Step 2: Update initial answers state (line ~184)**

Replace the current `answers` state object with:
```js
const [answers, setAnswers] = useState({
  sex_at_birth: "",
  pregnancy_status: "",
  date_of_birth: "",
  height: "",
  weight: "",
  has_medical_conditions: "",
  medical_conditions_details: "",
  has_family_history: "",
  family_history_details: "",
  taking_medications: "",
  medications_details: "",
  has_allergies: "",
  allergies_details: "",
  has_additional_info: "",
  additional_info_details: "",
  medicare_number: "",
  medicare_expiry: "",
  individual_reference_number: "",
  ihi_number: "",
  referral_source: "",
  method_of_delivery: "",
  treatment_goal_question: [],
});
```

**Step 3: Refactor isQuestionVisible to key-based (line ~333)**

Replace the entire `isQuestionVisible` function with:
```js
const isQuestionVisible = (index, ans = answers) => {
  if (!questions[index]) return true;
  const key = questions[index].key;
  if (key === "pregnancy_status" && ans.sex_at_birth === "Male") return false;
  if (key === "medical_conditions_details" && ans.has_medical_conditions !== "Yes") return false;
  if (key === "family_history_details" && ans.has_family_history !== "Yes") return false;
  if (key === "medications_details" && ans.taking_medications !== "Yes") return false;
  if (key === "allergies_details" && ans.has_allergies !== "Yes") return false;
  if (key === "additional_info_details" && ans.has_additional_info !== "Yes") return false;
  if (key === "medicare_expiry" || key === "individual_reference_number") return false;
  return true;
};
```

**Step 4: Update isQuestionAnswered to key-based (line ~532)**

Replace the entire `isQuestionAnswered` function with:
```js
const isQuestionAnswered = (index) => {
  if (!questions || !questions[index]) return false;
  const question = questions[index];
  const answer = answers[question.key];

  if (question.key === "medicare_number") {
    if (medicareCheckbox) return true;
    const expQ = questions.find((q) => q.key === "medicare_expiry");
    const irnQ = questions.find((q) => q.key === "individual_reference_number");
    const a1 = answers.medicare_number;
    const a2 = expQ ? answers[expQ.key] : null;
    const a3 = irnQ ? answers[irnQ.key] : null;
    return (a1 !== undefined && a1 !== "" && a2 instanceof Date && !isNaN(a2) && a3 !== undefined && a3 !== "");
  }

  if (question.key === "medications_details") {
    if (medicineCheckbox) return true;
    return answer !== undefined && answer !== "";
  }

  if (question.key === "height") {
    return answer !== undefined && answer !== "" && parseFloat(answer) >= 50 && parseFloat(answer) <= 251;
  }

  if (question.key === "weight") {
    return answer !== undefined && answer !== "" && parseFloat(answer) >= 40 && parseFloat(answer) <= 300;
  }

  if (question.key === "method_of_delivery") {
    return answer !== undefined && answer !== "";
  }

  if (question.key === "treatment_goal_question") {
    return Array.isArray(answer) && answer.length > 0;
  }

  return answer !== undefined && answer !== "";
};
```

**Step 5: Commit**
```bash
git add src/components/SignupSurveyQuestions.jsx
git commit -m "feat(signup): key-based visibility, updated answers state"
```

---

### Task 5: Update SignupSurveyQuestions — renderQuestion

**Files:**
- Modify: `src/components/SignupSurveyQuestions.jsx`

**Step 1: Update the medicare rendering block (line ~1126)**

In `renderQuestion`, change the medicare check from `if (index === 15)` to `if (question.key === "medicare_number")`. Also change `questions[15]`, `questions[16]`, `questions[17]` references to key-based lookups:

```js
if (question.key === "medicare_number") {
  const medQ = question;
  const expQ = questions.find((q) => q.key === "medicare_expiry");
  const irnQ = questions.find((q) => q.key === "individual_reference_number");
```

And update the checkbox `onChange` handler to use key-based references:
```js
setAnswers((prev) => ({
  ...prev,
  medicare_number: "",
  medicare_expiry: "",
  individual_reference_number: "",
}));
setErrors((prev) => {
  const newErrors = { ...prev };
  delete newErrors.medicare_number;
  delete newErrors.medicare_expiry;
  delete newErrors.individual_reference_number;
  return newErrors;
});
```

Add IHI field after the checkbox:
```jsx
<div className="mb-4 form-outline px-2 mt-4">
  <p className="text-sm text-gray-600 mb-2">
    Don't have a Medicare card? Please provide your Individual Healthcare Identifier (IHI) number.
  </p>
  <input
    type="text"
    value={answers.ihi_number || ""}
    onChange={(e) => handleAnswer("ihi_number", e.target.value)}
    className={`form-control${inputClass ? ` ${inputClass}` : ""} border rounded px-2 py-2 w-full`}
    placeholder="Enter IHI Number (optional)"
  />
</div>
```

**Step 2: Remove the index-based Q16/Q17 skip**

Remove line: `if (index === 16 || index === 17) return null;`

Replace with key-based:
```js
if (question.key === "medicare_expiry" || question.key === "individual_reference_number") return null;
```

**Step 3: Add single_select case for method_of_delivery**

Add a new case in the `switch (question.type)` block:

```jsx
case "single_select":
  return (
    <div className="mb-4">
      <h4 className={`card-question mt-5${labelClass ? ` ${labelClass}` : ""}`}>
        {sanitizeInput(question.question)}
      </h4>
      <ul className="card-list">
        {question.choices.map((choice, choiceIndex) => (
          <li
            key={choiceIndex}
            onClick={() => {
              handleAnswer(question.key, choice);
              // Auto-advance after brief pause
              setTimeout(() => {
                let nextIndex = index + 1;
                const newAnswers = { ...answers, [question.key]: choice };
                while (nextIndex < questions.length && !isQuestionVisible(nextIndex, newAnswers)) {
                  nextIndex++;
                }
                if (nextIndex < questions.length) {
                  setCurrentQuestion(nextIndex);
                  setProgress(((nextIndex + 1) / questions.length) * 100);
                } else {
                  setShowConsentStep(true);
                }
              }, 350);
            }}
            className={`cursor-pointer mb-2 px-4 py-2 rounded ${
              answers[question.key] === choice ? "bg-blue-500 selected-answer" : "bg-gray-200"
            }`}
          >
            <div className="radioBtn"></div>
            {sanitizeInput(choice)}
          </li>
        ))}
      </ul>
    </div>
  );
```

**Step 4: Add treatment_goal_multi_select case**

Add another case in the `switch` block. This renders a multi-select whose choices depend on the current treatment slug from the URL:

```jsx
case "treatment_goal_multi_select": {
  const treatmentSlug = window.location.pathname.split("/")[2] || sessionStorage.getItem("treatment_plan") || "";
  const questionKey = TREATMENT_QUESTION_MAP[treatmentSlug];
  const choices = questionKey ? (TREATMENT_QUESTION_CHOICES[questionKey] || []) : [];
  const questionText = questionKey ? getTreatmentQuestionText(questionKey) : question.question;
  const currentValues = Array.isArray(answers.treatment_goal_question) ? answers.treatment_goal_question : [];

  if (choices.length === 0) {
    // No treatment-specific question — auto-advance to consent
    if (!showConsentStep) setShowConsentStep(true);
    return null;
  }

  return (
    <div className="mb-4">
      <h4 className={`card-question mt-5${labelClass ? ` ${labelClass}` : ""}`}>
        {sanitizeInput(questionText)}
      </h4>
      <ul className="card-list">
        {choices.map((choice, choiceIndex) => {
          const isSelected = currentValues.includes(choice);
          return (
            <li
              key={choiceIndex}
              onClick={() => {
                const updated = isSelected
                  ? currentValues.filter((v) => v !== choice)
                  : [...currentValues, choice];
                handleAnswer("treatment_goal_question", updated);
              }}
              className={`cursor-pointer mb-2 px-4 py-2 rounded ${
                isSelected ? "bg-blue-500 selected-answer" : "bg-gray-200"
              }`}
            >
              <div className="radioBtn"></div>
              {sanitizeInput(choice)}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
```

**Step 5: Commit**
```bash
git add src/components/SignupSurveyQuestions.jsx
git commit -m "feat(signup): add method-of-delivery, treatment Q19, IHI field, key-based rendering"
```

---

### Task 6: Update SignupSurveyQuestions — navigation and submit

**Files:**
- Modify: `src/components/SignupSurveyQuestions.jsx`

**Step 1: Update handleNext medicare validation to key-based (line ~1572)**

Replace:
```js
const medicareKeys = ["medicare_number", "individual_reference_number"];
if (medicareKeys.includes(questions[currentQuestion].key) && !medicareCheckbox) {
```
With:
```js
if (questions[currentQuestion]?.key === "medicare_number" && !medicareCheckbox) {
```

And replace `question_15` / `question_17` error keys with `medicare_number` / `individual_reference_number`.

**Step 2: Update handleNext pregnancy check to key-based**

Replace `if (currentQuestion === 1 && answers.pregnancy_status === "Yes")` with:
```js
if (questions[currentQuestion]?.key === "pregnancy_status" && answers.pregnancy_status === "Yes")
```

**Step 3: Update handlePrevious — remove hardcoded index 18 skip**

Remove these lines:
```js
if (currentQuestion === 18) {
  setCurrentQuestion(prevIndex - 2);
}
```

The key-based `isQuestionVisible` already handles skipping hidden questions.

**Step 4: Update handleNext — if past last question, show consent**

After the while loop in handleNext, add the else clause:
```js
if (nextIndex < questions.length) {
  setCurrentQuestion(nextIndex);
  setProgress(((nextIndex + 1) / questions.length) * 100);
} else {
  setShowConsentStep(true);
}
```

**Step 5: Update MCQs auto-advance pregnancy stop to key-based (line ~1290)**

Replace `if (index === 1 && choice === "Yes")` with:
```js
if (question.key === "pregnancy_status" && choice === "Yes")
```

**Step 6: Update all 3 submit payloads (handleSubmit, handleSave, sendStoppedQuestionnaireData)**

Add these new fields to each payload:
```js
ihi_number: answers.ihi_number,
method_of_delivery: answers.method_of_delivery,
treatment_goal_question: Array.isArray(answers.treatment_goal_question) ? answers.treatment_goal_question.join(", ") : "",
```

Keep sending empty values for removed questions:
```js
age_over_18: "",
has_diagnosed_with_cancer: "",
has_taken_peptides_hormone_therapy: "",
taken_peptides_hormone_therapy: "",
```

**Step 7: Update the "Thank You" screen text**

Replace the current thank-you message with:
```
Thank you for completing your health assessment. To book in your FREE consultation, you will be redirected shortly to your dashboard to verify your email and mobile, and then select a time that suits you best.
```

**Step 8: Commit**
```bash
git add src/components/SignupSurveyQuestions.jsx
git commit -m "feat(signup): key-based navigation, new fields in submit payload"
```

---

### Task 7: Update SurveyQuestions.jsx — same changes

**Files:**
- Modify: `src/components/SurveyQuestions.jsx`

**Step 1: Add imports**

```js
import { TREATMENT_QUESTION_MAP, TREATMENT_QUESTION_CHOICES, METHOD_OF_DELIVERY_CHOICES, getTreatmentQuestionText } from "../data/treatmentQuestions";
```

**Step 2: Update initial answers state**

Replace the current answers object to match new keys (same as SignupSurveyQuestions but also keeping `otherTexts` for any remaining multi-selects):

Remove: `age_over_18`, `has_diagnosed_with_cancer`, `medical_conditions_values` (array), `has_taken_peptides_hormone_therapy`, `taken_peptides_hormone_therapy`, `medications_details` (array)

Add: `has_medical_conditions`, `medical_conditions_details`, `medications_details` (string), `ihi_number`, `method_of_delivery`, `treatment_goal_question` (array)

**Step 3: Update isQuestionVisible**

Replace current key-based visibility with the new set (remove peptides/cancer rules, add `medical_conditions_details`, keep `medicare_expiry`/`individual_reference_number` hidden):

```js
const isQuestionVisible = (index, ans = answers) => {
  if (!questions[index]) return true;
  const key = questions[index].key;
  if (key === "pregnancy_status" && ans.sex_at_birth === "Male") return false;
  if (key === "medical_conditions_details" && ans.has_medical_conditions !== "Yes") return false;
  if (key === "family_history_details" && ans.has_family_history !== "Yes") return false;
  if (key === "medications_details" && ans.taking_medications !== "Yes") return false;
  if (key === "allergies_details" && ans.has_allergies !== "Yes") return false;
  if (key === "additional_info_details" && ans.has_additional_info !== "Yes") return false;
  if (key === "medicare_expiry" || key === "individual_reference_number") return false;
  if (key === "consent_provided") return false;
  return true;
};
```

**Step 4: Update isQuestionAnswered**

Use the same key-based logic as SignupSurveyQuestions (Task 4 Step 4), adapted for SurveyQuestions (it uses `otherTexts` but no longer needs multi-select for medications).

**Step 5: Update renderQuestion**

- Change medicare block from `if (question.key === "medicare_number")` (already key-based) — add IHI field
- Add `single_select` and `treatment_goal_multi_select` cases (same as Task 5)
- Remove `multi_select` case if no longer needed (medical_conditions_values was the only multi-select besides medications_details, and both are now textareas). Keep multi_select case for treatment_goal or remove if using dedicated type.

**Step 6: Update all submit payloads**

Same changes as Task 6 Step 6 — add new fields, send empty values for removed questions. Remove `serializeMultiSelect` calls for `medical_conditions_values` and `medications_details` (now strings not arrays).

**Step 7: Update handleNext to show consent when past last question**

Same as Task 6 Step 4.

**Step 8: Commit**
```bash
git add src/components/SurveyQuestions.jsx
git commit -m "feat(survey): key-based visibility, new question types, updated submit"
```

---

### Task 8: Build verification and smoke test

**Step 1: Run production build**

Run: `node build.js`
Expected: `✓ dist/survey-widget.js`

**Step 2: Run dev server**

Run: `npm start`
Expected: Dev server starts on port 5180

**Step 3: Manual smoke test checklist**

- [ ] Treatment selection shows 10 cards (including Women's Health)
- [ ] Sexual Health card slug in URL is `sexual-health-libido`
- [ ] Q1 is sex_at_birth (no age_over_18 before it)
- [ ] Selecting Male skips pregnancy question
- [ ] Q6 (has_medical_conditions) is MCQ Yes/No, not multi-select
- [ ] Q7 (medical_conditions_details) is textarea, shows only if Q6=Yes
- [ ] Q11 (medications_details) is textarea with checkbox, not multi-select
- [ ] Q16 (Medicare) shows IHI field at bottom
- [ ] Q18 (method_of_delivery) is single-select with 3 options
- [ ] Q19 shows treatment-specific multi-select choices
- [ ] Forward/backward navigation works correctly (no index errors)
- [ ] Consent step appears after Q19
- [ ] Submit sends new fields (check Network tab)
- [ ] Thank-you text matches new copy

**Step 4: Commit**
```bash
git commit --allow-empty -m "chore: verified build and smoke test pass"
```

---

## Files Modified
1. `src/data/treatmentQuestions.js` — **NEW**
2. `vite.config.js` — mockQuestions array
3. `src/pages/TreatmentSelection.jsx` — add womens-health, fix typo
4. `src/components/SignupSurveyQuestions.jsx` — visibility, rendering, navigation, submit
5. `src/components/SurveyQuestions.jsx` — same changes as SignupSurveyQuestions
