import { expect, test } from "@playwright/test";
import {
  chooseOption,
  clickContinue,
  completeConsentAndSubmit,
  completeSharedQuestions,
  expectQuestion,
  GOOGLE_BING_TEXT,
  setTreatmentConfig,
  startAssessment,
  treatmentCases,
} from "./helpers/questionnaire";

test.describe.configure({ timeout: 120000 });

test("starts the assessment and reaches the first question", async ({ page }) => {
  await setTreatmentConfig(page, "weight-loss", 2);

  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: /welcome to your assessment/i }),
  ).toBeVisible();

  await startAssessment(page);

  await expect(page.getByText(/question 1 of/i)).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /are you over 18 years of age\?/i }),
  ).toBeVisible();
});

test("completes a full happy path and submits successfully", async ({ page }) => {
  await setTreatmentConfig(page, "weight-loss", 2);

  await page.goto("/");
  await startAssessment(page);

  await completeSharedQuestions(page);

  await expectQuestion(
    page,
    "Why are you seeking support with Weight Loss & Weight Management? (Select all that apply)",
  );
  await chooseOption(page, "Primary obesity / BMI 30+ (or 27+ with comorbidity)");
  await clickContinue(page);

  await expectQuestion(page, "How did you hear about Primed?");
  await chooseOption(page, GOOGLE_BING_TEXT);

  await completeConsentAndSubmit(page);
});

for (const treatmentCase of treatmentCases) {
  test(`shows the ${treatmentCase.slug} treatment-specific question`, async ({
    page,
  }) => {
    await setTreatmentConfig(page, treatmentCase.slug, treatmentCase.id);

    await page.goto("/");
    await startAssessment(page);

    await completeSharedQuestions(page);

    await expectQuestion(page, treatmentCase.question);
    await chooseOption(page, treatmentCase.answer);
    await clickContinue(page);

    await expectQuestion(page, "How did you hear about Primed?");
  });
}
