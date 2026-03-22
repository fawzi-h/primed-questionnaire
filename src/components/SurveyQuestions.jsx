import React, { useState, useRef, useEffect, useCallback } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { sanitizeInput } from "../Auth/Sanitizer";
import api from "../Api/AuthApi";
import { fetchQuestionsOnce } from "../questionsCache";
import { useSurveyConfig } from "../SurveyConfig";
import { X } from "lucide-react";
import getBaseUrl from "../Api/BaseUrl";
import { validateRedirectUrl, validateImageUrl } from "../utils/validation";
import { TREATMENT_QUESTION_MAP } from "../data/treatmentQuestions";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format } from "date-fns";
import "./SurveyQuestions.css";

const LOCAL_STORAGE_KEY = "primed_survey";
const OTHER_TEXT_MAX_LENGTH = 255;
const TREATMENT_QUESTION_KEYS = [
  "anti-ageing-vitality",
  "cognitive-health-performance",
  "gut-health-immunity",
  "injury-repair-recovery",
  "muscle-strength-building",
  "sexual-health",
  "skin-care",
  "weight-loss-weight-management",
  "womens-health",
];

const DEBUG = false;
const DEBUG_PREFIX = "[SurveyQuestions]";

const debug = (...args) => {
  if (DEBUG) console.log(DEBUG_PREFIX, ...args);
};

const debugError = (...args) => {
  if (DEBUG) console.error(DEBUG_PREFIX, ...args);
};

const BackArrow = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12.5 15L7.5 10L12.5 5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CheckIcon = ({ size = 10 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 10 10"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M1.5 5.5L4 8L8.5 2"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const SurveyQuestions = () => {
  const { id, treatmentName } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [surveyLoading, setSurveyLoading] = useState(false);
  const [answers, setAnswers] = useState({});
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);

  const [showAlert, setShowAlert] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [formSubmitted] = useState(true);
  const [surveySubmitted, setSurveySubmitted] = useState(false);
  const [surveySaved, setSurveySaved] = useState(false);
  const [medicareCheckbox, setMedicareCheckbox] = useState(false);
  const [showConsentStep, setShowConsentStep] = useState(false);
  const [showUnderAgeMessage, setShowUnderAgeMessage] = useState(false);
  const [consentChecked, setConsentChecked] = useState([]);
  const [errors, setErrors] = useState({});
  const [isVisible, setIsVisible] = useState(false);
  const [otherTexts, setOtherTexts] = useState({});
  const [choiceFocusIndex, setChoiceFocusIndex] = useState({});
  const [resolvedTreatment, setResolvedTreatment] = useState({
    treatmentName: "",
    treatmentId: "",
    hasTreatment: false,
  });

  const [userId] = useState(() => {
    const sessionData = sessionStorage.getItem("sessionData");
    debug("init userId", {
      sessionDataRaw: sessionData,
      sessionUserId: sessionStorage.getItem("userId"),
    });

    if (sessionData) {
      try {
        const parsed = JSON.parse(sessionData);
        if (parsed.userId) return String(parsed.userId);
      } catch (error) {
        debugError("init userId parse error", error);
      }
    }

    return sessionStorage.getItem("userId") || null;
  });

  const [token, setToken] = useState(null);
  const [animKey, setAnimKey] = useState(0);
  const autoAdvanceRef = useRef(false);
  const questionContainerRef = useRef(null);
  const primaryFocusRef = useRef(null);
  const continueButtonRef = useRef(null);
  const backButtonRef = useRef(null);

  const setPrimaryFocus = useCallback((node) => {
    primaryFocusRef.current = node;
  }, []);

  const focusCurrentStep = useCallback(() => {
    window.requestAnimationFrame(() => {
      const preferredTarget =
        primaryFocusRef.current ||
        questionContainerRef.current?.querySelector(
          "input:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]",
        ) ||
        questionContainerRef.current;

      if (!preferredTarget || typeof preferredTarget.focus !== "function") {
        return;
      }

      preferredTarget.focus({ preventScroll: true });

      if (
        (preferredTarget instanceof HTMLInputElement ||
          preferredTarget instanceof HTMLTextAreaElement) &&
        typeof preferredTarget.select === "function" &&
        preferredTarget.type !== "date"
      ) {
        preferredTarget.select();
      }
    });
  }, []);
  const formatDateInputValue = (date) => {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, "0");
    const day = `${date.getDate()}`.padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const getAdultDobMaxDate = useCallback(() => {
    const cutoff = new Date();
    cutoff.setFullYear(cutoff.getFullYear() - 18);
    return formatDateInputValue(cutoff);
  }, []);

  const isAdultDob = useCallback((value) => {
    if (!value) return false;

    const [year, month, day] = value.split("-").map(Number);
    if (!year || !month || !day) return false;

    const selectedDate = new Date(year, month - 1, day);
    if (Number.isNaN(selectedDate.getTime())) return false;

    return value <= getAdultDobMaxDate();
  }, [getAdultDobMaxDate]);

  const scrollViewportToTop = () => {
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    });
  };

  const { medicareCardImageUrl, dashboardUrl } = useSurveyConfig();

  const clearSurveySession = useCallback((currentToken = token) => {
    sessionStorage.removeItem("treatmentName");
    sessionStorage.removeItem("treatmentId");
    sessionStorage.removeItem(LOCAL_STORAGE_KEY);
    if (currentToken) {
      sessionStorage.removeItem(`${LOCAL_STORAGE_KEY}_${currentToken}`);
    }
  }, [token]);

  const showPopup = () => setIsVisible(true);
  const hidePopup = () => setIsVisible(false);

  const getResolvedTreatment = useCallback(() => {
    const params = new URLSearchParams(location.search);

    const queryTreatmentName = params.get("treatmentName") || "";
    const queryTreatmentId = params.get("treatmentId") || "";

    const sessionTreatmentName = sessionStorage.getItem("treatmentName") || "";

    const sessionTreatmentId = sessionStorage.getItem("treatmentId") || "";

    const resolvedTreatmentName =
      queryTreatmentName || treatmentName || sessionTreatmentName || "";

    const resolvedTreatmentId =
      queryTreatmentId || id || sessionTreatmentId || "";

    const result = {
      treatmentName: resolvedTreatmentName,
      treatmentId: resolvedTreatmentId,
      hasTreatment: Boolean(resolvedTreatmentName && resolvedTreatmentId),
    };

    debug("getResolvedTreatment()", {
      locationSearch: location.search,
      routeId: id,
      routeTreatmentName: treatmentName,
      queryTreatmentName,
      queryTreatmentId,
      sessionTreatmentName,
      sessionTreatmentId,
      result,
    });

    return result;
  }, [location.search, treatmentName, id]);

  const generateToken = () => {
    const generated = crypto.randomUUID();
    debug("generateToken()", generated);
    return generated;
  };

  useEffect(() => {
    debug("mount");
    debug("env", {
      LOCAL_STORAGE_KEY,
      pathname: location.pathname,
      search: location.search,
      href: window.location.href,
      routeId: id,
      routeTreatmentName: treatmentName,
    });

    debug("sessionStorage snapshot on mount", {
      treatmentName: sessionStorage.getItem("treatmentName"),
      treatmentId: sessionStorage.getItem("treatmentId"),
      sessionData: sessionStorage.getItem("sessionData"),
      userId: sessionStorage.getItem("userId"),
    });

    return () => {
      debug("unmount");
    };
  }, [id, location.pathname, location.search, treatmentName]);

  useEffect(() => {
    debug("route changed", {
      pathname: location.pathname,
      search: location.search,
      id,
      treatmentName,
    });
  }, [location.pathname, location.search, id, treatmentName]);

  useEffect(() => {
    debug("state changed", {
      token,
      currentQuestion,
      questionsLength: questions.length,
      showConsentStep,
      surveySubmitted,
      surveySaved,
      showAlert,
      showUnderAgeMessage,
      resolvedTreatment,
    });
  }, [
    token,
    currentQuestion,
    questions.length,
    showConsentStep,
    surveySubmitted,
    surveySaved,
    showAlert,
    showUnderAgeMessage,
    resolvedTreatment,
  ]);

  useEffect(() => {
    debug("current question object", {
      currentQuestion,
      currentQuestionKey: questions[currentQuestion]?.key,
      currentQuestionQuestion: questions[currentQuestion]?.question,
      currentQuestionExists: Boolean(questions[currentQuestion]),
    });
  }, [currentQuestion, questions]);

  useEffect(() => {
    debug("answers changed", {
      keysCount: Object.keys(answers).length,
      sampleKeys: Object.keys(answers).slice(0, 10),
    });
  }, [answers]);

  useEffect(() => {
    debug("consent step changed", {
      showConsentStep,
      consentChecked,
    });
  }, [showConsentStep, consentChecked]);

  useEffect(() => {
    if (questions.length > 0) {
      debug(
        "questions keys",
        questions.map((q, index) => ({
          index,
          key: q.key,
          type: q.type,
          question: q.question,
        })),
      );
    }
  }, [questions]);

  useEffect(() => {
    debug("resolve treatment effect:start");
    const resolved = getResolvedTreatment();

    setResolvedTreatment(resolved);
    debug("resolve treatment effect:setResolvedTreatment", resolved);

    if (resolved.treatmentName) {
      sessionStorage.setItem("treatmentName", resolved.treatmentName);
    }

    if (resolved.treatmentId) {
      sessionStorage.setItem("treatmentId", resolved.treatmentId);
    }

    debug("resolve treatment effect:end", {
      treatmentName: sessionStorage.getItem("treatmentName"),
      treatmentId: sessionStorage.getItem("treatmentId"),
    });
  }, [getResolvedTreatment]);

  useEffect(() => {
    let isMounted = true;
    debug("fetchQuestionsOnce effect:start", { formSubmitted });

    fetchQuestionsOnce()
      .then((data) => {
        debug("fetchQuestionsOnce success", {
          isMounted,
          count: Array.isArray(data) ? data.length : "not-array",
        });

        if (!isMounted) return;

        setQuestions(data);

        setAnswers((prev) => {
          if (Object.keys(prev).length > 0) return prev;

          const seeded = data.reduce((acc, q) => {
            acc[q.key] = "";
            return acc;
          }, {});

          return seeded;
        });
      })
      .catch((error) => {
        debugError("fetchQuestionsOnce error", error);
      });

    return () => {
      isMounted = false;
      debug("fetchQuestionsOnce cleanup");
    };
  }, [formSubmitted]);

  useEffect(() => {
    if (!token) {
      debug("persist progress skipped because token is not set");
      return;
    }

    const key = `${LOCAL_STORAGE_KEY}_${token}`;
    const payload = {
      answers,
      currentQuestion,
      timestamp: Date.now(),
    };

    sessionStorage.setItem(key, JSON.stringify(payload));
    debug("persisted progress", {
      key,
      currentQuestion,
      answersKeys: Object.keys(answers).length,
    });
  }, [token, answers, currentQuestion]);

  const isQuestionVisible = useCallback((index, ans = answers) => {
    if (!questions[index]) return true;

    const key = questions[index].key;

    if (key === "pregnancy_status" && ans.sex_at_birth === "Male") return false;
    if (key === "family_history_details" && ans.has_family_history !== "Yes")
      return false;
    if (key === "allergies_details" && ans.has_allergies !== "Yes")
      return false;
    if (key === "additional_info_details" && ans.has_additional_info !== "Yes")
      return false;
    if (
      key === "taken_peptides_hormone_therapy" &&
      ans.has_taken_peptides_hormone_therapy !== "Yes"
    )
      return false;
    if (key === "medicare_expiry" || key === "individual_reference_number")
      return false;
    if (key === "consent_provided") return false;

    if (TREATMENT_QUESTION_KEYS.includes(key)) {
      const slug =
        resolvedTreatment.treatmentName ||
        treatmentName ||
        sessionStorage.getItem("treatmentName") ||
        "";

      const expectedKey = TREATMENT_QUESTION_MAP[slug];
      if (key !== expectedKey) return false;
    }

    return true;
  }, [answers, questions, resolvedTreatment.treatmentName, treatmentName]);

  // Returns the visible question indices reordered so the treatment-specific
  // question always appears immediately before "referral_source", which is
  // always last among the regular questions (consent is the final step).
  const getOrderedVisible = (ans = answers) => {
    const raw = questions
      .map((_, i) => i)
      .filter((i) => isQuestionVisible(i, ans));
    const treatmentQs = raw.filter((i) =>
      TREATMENT_QUESTION_KEYS.includes(questions[i]?.key),
    );
    const referralIdx = raw.find((i) => questions[i]?.key === "referral_source");
    const others = raw.filter(
      (i) =>
        !TREATMENT_QUESTION_KEYS.includes(questions[i]?.key) &&
        questions[i]?.key !== "referral_source",
    );
    return [
      ...others,
      ...treatmentQs,
      ...(referralIdx !== undefined ? [referralIdx] : []),
    ];
  };

  useEffect(() => {
    if (questions.length > 0) {
      const visibleIndices = questions
        .map((_, i) => i)
        .filter((i) => isQuestionVisible(i));

      debug("visible question indices recalculated", {
        currentQuestion,
        visibleIndices,
        visibleKeys: visibleIndices.map((i) => questions[i]?.key),
      });
    }
  }, [questions, currentQuestion, isQuestionVisible]);

  useEffect(() => {
    debug("token/restore effect:start", {
      locationPathname: location.pathname,
      locationSearch: location.search,
      questionsLength: questions.length,
    });

    const params = new URLSearchParams(location.search);
    let currentToken = params.get("token");

    if (!currentToken) {
      currentToken = generateToken();
      const nextParams = new URLSearchParams(location.search);
      nextParams.set("token", currentToken);

      navigate(`${location.pathname}?${nextParams.toString()}`, {
        replace: true,
      });
    }

    setToken(currentToken);

    const savedKey = `${LOCAL_STORAGE_KEY}_${currentToken}`;
    const savedData = sessionStorage.getItem(savedKey);

    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        const { answers: savedAnswers, currentQuestion: savedCurrentQuestion } =
          parsedData;

        setAnswers((prevAnswers) => ({
          ...prevAnswers,
          ...savedAnswers,
        }));

        const nextQuestion =
          typeof savedCurrentQuestion === "number"
            ? Math.max(savedCurrentQuestion, 0)
            : 0;

        setCurrentQuestion(nextQuestion);
      } catch (error) {
        debugError("token/restore effect:JSON parse error", error);
      }
    } else {
      setCurrentQuestion(0);
    }

    debug("token/restore effect:end");
  }, [location.search, location.pathname, navigate, questions.length]);

  useEffect(() => {
    const prefix = `${LOCAL_STORAGE_KEY}_`;

    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith(prefix)) {
        try {
          const raw = sessionStorage.getItem(key);
          const { timestamp } = JSON.parse(raw);
          const age = Date.now() - timestamp;

          if (age > 86400000) {
            sessionStorage.removeItem(key);
          }
        } catch (error) {
          debugError("stale cleanup:removing invalid key", { key, error });
          sessionStorage.removeItem(key);
        }
      }
    }
  }, []);

  useEffect(() => {
    return () => {
      debug("cleanup removing sessionData on location effect cleanup");
      sessionStorage.removeItem("sessionData");
    };
  }, [location]);

  useEffect(() => {
    if (!surveySubmitted) return;

    const fallback = `${getBaseUrl()}/patient`;
    const target = validateRedirectUrl(dashboardUrl, getBaseUrl()) || fallback;

    const timer = setTimeout(() => {
      window.location.href = target;
    }, 5000);

    return () => clearTimeout(timer);
  }, [surveySubmitted, dashboardUrl]);

  useEffect(() => {
    if (!showAlert && !showUnderAgeMessage) return;
    clearSurveySession(token);
  }, [showAlert, showUnderAgeMessage, token, clearSurveySession]);

  useEffect(() => {
    autoAdvanceRef.current = true;
    debug("autoAdvance enabled");
  }, []);

  useEffect(() => {
    scrollViewportToTop();
  }, [currentQuestion, showConsentStep]);

  useEffect(() => {
    focusCurrentStep();
  }, [animKey, currentQuestion, focusCurrentStep, medicareCheckbox, showConsentStep]);

  const isQuestionAnswered = useCallback((index) => {
    if (!questions[index]) return false;

    const question = questions[index];
    const answer = answers[question.key];

    if (question.key === "medicare_number") {
      if (medicareCheckbox) return true;

      const expQ = questions.find((q) => q.key === "medicare_expiry");
      const irnQ = questions.find(
        (q) => q.key === "individual_reference_number",
      );
      const a1 = answers.medicare_number;
      const a2 = expQ ? answers[expQ.key] : null;
      const a3 = irnQ ? answers[irnQ.key] : null;

      return (
        a1 !== undefined &&
        a1 !== "" &&
        a2 instanceof Date &&
        !isNaN(a2) &&
        a3 !== undefined &&
        a3 !== ""
      );
    }

    if (question.key === "height") {
      return (
        answer !== undefined &&
        answer !== "" &&
        parseFloat(answer) >= 50 &&
        parseFloat(answer) <= 251
      );
    }

    if (question.key === "weight") {
      return (
        answer !== undefined &&
        answer !== "" &&
        parseFloat(answer) >= 40 &&
        parseFloat(answer) <= 300
      );
    }

    if (question.type === "multi_select") {
      if (!Array.isArray(answer) || answer.length === 0) return false;
      if (answer.length === 1 && answer[0] === "Other") {
        return !!otherTexts[question.key];
      }
      return true;
    }

    if (question.type === "date_input") {
      return isAdultDob(answer);
    }

    return answer !== undefined && answer !== "";
  }, [answers, isAdultDob, medicareCheckbox, otherTexts, questions]);

  const goTo = useCallback((nextIndex) => {
    setCurrentQuestion(nextIndex);
    setAnimKey((k) => k + 1);
  }, []);

  const visibleIndices = getOrderedVisible();

  const currentVisibleIndex = visibleIndices.indexOf(currentQuestion);
  const totalVisible = visibleIndices.length;
  const currentQ = questions[currentQuestion];
  const answered = isQuestionAnswered(currentQuestion);

  const currentSection = currentQ?.section;
  const prevVisibleIdx =
    currentVisibleIndex > 0 ? visibleIndices[currentVisibleIndex - 1] : -1;
  const prevSection =
    prevVisibleIdx >= 0 ? questions[prevVisibleIdx]?.section : null;
  const showSectionBadge = currentSection && currentSection !== prevSection;

  const consentQuestion = questions.find((q) => q.key === "consent_provided");
  const consentStatements = consentQuestion?.choices || [];
  const allConsentChecked =
    consentChecked.length === consentStatements.length &&
    consentChecked.every(Boolean);

  const buildPayload = useCallback((data, isCompleted) => {
    const payload = {};

    questions.forEach((q) => {
      const key = q.key;
      const val = data[key];

      if (q.type === "multi_select" && Array.isArray(val)) {
        payload[key] = val.join(", ");
      } else if (key === "medicare_expiry" && val instanceof Date) {
        payload[key] = format(val, "yyyy-MM");
      } else {
        payload[key] = val || "";
      }
    });

    payload.treatment_id = resolvedTreatment.treatmentId || id;
    payload.is_completed = isCompleted;
    payload.user_id = userId;
    payload.ihi_number = data.ihi_number || "";

    return payload;
  }, [id, questions, resolvedTreatment.treatmentId, userId]);

  // Autosave on continue is currently disabled.
  // const saveProgressOnAdvance = useCallback(async (dataOverride) => {
  //   try {
  //     const data = dataOverride || answers;
  //     const payload = buildPayload(data, false);
  //     await api.post("/api/register/complete", payload);
  //   } catch (error) {
  //     const detail =
  //       error.response?.data?.detail || error.response?.data || error.message;
  //     debugError("saveProgressOnAdvance:error", detail);
  //   }
  // }, [answers, buildPayload]);

  const handleNext = useCallback(() => {
    debug("handleNext:start", {
      currentQuestion,
      currentKey: questions[currentQuestion]?.key,
      currentAnswered: isQuestionAnswered(currentQuestion),
    });

    if (
      questions[currentQuestion]?.key === "medicare_number" &&
      !medicareCheckbox
    ) {
      const a1 = (answers.medicare_number || "").trim();
      const a3 = (answers.individual_reference_number || "").trim();
      let hasError = false;

      if (!a1) {
        setErrors((p) => ({
          ...p,
          medicare_number: "Medicare number is required",
        }));
        hasError = true;
      } else if (!/^\d{10}$/.test(a1)) {
        setErrors((p) => ({
          ...p,
          medicare_number: "Medicare number must be 10 digits",
        }));
        hasError = true;
      }

      if (!a3) {
        setErrors((p) => ({
          ...p,
          individual_reference_number:
            "Individual Reference Number is required",
        }));
        hasError = true;
      }

      if (hasError) return;
    }

    const nextVisibleIdx = currentVisibleIndex + 1;
    // Autosave on continue is currently disabled.
    // void saveProgressOnAdvance();
    if (nextVisibleIdx < visibleIndices.length) {
      goTo(visibleIndices[nextVisibleIdx]);
    } else {
      setShowConsentStep(true);
    }
  }, [
    answers.individual_reference_number,
    answers.medicare_number,
    currentQuestion,
    currentVisibleIndex,
    goTo,
    isQuestionAnswered,
    medicareCheckbox,
    questions,
    visibleIndices,
  ]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "Enter" || showConsentStep) return;
      const q = questions[currentQuestion];
      if (!q) return;
      if (q.type === "MCQs" && q.choices && q.choices.length <= 3) return;

      if (isQuestionAnswered(currentQuestion)) handleNext();
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showConsentStep, questions, currentQuestion, isQuestionAnswered, handleNext]);

  const validateNumberInput = (value, fieldName) => {
    const errorKey =
      fieldName === "medicare" ? "medicare_number" : fieldName;

    if (isNaN(value)) {
      setErrors((prev) => ({
        ...prev,
        [errorKey]: "Please enter only a number",
      }));
      return false;
    }

    if (fieldName === "medicare" && value.length > 10) {
      setErrors((prev) => ({
        ...prev,
        [errorKey]: "Medicare number should not exceed 10 digits",
      }));
      return false;
    }

    setErrors((prev) => ({ ...prev, [errorKey]: null }));
    return true;
  };

  const handleAnswer = (key, answer) => {
    debug("handleAnswer", { key, answer });
    setAnswers((prev) => ({ ...prev, [key]: answer }));
  };

  const handleSubmit = useCallback(async () => {
    setSurveyLoading(true);
    try {
      await api.post("/api/register/complete", buildPayload(answers, true));
      const searchParams = new URLSearchParams(location.search);
      searchParams.set("quiz_status", "done");
      setSurveySubmitted(true);
      navigate(`${location.pathname}?${searchParams.toString()}`);
      clearSurveySession(token);
    } catch (error) {
      const detail =
        error.response?.data?.detail || error.response?.data || error.message;
      debugError("handleSubmit:error", detail);
      setSubmitError(
        typeof detail === "string" ? detail : JSON.stringify(detail),
      );
    } finally {
      setSurveyLoading(false);
    }
  }, [
    answers,
    buildPayload,
    clearSurveySession,
    location.pathname,
    location.search,
    navigate,
    token,
  ]);

  const handleSave = useCallback(async () => {
    setSurveyLoading(true);
    try {
      await api.post("/api/register/complete", buildPayload(answers, false));
      const searchParams = new URLSearchParams(location.search);
      setSurveySaved(true);
      searchParams.set("quiz_status", "saved");
      navigate(`${location.pathname}?${searchParams.toString()}`);
      clearSurveySession(token);
    } catch (error) {
      const detail =
        error.response?.data?.detail || error.response?.data || error.message;
      debugError("handleSave:error", detail);
    } finally {
      setSurveyLoading(false);
    }
  }, [
    answers,
    buildPayload,
    clearSurveySession,
    location.pathname,
    location.search,
    navigate,
    token,
  ]);

  const handleContinue = () => hidePopup();

  const sendStoppedQuestionnaireData = async (overrideAnswers) => {
    const data = overrideAnswers || answers;
    try {
      await api.post("/api/register/complete", buildPayload(data, false));
    } catch (error) {
      const detail =
        error.response?.data?.detail || error.response?.data || error.message;
      debugError("sendStoppedQuestionnaireData:error", detail);
    }
  };

  useEffect(() => {
    if (!showConsentStep) return;

    const onConsentEnter = (e) => {
      if (e.key !== "Enter") return;
      if (!allConsentChecked || surveyLoading) return;

      const tagName = e.target?.tagName;
      if (tagName === "TEXTAREA" || tagName === "INPUT") return;

      e.preventDefault();
      handleSubmit();
    };

    window.addEventListener("keydown", onConsentEnter);
    return () => window.removeEventListener("keydown", onConsentEnter);
  }, [allConsentChecked, handleSubmit, showConsentStep, surveyLoading]);

  const handlePrevious = () => {
    const prevVisibleIdx = currentVisibleIndex - 1;
    if (prevVisibleIdx >= 0) goTo(visibleIndices[prevVisibleIdx]);
  };

  const handleFooterKeyDown = useCallback((event, buttonType) => {
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) {
      return;
    }

    const isBackAvailable = !showConsentStep && currentVisibleIndex === 0
      ? false
      : !(backButtonRef.current?.classList.contains("sq-back-btn--hidden"));

    if (!isBackAvailable) {
      return;
    }

    let target = null;
    if (buttonType === "continue") {
      target =
        event.key === "ArrowLeft" || event.key === "ArrowUp"
          ? backButtonRef.current
          : null;
    } else if (buttonType === "back") {
      target =
        event.key === "ArrowRight" || event.key === "ArrowDown"
          ? continueButtonRef.current
          : null;
    }

    if (!target || typeof target.focus !== "function") {
      return;
    }

    event.preventDefault();
    target.focus();
  }, [currentVisibleIndex, showConsentStep]);

  const getChoiceActiveIndex = useCallback((questionKey, total, selectedIndexes = []) => {
    const focusedIndex = choiceFocusIndex[questionKey];

    if (
      Number.isInteger(focusedIndex) &&
      focusedIndex >= 0 &&
      focusedIndex < total
    ) {
      return focusedIndex;
    }

    const firstSelectedIndex = selectedIndexes.find(
      (selectedIndex) =>
        Number.isInteger(selectedIndex) &&
        selectedIndex >= 0 &&
        selectedIndex < total,
    );

    return firstSelectedIndex ?? 0;
  }, [choiceFocusIndex]);

  const handleChoiceFocus = useCallback((questionKey, index) => {
    setChoiceFocusIndex((prev) => {
      if (prev[questionKey] === index) return prev;
      return { ...prev, [questionKey]: index };
    });
  }, []);

  const handleChoiceKeyDown = useCallback((questionKey, index, total, event) => {
    let nextIndex = null;

    switch (event.key) {
      case "ArrowDown":
      case "ArrowRight":
        nextIndex = (index + 1) % total;
        break;
      case "ArrowUp":
      case "ArrowLeft":
        nextIndex = (index - 1 + total) % total;
        break;
      case "Home":
        nextIndex = 0;
        break;
      case "End":
        nextIndex = total - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    setChoiceFocusIndex((prev) => ({ ...prev, [questionKey]: nextIndex }));

    const group = event.currentTarget.parentElement;
    const choices = group
      ? Array.from(
          group.querySelectorAll(
            'button[type="button"], [role="checkbox"], [role="radio"]',
          ),
        )
      : [];

    const nextChoice = choices[nextIndex];
    if (nextChoice && typeof nextChoice.focus === "function") {
      nextChoice.focus();
    }
  }, []);

  const renderMCQ = (question, index) => {
    const canAutoAdvance = question.choices.length <= 3 || question.key === "exercise" || question.key === "referral_source";
    const mcqOtherSelected = answers[question.key] === "Other" && question.choices.includes("Other");
    const selectedIndex = question.choices.indexOf(answers[question.key]);
    const activeIndex = getChoiceActiveIndex(
      question.key,
      question.choices.length,
      [selectedIndex],
    );

    return (
      <div>
        <div className="sq-mcq-list">
          {question.choices.map((choice, i) => {
            const selected = answers[question.key] === choice;

            return (
              <button
                key={i}
                type="button"
                ref={i === activeIndex ? setPrimaryFocus : null}
                className={`sq-mcq-card${selected ? " sq-mcq-card--selected" : ""}`}
                style={{ animationDelay: `${i * 50}ms` }}
                tabIndex={i === activeIndex ? 0 : -1}
                data-primary-focus={i === activeIndex ? "true" : undefined}
                onFocus={() => handleChoiceFocus(question.key, i)}
                onKeyDown={(event) =>
                  handleChoiceKeyDown(
                    question.key,
                    i,
                    question.choices.length,
                    event,
                  )
                }
                onClick={() => {
                  handleAnswer(question.key, choice);
                  handleChoiceFocus(question.key, i);
                  const newAnswers = { ...answers, [question.key]: choice };

                  if (question.key === "age_over_18" && choice === "No") {
                    sendStoppedQuestionnaireData(newAnswers);
                    setTimeout(() => setShowUnderAgeMessage(true), 400);
                    return;
                  }

                  if (question.key === "pregnancy_status" && choice === "Yes") {
                    sendStoppedQuestionnaireData(newAnswers);
                    setTimeout(() => setShowAlert(true), 400);
                    return;
                  }

                  const skipAutoAdvance =
                    question.key === "referral_source" && choice === "Other";

                  if (canAutoAdvance && autoAdvanceRef.current && !skipAutoAdvance) {
                    setTimeout(() => {
                      // Autosave on continue is currently disabled.
                      // void saveProgressOnAdvance(newAnswers);
                      const newOrdered = getOrderedVisible(newAnswers);
                      const curIdx = newOrdered.indexOf(index);
                      const nextIdx = curIdx + 1;
                      if (nextIdx < newOrdered.length) {
                        goTo(newOrdered[nextIdx]);
                      } else {
                        setShowConsentStep(true);
                      }
                    }, 400);
                  }
                }}
              >
                <div className="sq-mcq-radio">
                  {selected && <div className="sq-mcq-radio-dot" />}
                </div>
                <span>{sanitizeInput(choice)}</span>
              </button>
            );
          })}
        </div>

        {mcqOtherSelected && (
          <input
            type="text"
            ref={setPrimaryFocus}
            className="sq-chip-other-input"
            placeholder="Please specify…"
            value={otherTexts[question.key] || ""}
            maxLength={OTHER_TEXT_MAX_LENGTH}
            autoFocus
            onChange={(e) =>
              setOtherTexts((p) => ({ ...p, [question.key]: e.target.value }))
            }
          />
        )}
        {mcqOtherSelected &&
          (otherTexts[question.key] || "").length >= OTHER_TEXT_MAX_LENGTH && (
            <p className="sq-field-description">Max 255 characters</p>
          )}
      </div>
    );
  };

  const renderMultiSelect = (question, index) => {
    const currentValues = Array.isArray(answers[question.key])
      ? answers[question.key]
      : [];
    const otherSelected = currentValues.includes("Other");
    const selectedIndexes = question.choices
      .map((choice, choiceIndex) =>
        currentValues.includes(choice) ? choiceIndex : -1,
      )
      .filter((choiceIndex) => choiceIndex >= 0);
    const activeIndex = getChoiceActiveIndex(
      question.key,
      question.choices.length,
      selectedIndexes,
    );

    const autoAdvanceKeys = [];
    const canChipAutoAdvance = autoAdvanceKeys.includes(question.key);

    return (
      <div>
        <div className="sq-chip-list">
          {question.choices.map((choice, i) => {
            const isSelected = currentValues.includes(choice);
            const isNone = choice === "None of the above";
            const isOther = choice === "Other";

            return (
              <button
                key={i}
                type="button"
                ref={i === activeIndex ? setPrimaryFocus : null}
                className={`sq-chip${isSelected ? " sq-chip--selected" : ""}`}
                style={{ animationDelay: `${i * 30}ms` }}
                tabIndex={i === activeIndex ? 0 : -1}
                data-primary-focus={i === activeIndex ? "true" : undefined}
                onFocus={() => handleChoiceFocus(question.key, i)}
                onKeyDown={(event) =>
                  handleChoiceKeyDown(
                    question.key,
                    i,
                    question.choices.length,
                    event,
                  )
                }
                onClick={() => {
                  handleChoiceFocus(question.key, i);
                  if (isOther) {
                    if (isSelected) {
                      handleAnswer(
                        question.key,
                        currentValues.filter((v) => v !== "Other"),
                      );
                      setOtherTexts((p) => ({ ...p, [question.key]: "" }));
                    } else {
                      handleAnswer(
                        question.key,
                        currentValues
                          .filter((v) => v !== "None of the above")
                          .concat("Other"),
                      );
                    }
                    return;
                  }

                  let newValues;
                  if (isNone) {
                    newValues = isSelected ? [] : ["None of the above"];
                    setOtherTexts((p) => ({ ...p, [question.key]: "" }));
                  } else if (isSelected) {
                    newValues = currentValues.filter((v) => v !== choice);
                  } else {
                    newValues = currentValues
                      .filter((v) => v !== "None of the above")
                      .concat(choice);
                  }

                  handleAnswer(question.key, newValues);

                  if (canChipAutoAdvance && autoAdvanceRef.current && !isNone) {
                    const newAnswers = { ...answers, [question.key]: newValues };
                    setTimeout(() => {
                      // Autosave on continue is currently disabled.
                      // void saveProgressOnAdvance(newAnswers);
                      const newOrdered = getOrderedVisible(newAnswers);
                      const curIdx = newOrdered.indexOf(index);
                      const nextIdx = curIdx + 1;
                      if (nextIdx < newOrdered.length) {
                        goTo(newOrdered[nextIdx]);
                      } else {
                        setShowConsentStep(true);
                      }
                    }, 400);
                  }
                }}
              >
                <div className="sq-chip-checkbox">
                  {isSelected && <CheckIcon size={10} />}
                </div>
                <span>{sanitizeInput(choice)}</span>
              </button>
            );
          })}
        </div>

        {otherSelected && (
          <input
            type="text"
            ref={setPrimaryFocus}
            className="sq-chip-other-input"
            placeholder="Please specify…"
            value={otherTexts[question.key] || ""}
            maxLength={OTHER_TEXT_MAX_LENGTH}
            autoFocus
            onChange={(e) => {
              setOtherTexts((p) => ({
                ...p,
                [question.key]: e.target.value,
              }));
            }}
            onBlur={(e) => {
              if (!e.target.value) {
                setOtherTexts((p) => ({ ...p, [question.key]: "" }));
                handleAnswer(
                  question.key,
                  currentValues.filter((v) => v !== "Other"),
                );
              }
            }}
          />
        )}
        {otherSelected &&
          (otherTexts[question.key] || "").length >= OTHER_TEXT_MAX_LENGTH && (
            <p className="sq-field-description">Max 255 characters</p>
          )}
      </div>
    );
  };

  const renderTextInput = (question, index) => (
    <div>
      <input
        type="text"
        ref={setPrimaryFocus}
        className="sq-input"
        value={answers[question.key] || ""}
        onChange={(e) => {
          const v = e.target.value;

          if (
            question.type === "weight_input" ||
            question.question.includes("height")
          ) {
            if (validateNumberInput(v, `question_${index}`) && !isNaN(v)) {
              handleAnswer(question.key, v);
            }
          } else {
            handleAnswer(question.key, v);
          }
        }}
        placeholder={sanitizeInput(question.placeholder)}
      />
      {errors[`question_${index}`] && (
        <p className="sq-field-error">{errors[`question_${index}`]}</p>
      )}
    </div>
  );

  const renderTextarea = (question) => (
    <div>
      <textarea
        ref={setPrimaryFocus}
        className="sq-textarea"
        value={answers[question.key] || ""}
        onChange={(e) => handleAnswer(question.key, e.target.value)}
        placeholder={sanitizeInput(question.placeholder)}
        rows="5"
        maxLength={1000}
      />
      {question.description && (
        <p className="sq-field-description">
          {sanitizeInput(question.description)}
        </p>
      )}
    </div>
  );

  const renderDateInput = (question) => {
    const maxDate = getAdultDobMaxDate();

    return (
      <div>
        <input
          type="date"
          ref={setPrimaryFocus}
          className="sq-input"
          max={maxDate}
          value={answers[question.key] || ""}
          onChange={(e) => {
            const value = e.target.value;
            handleAnswer(question.key, value);
            setErrors((prev) => ({
              ...prev,
              [question.key]:
                value && !isAdultDob(value)
                  ? "You must be at least 18 years old."
                  : null,
            }));
          }}
        />
        {errors[question.key] && (
          <p className="sq-field-error">{errors[question.key]}</p>
        )}
      </div>
    );
  };

  const renderMedicare = (question) => {
    const expQ = questions.find((q) => q.key === "medicare_expiry");
    const irnQ = questions.find((q) => q.key === "individual_reference_number");

    return (
      <div className="sq-medicare-group">
        <div>
          <input
            type="text"
            ref={!medicareCheckbox ? setPrimaryFocus : null}
            className="sq-input"
            value={answers.medicare_number || ""}
            onChange={(e) => {
              const v = e.target.value;
              if (validateNumberInput(v, "medicare")) {
                handleAnswer("medicare_number", v);
              }
            }}
            placeholder={sanitizeInput(question.placeholder)}
            disabled={medicareCheckbox}
          />
          {errors.medicare_number && (
            <p className="sq-field-error">{errors.medicare_number}</p>
          )}
          {question.description && (
            <p className="sq-field-description">
              {sanitizeInput(question.description)}
            </p>
          )}
        </div>

        {expQ && (
          <div>
            <p className="sq-medicare-field-label">
              {sanitizeInput(expQ.question)}
            </p>
            <DatePicker
              selected={answers.medicare_expiry || null}
              onChange={(date) => handleAnswer("medicare_expiry", date || null)}
              dateFormat="MM/yyyy"
              showMonthYearPicker
              placeholderText="MM/YYYY"
              minDate={new Date()}
              className="sq-input"
              disabled={medicareCheckbox}
              portalId="sq-datepicker-portal"
              popperPlacement="bottom-start"
            />
            {errors.medicare_expiry && (
              <p className="sq-field-error">{errors.medicare_expiry}</p>
            )}
          </div>
        )}

        {irnQ && (
          <div>
            <p className="sq-medicare-field-label">
              {sanitizeInput(irnQ.question)}
            </p>
            <input
              type="text"
              ref={medicareCheckbox ? null : setPrimaryFocus}
              className="sq-input"
              value={answers.individual_reference_number || ""}
              onChange={(e) => {
                const v = e.target.value;
                if (validateNumberInput(v, "individual_reference_number")) {
                  handleAnswer("individual_reference_number", v);
                }
              }}
              placeholder={sanitizeInput(irnQ.placeholder)}
              disabled={medicareCheckbox}
            />
            {errors.individual_reference_number && (
              <p className="sq-field-error">
                {errors.individual_reference_number}
              </p>
            )}
            {irnQ.description && (
              <p className="sq-field-description">
                {sanitizeInput(irnQ.description)}
              </p>
            )}
          </div>
        )}

        {medicareCardImageUrl && validateImageUrl(medicareCardImageUrl) && (
          <img
            src={validateImageUrl(medicareCardImageUrl)}
            alt="Medicare card"
            className="sq-medicare-image"
          />
        )}

        {question.checkbox && (
          <div className="sq-medicare-checkbox-group">
            <div className="sq-medicare-checkbox-row">
              <input
                type="checkbox"
                id="checkbox-medicare"
                checked={medicareCheckbox}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setMedicareCheckbox(checked);

                  if (checked) {
                    setAnswers((prev) => ({
                      ...prev,
                      medicare_number: "",
                      medicare_expiry: "",
                      individual_reference_number: "",
                    }));

                    setErrors((prev) => {
                      const next = { ...prev };
                      delete next.medicare_number;
                      delete next.medicare_expiry;
                      delete next.individual_reference_number;
                      return next;
                    });
                  }
                }}
              />
              <label htmlFor="checkbox-medicare">
                I'll have these ready for the consultation.
              </label>
            </div>
            {medicareCheckbox && (
              <p className="sq-medicare-alert">
                Please note that Medicare details or IHI are required to enable
                our doctors to prescribe a treatment. Please make sure you have
                them handy during your first consultation.
              </p>
            )}
          </div>
        )}

        <div className="sq-ihi-section">
          <p className="sq-ihi-description">
            Don't have a Medicare card? Please provide your Individual
            Healthcare Identifier (IHI) number.
          </p>
          <input
            type="text"
            ref={medicareCheckbox ? setPrimaryFocus : null}
            className="sq-input"
            value={answers.ihi_number || ""}
            onChange={(e) => handleAnswer("ihi_number", e.target.value)}
            placeholder="Enter IHI Number (optional)"
          />
        </div>
      </div>
    );
  };

  const renderAnswerType = (question, index) => {
    if (question.key === "medicare_number") return renderMedicare(question);

    switch (question.type) {
      case "MCQs":
        return renderMCQ(question, index);
      case "multi_select":
        return renderMultiSelect(question, index);
      case "date_input":
        return renderDateInput(question);
      case "input":
      case "weight_input":
        return renderTextInput(question, index);
      case "Textarea":
        return renderTextarea(question);
      default:
        return null;
    }
  };

  const renderConsentContent = () => (
    <div className="sq-question-container" key="consent">
      <div
        ref={questionContainerRef}
        className="sq-question-focus-anchor"
        tabIndex={-1}
      >
        <div className="sq-question-number">Final Step</div>
        <h2 className="sq-question-text">
          Before we submit, please confirm the following:
        </h2>
        <div className="sq-answer-area">
          <div className="sq-consent-list">
          {consentStatements.map((statement, i) => {
            const checked = consentChecked[i] || false;
            const activeIndex = getChoiceActiveIndex(
              "consent_provided",
              consentStatements.length,
              consentChecked
                .map((isChecked, checkedIndex) => (isChecked ? checkedIndex : -1))
                .filter((checkedIndex) => checkedIndex >= 0),
            );

            return (
              <div
                key={i}
                ref={i === activeIndex ? setPrimaryFocus : null}
                className="sq-consent-row"
                tabIndex={i === activeIndex ? 0 : -1}
                data-primary-focus={i === activeIndex ? "true" : undefined}
                role="checkbox"
                aria-checked={checked}
                onFocus={() => handleChoiceFocus("consent_provided", i)}
                onClick={() => {
                  handleChoiceFocus("consent_provided", i);
                  const updated = consentStatements.map((_, idx) =>
                    idx === i
                      ? !consentChecked[idx]
                      : consentChecked[idx] || false,
                  );
                  setConsentChecked(updated);
                }}
                onKeyDown={(e) => {
                  if (["ArrowDown", "ArrowRight", "ArrowUp", "ArrowLeft", "Home", "End"].includes(e.key)) {
                    handleChoiceKeyDown(
                      "consent_provided",
                      i,
                      consentStatements.length,
                      e,
                    );
                    return;
                  }
                  if (e.key === "Enter") {
                    if (!allConsentChecked || surveyLoading) {
                      return;
                    }

                    e.preventDefault();
                    handleSubmit();
                    return;
                  }
                  if (e.key === " ") {
                    e.preventDefault();
                    const updated = consentStatements.map((_, idx) =>
                      idx === i
                        ? !consentChecked[idx]
                        : consentChecked[idx] || false,
                    );
                    setConsentChecked(updated);
                  }
                }}
              >
                <div
                  className={`sq-consent-checkbox${
                    checked ? " sq-consent-checkbox--checked" : ""
                  }`}
                >
                  {checked && (
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M2 7.5L5.5 11L12 3"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{ color: "var(--primed-color-accent, #faf08c)" }}
                      />
                    </svg>
                  )}
                </div>
                <span className="sq-consent-text">{statement}</span>
              </div>
            );
          })}
          </div>

          {submitError && (
            <p className="sq-submit-error">Submission failed: {submitError}</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderQuestionnaireStatusScreen = ({
    title,
    descriptions = [],
    notices = [],
    actionHref,
    actionLabel,
    actionTo,
  }) => (
    <div className="questionnaire-wrapper">
      <div className="container">
        <div className="questionnaire-container">
          <div className="questionnaire-card">
            <div className="card-body">
              <h2 className="questionnaire-title questionnaire-screen-title">
                {title}
              </h2>

              {descriptions.map((description, index) => (
                <p key={`description-${index}`} className="questionnaire-description">
                  {description}
                </p>
              ))}

              {notices.map((notice, index) => (
                <p key={`notice-${index}`} className="questionnaire-notice">
                  {notice}
                </p>
              ))}

              {actionTo ? (
                <Link to={actionTo}>
                  <button className="questionnaire-startBtn">
                    {actionLabel}
                  </button>
                </Link>
              ) : (
                <a href={actionHref}>
                  <button className="questionnaire-startBtn">
                    {actionLabel}
                  </button>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (surveySubmitted) {
    return renderQuestionnaireStatusScreen({
      title: "That's it! You're all done.",
      descriptions: [
        "Thank you for completing the questionnaire. We look forward to discussing your health journey in your upcoming consultation",
      ],
      notices: [
        "After the appointment, your practitioner will be in touch to recommend a tailored treatment plan.",
        "Redirecting to your dashboard in a few seconds...",
      ],
      actionHref: dashboardUrl || `${getBaseUrl()}/patient`,
      actionLabel: "Go To Dashboard",
    });
  }

  if (surveySaved) {
    return renderQuestionnaireStatusScreen({
      title: "Your Progress Is Saved!",
      descriptions: [
        "Login anytime to your account to continue your questionnaire for the telehealth assessment from where you stopped!",
      ],
      notices: [
        "After finishing your questionnaire, your practitioner will be in touch to recommend a tailored treatment plan.",
      ],
      actionHref: `${getBaseUrl()}/patient`,
      actionLabel: "Login To Your Dashboard",
    });
  }

  if (showAlert) {
    return (
      <div className="questionnaire-wrapper">
        <div className="container">
          <div className="questionnaire-container">
            <div className="questionnaire-card">
              <div className="card-body">
                <h2 className="questionnaire-title questionnaire-screen-title">
                  We're sorry, but Primed Clinic is not the right fit for you at
                  this time.
                </h2>
                <p className="questionnaire-description survey-questionnaire-description">
                  Primed Clinic is not suitable for pregnant women, those
                  breastfeeding or planning to become pregnant. Some of the
                  treatments available through Primed Clinic could complicate
                  your pregnancy journey. Please get in touch with your GP, who
                  can offer more suitable options.
                </p>
                <Link to="/">
                  <button className="questionnaire-startBtn">
                    Return To Home Page
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showUnderAgeMessage) {
    return (
      <div className="questionnaire-wrapper">
        <div className="container">
          <div className="questionnaire-container">
            <div className="questionnaire-card">
              <div className="card-body">
                <div
                  style={{
                    fontSize: "52px",
                    textAlign: "center",
                    marginBottom: "8px",
                  }}
                >
                  👩‍⚕️
                </div>
                <h2 className="questionnaire-title questionnaire-screen-title">
                  We're Unable to Proceed
                </h2>
                <p className="questionnaire-description survey-questionnaire-description">
                  Thank you for taking a moment to complete our initial
                  screening - we truly appreciate it.
                </p>
                <p className="questionnaire-description survey-questionnaire-description">
                  Unfortunately, our services are exclusively available to
                  patients who are <strong>18 years of age or older</strong>.
                  Based on your response, you don't meet this eligibility
                  requirement at this time, so we're unable to continue with
                  your consultation.
                </p>
                <p className="questionnaire-description survey-questionnaire-description">
                  We'd encourage you to speak with your GP or a trusted adult,
                  who can help connect you with the most appropriate healthcare
                  support for your needs. Wishing you the very best of health!
                </p>
                <a href="https://www.primedclinic.com.au">
                  <button className="questionnaire-startBtn">
                    Return To Home Page
                  </button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="sq-wrapper">
        <div className="sq-loading">Loading questionnaire…</div>
      </div>
    );
  }

  const progressPercent =
    totalVisible > 0
      ? ((showConsentStep ? totalVisible : currentVisibleIndex + 1) /
          totalVisible) *
        100
      : 0;

  return (
    <div className="sq-wrapper">
      <div className="sq-progress-wrapper">
        <div className="sq-progress">
          <div className="sq-progress-bar">
            <div
              className="sq-progress-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="sq-dot-track">
            {visibleIndices.map((qIdx, dotIdx) => {
              const isDone = dotIdx < currentVisibleIndex && !showConsentStep;
              const isActive =
                dotIdx === currentVisibleIndex && !showConsentStep;
              const isFuture = dotIdx > currentVisibleIndex || showConsentStep;

              return (
                <button
                  key={qIdx}
                  type="button"
                  tabIndex={-1}
                  className={`sq-dot${isDone ? " sq-dot--done" : ""}${
                    isActive ? " sq-dot--active" : ""
                  }${isFuture ? " sq-dot--future" : ""}`}
                  onClick={() => {
                    if (!isFuture && !showConsentStep) {
                      setCurrentQuestion(qIdx);
                      setAnimKey((k) => k + 1);
                      setShowConsentStep(false);
                    }
                  }}
                  aria-label={`Question ${dotIdx + 1}`}
                />
              );
            })}
          </div>
        </div>
      </div>

      <div className="sq-content-area">
        {showConsentStep ? (
          renderConsentContent()
        ) : currentQ ? (
          <div className="sq-question-container" key={animKey}>
            <div
              ref={questionContainerRef}
              className="sq-question-focus-anchor"
              tabIndex={-1}
            >
              {showSectionBadge && (
                <div className="sq-section-badge">{currentSection}</div>
              )}
              <div className="sq-question-number">
                Question {currentVisibleIndex + 1} of {totalVisible}
              </div>
              <h2 className="sq-question-text">
                {sanitizeInput(currentQ.question)}
              </h2>
              {currentQ.type === "multi_select" && (
                <p className="sq-subtitle">Select all that apply</p>
              )}
              <div className="sq-answer-area">
                {renderAnswerType(currentQ, currentQuestion)}
              </div>
            </div>
          </div>
        ) : (
          <div className="sq-question-container">
            <div className="sq-question-text">No current question found.</div>
          </div>
        )}
      </div>

      <div className="sq-footer-wrapper">
        <div className="sq-footer">
          {showConsentStep ? (
            <>
              <div>
                {allConsentChecked && !surveyLoading && (
                  <div className="sq-enter-hint">
                    Press <kbd className="sq-kbd">Enter ↵</kbd>
                  </div>
                )}
              </div>
              <button
                type="button"
                ref={continueButtonRef}
                className="sq-continue-btn"
                onClick={handleSubmit}
                onKeyDown={(event) => handleFooterKeyDown(event, "continue")}
                disabled={!allConsentChecked || surveyLoading}
              >
                {surveyLoading ? "Submitting…" : "Submit"}
              </button>
              <button
                type="button"
                ref={backButtonRef}
                className="sq-back-btn"
                onClick={() => setShowConsentStep(false)}
                onKeyDown={(event) => handleFooterKeyDown(event, "back")}
              >
                <BackArrow />
              </button>
            </>
          ) : (
            <>
              {answered && currentQ?.type !== "MCQs" ? (
                <div className="sq-enter-hint" key={`hint-${animKey}`}>
                  Press <kbd className="sq-kbd">Enter ↵</kbd>
                </div>
              ) : (
                <div />
              )}

              <button
                type="button"
                ref={continueButtonRef}
                className="sq-continue-btn"
                onClick={handleNext}
                onKeyDown={(event) => handleFooterKeyDown(event, "continue")}
                disabled={!answered}
              >
                Continue
              </button>
              <button
                type="button"
                ref={backButtonRef}
                className={`sq-back-btn${
                  currentVisibleIndex === 0 ? " sq-back-btn--hidden" : ""
                }`}
                onClick={handlePrevious}
                onKeyDown={(event) => handleFooterKeyDown(event, "back")}
              >
                <BackArrow />
              </button>
            </>
          )}
        </div>
      </div>

      <div style={{ display: "none" }}>
        <button
          onClick={showPopup}
          className="signout_button"
          aria-label="Menu"
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 22 22"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M3 6h16M3 11h16M3 16h16"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      {isVisible && (
        <div
          className="popup-overlay"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
          }}
        >
          <div
            className="popup-container"
            style={{
              background: "var(--primed-color-bg, #fff)",
              borderRadius: "0.5rem",
              width: "100%",
              maxWidth: "28rem",
              position: "relative",
              padding: "1.7rem 1.5rem",
              boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
            }}
          >
            <button
              onClick={hidePopup}
              style={{
                position: "absolute",
                right: "1rem",
                top: "1rem",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#9ca3af",
              }}
            >
              <X size={20} />
            </button>

            <div>
              <h2
                style={{
                  color: "var(--primed-color-primary, #014548)",
                  fontSize: "1.45rem",
                  fontWeight: 600,
                  marginBottom: "1rem",
                }}
              >
                Save your progress?
              </h2>

              <p
                style={{
                  color: "var(--primed-color-primary, #014548)",
                  fontSize: "1rem",
                  marginBottom: "1.5rem",
                }}
              >
                Save your progress with us and login later to your dashboard to
                continue your questionnaire!
              </p>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                }}
              >
                <button
                  onClick={handleSave}
                  disabled={answers.sex_at_birth === "" || surveyLoading}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    borderRadius: "0.375rem",
                    fontWeight: 500,
                    border: "none",
                    cursor: "pointer",
                    background: "var(--primed-color-focus, #43a6aa)",
                    color: "#fff",
                    opacity:
                      answers.sex_at_birth === "" || surveyLoading ? 0.5 : 1,
                  }}
                >
                  {surveyLoading
                    ? "Saving your progress..."
                    : "Save Your Progress"}
                </button>

                <button
                  onClick={handleContinue}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    borderRadius: "0.375rem",
                    fontWeight: 500,
                    border: "1px solid var(--primed-color-focus, #43a6aa)",
                    cursor: "pointer",
                    background: "transparent",
                    color: "var(--primed-color-focus, #43a6aa)",
                  }}
                >
                  Continue quiz
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SurveyQuestions;
