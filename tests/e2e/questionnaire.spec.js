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

test("starts the assessment and reaches the first question", async ({ page }) => {
  await setTreatmentConfig(page, "weight-loss");

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

for (const treatmentCase of treatmentCases) {
  test(`completes all shared questions and the ${treatmentCase.slug} treatment question`, async ({
    page,
  }) => {
    await setTreatmentConfig(page, treatmentCase.slug);

    await page.goto("/");
    await startAssessment(page);

    await completeSharedQuestions(page);

    await expectQuestion(page, treatmentCase.question);
    await chooseOption(page, treatmentCase.answer);
    await clickContinue(page);

    await expectQuestion(page, "How did you hear about Primed?");
    await chooseOption(page, GOOGLE_BING_TEXT);

    await completeConsentAndSubmit(page);
  });
}
