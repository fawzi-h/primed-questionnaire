import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SurveyQuestions from "../../src/components/SurveyQuestions";
import { SurveyConfigProvider } from "../../src/SurveyConfig";
import { fetchQuestionsOnce } from "../../src/questionsCache";

vi.mock("../../src/questionsCache", () => ({
  fetchQuestionsOnce: vi.fn(),
}));

const mockQuestions = [
  {
    id: 1,
    key: "medicare_number",
    question: "What are your Medicare details?",
    type: "input",
    choices: null,
    placeholder: "Enter Medicare Number",
    checkbox: true,
    image: false,
  },
  {
    id: 2,
    key: "medicare_expiry",
    question: "What is the expiry?",
    type: null,
    choices: null,
    placeholder: "MM/YYYY",
    checkbox: false,
    image: false,
  },
  {
    id: 3,
    key: "individual_reference_number",
    question: "What is your Individual Reference Number?",
    type: "input",
    choices: null,
    placeholder: "Enter IRN",
    checkbox: false,
    image: false,
  },
  {
    id: 4,
    key: "referral_source",
    question: "How did you hear about Primed?",
    type: "MCQs",
    choices: ["Google/Bing", "Other"],
    placeholder: null,
    checkbox: false,
    image: false,
  },
  {
    id: 5,
    key: "consent_provided",
    question: "Before we submit, please confirm the following:",
    type: "multi_select",
    choices: ["Consent"],
    placeholder: null,
    checkbox: false,
    image: false,
  },
];

describe("SurveyQuestions", () => {
  function renderSurvey(questions = mockQuestions) {
    vi.mocked(fetchQuestionsOnce).mockResolvedValue(questions);

    return render(
      <SurveyConfigProvider config={{ medicareCardImageUrl: "", dashboardUrl: "" }}>
        <MemoryRouter
          initialEntries={["/questionnaire/weight-loss/1/start-quiz"]}
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <Routes>
            <Route
              path="/questionnaire/:treatmentName/:id/start-quiz"
              element={<SurveyQuestions />}
            />
          </Routes>
        </MemoryRouter>
      </SurveyConfigProvider>,
    );
  }

  beforeEach(() => {
    sessionStorage.clear();
  });

  it("shows the Medicare warning when details are deferred", async () => {
    const user = userEvent.setup();

    renderSurvey();

    await screen.findByRole("heading", {
      name: /what are your medicare details\?/i,
    });

    await user.click(
      screen.getByLabelText(/i'll have these ready for the consultation\./i),
    );

    expect(
      screen.getByText(
        /medicare details or ihi are required to enable our doctors to prescribe a treatment/i,
      ),
    ).toBeInTheDocument();
  });

  it("keeps Continue disabled until Medicare details are complete", async () => {
    renderSurvey();

    await screen.findByRole("heading", {
      name: /what are your medicare details\?/i,
    });

    expect(
      screen.getByRole("button", { name: "Continue", exact: true }),
    ).toBeDisabled();
  });

  it("shows a Medicare length error when the number is too long", async () => {
    const user = userEvent.setup();

    renderSurvey();

    await screen.findByRole("heading", {
      name: /what are your medicare details\?/i,
    });

    await user.type(
      screen.getByPlaceholderText("Enter Medicare Number"),
      "12345678901",
    );

    expect(
      screen.getByText("Medicare number should not exceed 10 digits"),
    ).toBeInTheDocument();
  });

  it('limits "Other" inputs to 255 characters and shows a hint at the limit', async () => {
    const user = userEvent.setup();
    const otherQuestions = [
      {
        id: 1,
        key: "referral_source",
        question: "How did you hear about Primed?",
        type: "MCQs",
        choices: ["Google/Bing", "Other"],
        placeholder: null,
        checkbox: false,
        image: false,
      },
      {
        id: 2,
        key: "consent_provided",
        question: "Before we submit, please confirm the following:",
        type: "multi_select",
        choices: ["Consent"],
        placeholder: null,
        checkbox: false,
        image: false,
      },
    ];

    renderSurvey(otherQuestions);

    await screen.findByRole("heading", {
      name: /how did you hear about primed\?/i,
    });

    await user.click(screen.getByRole("button", { name: "Other", exact: true }));

    const otherInput = screen.getByPlaceholderText("Please specify…");
    expect(otherInput).toHaveAttribute("maxLength", "255");

    await user.type(otherInput, "a".repeat(300));

    expect(otherInput).toHaveValue("a".repeat(255));
    expect(screen.getByText("Max 255 characters")).toBeInTheDocument();
  }, 10000);

  it("keeps textarea questions capped at 1000 characters", async () => {
    const textareaQuestions = [
      {
        id: 1,
        key: "family_history_details",
        question: "Please explain the medical illness that has run within your family.",
        type: "Textarea",
        choices: null,
        placeholder: "Explain Here",
        checkbox: false,
        image: false,
      },
      {
        id: 2,
        key: "consent_provided",
        question: "Before we submit, please confirm the following:",
        type: "multi_select",
        choices: ["Consent"],
        placeholder: null,
        checkbox: false,
        image: false,
      },
    ];

    renderSurvey(textareaQuestions);

    await screen.findByRole("heading", {
      name: /please explain the medical illness that has run within your family\./i,
    });

    expect(screen.getByRole("textbox")).toHaveAttribute("maxLength", "1000");
  });
});
