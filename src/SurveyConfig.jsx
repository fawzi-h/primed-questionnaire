import React, { createContext, useContext } from "react";

const defaults = {
  submitBtnClass: "",
  saveBtnClass: "",
  backBtnClass: "",
  navBtnClass: "",
  inputClass: "",
  labelClass: "",
  questionFont: "",
  answerFont: "",
  medicareCardImageUrl: "https://cdn.prod.website-files.com/6981710e75497676ffbaf22b/69a48f47624b07619d0f3dfd_medicare-irn.png",
  dashboardUrl: "",
  treatmentLabelClass: "",
  treatmentImages: {},
  treatments: null,
};

const SurveyConfigContext = createContext(defaults);

export const SurveyConfigProvider = ({ config, children }) => (
  <SurveyConfigContext.Provider value={{ ...defaults, ...config }}>
    {children}
  </SurveyConfigContext.Provider>
);

export const useSurveyConfig = () => useContext(SurveyConfigContext);
