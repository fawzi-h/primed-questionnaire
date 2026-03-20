import { expect, test } from "@playwright/test";
import {
  chooseOption,
  expectQuestion,
  startAssessment,
  setTreatmentConfig,
  YES_TEXT,
} from "./helpers/questionnaire";

test.beforeEach(async ({ page }) => {
  await setTreatmentConfig(page, "weight-loss");
  await page.goto("/");
  await startAssessment(page);
});

test("stops the questionnaire for under-18 users", async ({ page }) => {
  await expectQuestion(page, "Are you over 18 years of age?");
  await chooseOption(page, "No");

  await expect(
    page.getByRole("heading", { name: "We're Unable to Proceed", exact: true }),
  ).toBeVisible();
  await expect(page.getByText(/18 years of age or older/i)).toBeVisible();
});

test("stops the questionnaire for pregnancy eligibility", async ({ page }) => {
  await expectQuestion(page, "Are you over 18 years of age?");
  await chooseOption(page, YES_TEXT);

  await expectQuestion(page, "What was your sex at birth?");
  await chooseOption(page, "Female");

  await expectQuestion(
    page,
    "Are you currently pregnant or breastfeeding, or trying to fall pregnant?",
  );
  await chooseOption(page, "Yes");

  await expect(
    page.getByRole("heading", {
      name: /primed clinic is not the right fit for you at this time/i,
    }),
  ).toBeVisible();
  await expect(page.getByText(/planning to become pregnant/i)).toBeVisible();
});
