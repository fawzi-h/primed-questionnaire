import { expect } from "@playwright/test";

const START_ASSESSMENT_TEXT = "Start Assessment";
const CONTINUE_TEXT = "Continue";
const SUBMIT_TEXT = "Submit";
const GOOGLE_BING_TEXT = "Google/Bing";
const YES_TEXT = "Yes";
const NO_TEXT = "No";

export const treatmentCases = [
  {
    slug: "anti-ageing",
    id: 1,
    question:
      "Why are you seeking support with Anti-Ageing & Vitality? (Select all that apply)",
    answer: "Fatigue / low energy / burnout",
  },
  {
    slug: "cognitive-health",
    id: 9,
    question:
      "Why are you seeking support with Cognitive Health & Performance? (Select all that apply)",
    answer: "Focus and concentration difficulties / ADHD-like symptoms",
  },
  {
    slug: "gut-health-immunity",
    id: 8,
    question:
      "Why are you seeking support with Gut Health & Immunity? (Select all that apply)",
    answer: "Gut barrier issues / bloating / food sensitivities / IBS",
  },
  {
    slug: "injury-repair-recovery",
    id: 4,
    question:
      "Why are you seeking support with Injury Repair & Recovery? (Select all that apply)",
    answer: "Acute soft-tissue injury (muscle strain, ligament sprain)",
  },
  {
    slug: "muscle-strength-support",
    id: 3,
    question:
      "Why are you seeking support with Muscle Strength & Building? (Select all that apply)",
    answer: "Muscle loss / difficulty maintaining muscle",
  },
  {
    slug: "sexual-health-libido",
    id: 5,
    question:
      "Why are you seeking support with Sexual Health? (Select all that apply)",
    answer: "Erectile dysfunction (situational or persistent)",
  },
  {
    slug: "skin-care",
    id: 10,
    question:
      "Why are you seeking support with Skin Care? (Select all that apply)",
    answer: "Anti-ageing / fine lines / wrinkles / skin laxity",
  },
  {
    slug: "weight-loss",
    id: 2,
    question:
      "Why are you seeking support with Weight Loss & Weight Management? (Select all that apply)",
    answer: "Primary obesity / BMI 30+ (or 27+ with comorbidity)",
  },
  {
    slug: "womens-health",
    id: 7,
    question:
      "Why are you seeking support with Women's Health? (Select all that apply)",
    answer: "Perimenopause symptoms (hot flushes, night sweats, mood)",
  },
];

export async function setTreatmentConfig(page, slug, id = "") {
  await page.addInitScript(({ treatmentSlug, treatmentId }) => {
    window.SURVEY_CONFIG = {
      treatmentName: treatmentSlug,
      treatmentId: String(treatmentId),
      medicareCardImageUrl: "",
    };
  }, { treatmentSlug: slug, treatmentId: id });
}

export async function chooseOption(page, optionText) {
  await page.getByRole("button", { name: optionText, exact: true }).click();
}

export async function startAssessment(page) {
  await page.getByRole("button", { name: START_ASSESSMENT_TEXT, exact: true }).click();
}

export async function expectQuestion(page, questionText) {
  await expect(
    page.getByRole("heading", { name: questionText, exact: true }),
  ).toBeVisible({ timeout: 10000 });
}

export async function clickContinue(page) {
  await page.getByRole("button", { name: CONTINUE_TEXT, exact: true }).click();
}

export async function fillDateInput(page, value) {
  await page.locator('input[type="date"]').fill(value);
}

export async function fillTextboxByPlaceholder(page, placeholder, value) {
  await page.getByPlaceholder(placeholder, { exact: true }).fill(value);
}

export async function fillCurrentTextbox(page, value) {
  await page.getByRole("textbox").fill(value);
}

export async function fillCurrentTextarea(page, value) {
  await page.locator("textarea").fill(value);
}

export async function fillMedicareDetails(page) {
  await expectQuestion(page, "What are your Medicare details?");
  await fillTextboxByPlaceholder(page, "Enter Medicare Number", "2123456789");
  await fillTextboxByPlaceholder(page, "MM/YYYY", "12/2030");
  await fillTextboxByPlaceholder(page, "Enter Your IRN", "1");
  await clickContinue(page);
}

export async function completeSharedQuestions(page) {
  await expectQuestion(page, "Are you over 18 years of age?");
  await chooseOption(page, YES_TEXT);

  await expectQuestion(page, "What was your sex at birth?");
  await chooseOption(page, "Female");

  await expectQuestion(
    page,
    "Are you currently pregnant or breastfeeding, or trying to fall pregnant?",
  );
  await chooseOption(page, NO_TEXT);

  await expectQuestion(page, "What is your date of birth?");
  await fillDateInput(page, "1990-01-01");
  await clickContinue(page);

  await expectQuestion(page, "What is your height (in cm)?");
  await fillCurrentTextbox(page, "170");
  await clickContinue(page);

  await expectQuestion(page, "What is your weight (in kg)?");
  await fillCurrentTextbox(page, "70");
  await clickContinue(page);

  await expectQuestion(
    page,
    "Do you have any current or past medical conditions or injuries? (Select all that apply)",
  );
  await chooseOption(page, "None of the above");
  await clickContinue(page);

  await expectQuestion(
    page,
    "Do you have a family history of any medical condition(s) or disorder(s)?",
  );
  await chooseOption(page, YES_TEXT);

  await expectQuestion(
    page,
    "Please explain the medical illness that has run within your family.",
  );
  await fillCurrentTextarea(page, "Family history details for testing.");
  await clickContinue(page);

  await expectQuestion(page, "Have you ever been diagnosed with cancer?");
  await chooseOption(page, NO_TEXT);

  await expectQuestion(
    page,
    "Are you currently taking or have you ever taken any medications or supplements?",
  );
  await chooseOption(page, YES_TEXT);

  await expectQuestion(
    page,
    "Please select any medications or supplements you are currently taking.",
  );
  await chooseOption(page, "Blood pressure medication");
  await clickContinue(page);

  await expectQuestion(page, "Do you have any known drug or food allergies?");
  await chooseOption(page, YES_TEXT);

  await expectQuestion(page, "What allergies do you have?");
  await fillCurrentTextarea(page, "Penicillin.");
  await clickContinue(page);

  await expectQuestion(
    page,
    "Have you ever taken peptides or hormone therapy before?",
  );
  await chooseOption(page, YES_TEXT);

  await expectQuestion(
    page,
    "Please tell us which peptides or hormone therapy you have used.",
  );
  await fillCurrentTextarea(page, "Previous therapy details.");
  await clickContinue(page);

  await expectQuestion(
    page,
    "Anything else your practitioner needs to consider?",
  );
  await chooseOption(page, YES_TEXT);

  await expectQuestion(
    page,
    "Please provide as much detail as possible for your practitioner to consider.",
  );
  await fillCurrentTextarea(page, "Additional information for testing.");
  await clickContinue(page);

  await expectQuestion(page, "Do you smoke or vape?");
  await chooseOption(page, NO_TEXT);

  await expectQuestion(page, "Do you drink alcohol?");
  await chooseOption(page, NO_TEXT);

  await expectQuestion(page, "How often do you exercise?");
  await chooseOption(page, "Daily");

  await fillMedicareDetails(page);

  await expectQuestion(page, "What is your preferred method of delivery?");
  await chooseOption(page, "Injection");
}

export async function completeConsentAndSubmit(page) {
  await expect(
    page.getByRole("heading", {
      name: "Before we submit, please confirm the following:",
      exact: true,
    }),
  ).toBeVisible();

  const consentRows = page.locator(".sq-consent-row");
  const consentCount = await consentRows.count();
  for (let i = 0; i < consentCount; i += 1) {
    await consentRows.nth(i).click();
  }

  await page.getByRole("button", { name: SUBMIT_TEXT, exact: true }).click();

  await expect(
    page.getByRole("heading", {
      name: "That's it! You're all done.",
      exact: true,
    }),
  ).toBeVisible();
}

export { GOOGLE_BING_TEXT, NO_TEXT, YES_TEXT };
