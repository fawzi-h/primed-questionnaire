import React from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useSurveyConfig } from "../SurveyConfig";

const DEBUG = false;

const debug = (...args) => {
  if (DEBUG) {
    console.log("[PrimedSurvey]", ...args);
  }
};

const Questionnaire = ({ onStartQuiz }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { treatmentName, id } = useParams();
  const { submitBtnClass } = useSurveyConfig();

  const handleStart = () => {
    if (onStartQuiz) {
      onStartQuiz();
    }

    if (!treatmentName || !id) {
      debug("Missing treatment route params, cannot navigate");
      return;
    }

    navigate(
      `/questionnaire/${encodeURIComponent(
        treatmentName,
      )}/${encodeURIComponent(id)}/start-quiz${location.search}`,
    );
  };

  return (
    <div className="questionnaire-wrapper">
      <div className="container">
        <div className="questionnaire-container">
          <div className="questionnaire-card">
            <div className="card-body">
              <h2 className="questionnaire-title questionnaire-screen-title">
                Welcome To Your Assessment
              </h2>

              <p className="questionnaire-description">
                This assessment takes approximately 3-5 minutes to complete.
                Your answers help our practitioners provide you with the most
                suitable treatment plan.
              </p>

              <p className="questionnaire-notice">
                Please answer all questions honestly. Your responses are kept
                strictly confidential and will only be shared with your treating
                practitioner.
              </p>

              <p className="questionnaire-notice">
                By proceeding, you confirm that you are 18 years of age or older
                and agree to Primed Clinic&apos;s Terms &amp; Conditions and
                Privacy Policy.
              </p>

              <button
                onClick={handleStart}
                className={`questionnaire-startBtn${
                  submitBtnClass ? ` ${submitBtnClass}` : ""
                }`}
              >
                Start Assessment
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Questionnaire;
