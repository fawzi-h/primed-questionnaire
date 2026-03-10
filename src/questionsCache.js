import api from "./Api/AuthApi.jsx";

/**
 * Apply all front-end customisations to the questions returned by the API.
 * This ensures the widget behaviour is consistent regardless of backend state.
 */
function applyCustomisations(questions) {
  // Trim whitespace from all question keys (fixes e.g. " smoke-or-vape")
  questions.forEach(q => { q.key = (q.key || "").trim(); });

  // Reorder questions: swap referral_source and treatment_goal_question
  const referralIndex = questions.findIndex(q => q.key === "referral_source");
  const treatmentIndex = questions.findIndex(q => q.key === "treatment_goal_question");
  if (referralIndex !== -1 && treatmentIndex !== -1 && referralIndex < treatmentIndex) {
    // Swap the positions
    [questions[referralIndex], questions[treatmentIndex]] = [questions[treatmentIndex], questions[referralIndex]];
  }

  return questions
    // Per-question transforms
    .map((q) => {
      // has_family_history: fix /s notation → (s)
      if (q.key === "has_family_history" && typeof q.question === "string") {
        return {
          ...q,
          question: q.question
            .replace(/condition\/s/g, "condition(s)")
            .replace(/disorder\/s/g,  "disorder(s)"),
        };
      }
      return q;
    });
}

// Module-level promise — guaranteed to run at most once per page load.
// A failed promise stays cached (no retry) to prevent infinite fetch loops.
let promise = null;

export function fetchQuestionsOnce() {
  if (!promise) {
    promise = api
      .get("/api/initial-questionnaire")
      .then((res) => {
        if (Array.isArray(res.data)) return applyCustomisations(res.data);
        throw new Error("Unexpected questions response");
      })
      .catch((err) => {
        promise = null;
        throw err;
      });
  }
  return promise;
}
