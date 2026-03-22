import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { useSurveyConfig } from "../SurveyConfig";
import { validateImageUrl } from "../utils/validation";
import "./TreatmentSelection.css";

const DEBUG = false;

const debug = (...args) => {
  if (DEBUG) {
    console.log("[PrimedSurvey]", ...args);
  }
};

const CDN = "https://cdn.prod.website-files.com/6981710e75497676ffbaf22b/";

const treatments = [
  {
    slug: "muscle-strength-support",
    id: 3,
    label: "Muscle Strength & Support",
    img: CDN + "698d0363ea3a2ec39ec8f5a2_Features%20Images%20Priemd.webp",
  },
  {
    slug: "anti-ageing",
    id: 1,
    label: "Anti-Ageing",
    img:
      CDN +
      "698961322087f5d9ab01adac_Q_PRIMED_FAVOURITES_ADONCELLO__LEX1309-1.webp",
  },
  {
    slug: "weight-loss",
    id: 2,
    label: "Weight Loss",
    img:
      CDN +
      "69896132f26c7f07352002a4_671a443699cfb0f4ec724439_Screenshot%25202024-09-12%2520at%252018.26.59%2520(1).webp-1.webp",
  },
  {
    slug: "injury-repair-recovery",
    id: 4,
    label: "Injury Repair & Recovery",
    img:
      CDN +
      "6993e3693d9de807ab900e79_Injury%20Recovery%20Sports%20Physio%20(1).webp",
  },
  {
    slug: "sexual-health-libido",
    id: 5,
    label: "Sexual Health & Libido",
    img: CDN + "698eb32fa4fed06c3c5f760e_spa%20shot.webp",
  },
  {
    slug: "gut-health-immunity",
    id: 8,
    label: "Gut Health & Immunity",
    img: CDN + "6993e4995da0f84ba384d985_Gut%20Health%20.webp",
  },
  {
    slug: "cognitive-health",
    id: 9,
    label: "Cognitive Support",
    img: CDN + "698d1570ede5aa07cb47dffe_Placeholder%20Image-1.webp",
  },
  {
    slug: "skin-care",
    id: 10,
    label: "Skin Care",
    img: CDN + "698d5535b9a36d3ce1bf4b31_Skin%20care.webp",
  },
  {
    slug: "womens-health",
    id: 7,
    label: "Women's Health",
    img: CDN + "69ac208fbfbefc240c2e45c1_Women-health.jpeg",
  },
];

const ArrowIcon = () => (
  <svg
    className="treatment-card-arrow"
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M7 4l6 6-6 6" />
  </svg>
);

const CheckIcon = () => (
  <svg viewBox="0 0 14 14">
    <path d="M2.5 7.5L5.5 10.5L11.5 4" />
  </svg>
);

const TreatmentSelection = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { treatmentName, id } = useParams();
  const {
    treatmentLabelClass,
    treatmentImages,
    treatments: treatmentsOverride,
  } = useSurveyConfig();

  const [selected, setSelected] = useState(null);

  const activeTreatments =
    Array.isArray(treatmentsOverride) && treatmentsOverride.length > 0
      ? treatmentsOverride
      : treatments;

  const resolvedTreatment = useMemo(() => {
    const params = new URLSearchParams(location.search);

    const queryTreatmentName = params.get("treatmentName") || "";
    const queryTreatmentId = params.get("treatmentId") || "";

    const sessionTreatmentName = sessionStorage.getItem("treatmentName") || "";
    const sessionTreatmentId = sessionStorage.getItem("treatmentId") || "";

    const parentDiv = document.getElementById("primed-survey");
    const divTreatmentName =
      parentDiv?.getAttribute("data-treatment-name") || "";
    const divTreatmentId = parentDiv?.getAttribute("data-treatment-id") || "";

    const finalTreatmentName =
      divTreatmentName ||
      queryTreatmentName ||
      treatmentName ||
      sessionTreatmentName ||
      "";

    const finalTreatmentId =
      divTreatmentId || queryTreatmentId || id || sessionTreatmentId || "";

    const result = {
      treatmentName: finalTreatmentName,
      treatmentId: finalTreatmentId,
      hasTreatment: Boolean(finalTreatmentName && finalTreatmentId),
    };

    debug("TreatmentSelection resolvedTreatment", result);
    return result;
  }, [location.search, treatmentName, id]);

  useEffect(() => {
    if (resolvedTreatment.treatmentName) {
      sessionStorage.setItem("treatmentName", resolvedTreatment.treatmentName);
    }

    if (resolvedTreatment.treatmentId) {
      sessionStorage.setItem("treatmentId", String(resolvedTreatment.treatmentId));
    }
  }, [resolvedTreatment]);

  useEffect(() => {
    if (resolvedTreatment.treatmentName && resolvedTreatment.treatmentId) {
      const targetUrl = `/questionnaire/${encodeURIComponent(
        resolvedTreatment.treatmentName,
      )}/${encodeURIComponent(resolvedTreatment.treatmentId)}`;

      debug("TreatmentSelection auto redirecting to", targetUrl);
      navigate(targetUrl, { replace: true });
    }
  }, [resolvedTreatment, navigate]);

  const handleSelect = (slug, id, label) => {
    setSelected({ slug, id, label });

    try {
      sessionStorage.setItem("treatmentName", slug);
      sessionStorage.setItem("treatmentId", String(id));
    } catch (err) {
      console.warn("Could not save treatment plan to sessionStorage:", err);
    }

    setTimeout(() => {
      navigate(
        `/questionnaire/${encodeURIComponent(slug)}/${encodeURIComponent(id)}`,
      );
    }, 400);
  };

  if (resolvedTreatment.hasTreatment) {
    return null;
  }

  return (
    <div className="treatment-selection-wrapper">
      <div className="treatment-selection-container">
        <div className="treatment-selection-hero">
          <div className="treatment-selection-badge">Get Started</div>
          <h2 className="treatment-selection-title">What is your goal?</h2>
          <p className="treatment-selection-subtitle">
            Select a treatment area to begin
          </p>
        </div>

        <div className="treatment-grid">
          {activeTreatments.map((t) => {
            const override = treatmentImages && treatmentImages[t.slug];
            const imgSrc = (override && validateImageUrl(override)) || t.img;
            const isSelected = selected?.slug === t.slug;
            const labelClass = `treatment-card-label${
              treatmentLabelClass ? ` ${treatmentLabelClass}` : ""
            }`;

            return (
              <button
                key={t.slug}
                type="button"
                className={`treatment-card${
                  isSelected ? " treatment-card--selected" : ""
                }`}
                onClick={() => handleSelect(t.slug, t.id, t.label)}
              >
                <div className="treatment-card-image-wrap">
                  <img
                    src={imgSrc}
                    alt={t.label}
                    className="treatment-card-image"
                  />
                </div>

                {isSelected && (
                  <div className="treatment-card-check">
                    <CheckIcon />
                  </div>
                )}

                <div className="treatment-card-label-area">
                  <span className={labelClass}>{t.label}</span>
                  <ArrowIcon />
                </div>

                <div className="treatment-card-accent" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TreatmentSelection;
