import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSurveyConfig } from "../SurveyConfig";

const Questionnaire = ({ onStartQuiz }) => {
  const navigate = useNavigate();
  const { treatmentName, id } = useParams();
  const { submitBtnClass } = useSurveyConfig();

  console.log("[PrimedSurvey] Questionnaire rendered — treatmentName:", treatmentName, "| id:", id);

  const handleStart = () => {
    if (onStartQuiz) onStartQuiz();
    navigate(`/questionnaire/${treatmentName}/${id}/start-quiz`);
  };

  return (
    <div className="questionnaire-wrapper">
      <div className="container">
        <div className="questionnaire-container">
          <div className="questionnaire-card">
            <div className="card-body">
              <h3 className="questionnaire-title">Welcome To Your Assessment</h3>
              <p className="questionnaire-description">
                This assessment takes approximately 10 minutes to complete. Your answers help our
                practitioners provide you with the most suitable treatment plan.
              </p>
              <p className="questionnaire-notice">
                Please answer all questions honestly. Your responses are kept strictly confidential
                and will only be shared with your treating practitioner.
              </p>
              <p className="questionnaire-notice">
                By proceeding, you confirm that you are 18 years of age or older and agree to
                Primed Clinic's Terms &amp; Conditions and Privacy Policy.
              </p>
              <button
                onClick={handleStart}
                className={`questionairre-startBtn${submitBtnClass ? ` ${submitBtnClass}` : ""}`}
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
