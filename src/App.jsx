import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./assets/styles.css";
import { Routes, Route } from "react-router-dom";
import SurveyQuestions from "./components/SurveyQuestions";
import TreatmentSelection from "./pages/TreatmentSelection";
import Questionnaire from "./pages/Questionnaire";

function App() {
  return (
    <Routes>
      <Route
        path="/questionnaire"
        element={<TreatmentSelection />}
      />
      <Route
        path="/questionnaire/:treatmentName/:id"
        element={<Questionnaire />}
      />
      <Route
        path="/questionnaire/:treatmentName/:id/start-quiz"
        element={<SurveyQuestions />}
      />
    </Routes>
  );
}

export default App;
