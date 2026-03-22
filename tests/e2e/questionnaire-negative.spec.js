import { expect, test } from "@playwright/test";
import {
  chooseOption,
  expectQuestion,
  startAssessment,
  setTreatmentConfig,
  YES_TEXT,
} from "./helpers/questionnaire";

test.beforeEach(async ({ page }) => {
  await setTreatmentConfig(page, "weight-loss", 2);
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

  await expectQuestion(page, "What is your date of birth?");
  await page.locator('input[type="date"]').fill("1990-01-01");
  await page.getByRole("button", { name: "Continue", exact: true }).click();

  await expectQuestion(page, "What is your height (in cm)?");
  await page.getByRole("textbox").fill("170");
  await page.getByRole("button", { name: "Continue", exact: true }).click();

  await expectQuestion(page, "What is your weight (in kg)?");
  await page.getByRole("textbox").fill("70");
  await page.getByRole("button", { name: "Continue", exact: true }).click();

  await expectQuestion(page, "Do you currently smoke or vape?");
  await chooseOption(page, "No");

  await expectQuestion(page, "Do you drink alcohol?");
  await chooseOption(page, "No");

  await expectQuestion(page, "How often do you exercise?");
  await chooseOption(page, "Daily");

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
