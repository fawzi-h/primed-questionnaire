import { validateUrl } from "../utils/validation";

/**
 * Resolve a prod/dev URL pair based on the current hostname.
 *
 * devHosts – comma-separated string OR array, default: ["localhost", "127.0.0.1"]
 */
export function resolveUrl(prodUrl, devUrl, devHosts) {
  if (typeof window === "undefined") return prodUrl || "";

  let hosts = devHosts;
  if (typeof hosts === "string") {
    hosts = hosts.split(",").map((h) => h.trim()).filter(Boolean);
  }
  if (!Array.isArray(hosts) || hosts.length === 0) {
    hosts = ["localhost", "127.0.0.1"];
  }

  const isDev = hosts.includes(window.location.hostname);
  return (isDev ? devUrl : prodUrl) || prodUrl || "";
}

const getBaseUrl = () => {
  if (typeof window === "undefined") return process.env.REACT_APP_URL;

  // 1. window.SURVEY_CONFIG (programmatic)
  const config = window.SURVEY_CONFIG || {};
  if (config.apiUrl || config.apiUrlDev) {
    return resolveUrl(validateUrl(config.apiUrl), validateUrl(config.apiUrlDev), config.devHosts);
  }

  // 2. data-* attributes on the mount div
  const div = document.getElementById("primed-survey");
  if (div) {
    const apiUrl    = validateUrl(div.getAttribute("data-api-url")     || "") || "";
    const apiUrlDev = validateUrl(div.getAttribute("data-api-url-dev") || "") || "";
    if (apiUrl || apiUrlDev) {
      let devHosts = null;
      try { devHosts = JSON.parse(div.getAttribute("data-dev-hosts") || "null"); } catch { /* ignore */ }
      return resolveUrl(apiUrl, apiUrlDev, devHosts);
    }
  }

  // 3. Legacy env-var fallback
  return window.location.port === "8443"
    ? process.env.REACT_APP_URL_8443
    : process.env.REACT_APP_URL;
};

export default getBaseUrl;
