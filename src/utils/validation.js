const DANGEROUS_SCHEMES = /^(javascript|data|vbscript|blob):/i;

export function validateUrl(url) {
  if (!url || typeof url !== "string") return "";
  const trimmed = url.trim();
  if (DANGEROUS_SCHEMES.test(trimmed)) return "";
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return "";
    const allowed = typeof process !== "undefined" && process.env.REACT_APP_ALLOWED_API_ORIGINS;
    if (allowed) {
      const origins = allowed.split(",").map((o) => o.trim()).filter(Boolean);
      if (!origins.includes(parsed.origin)) return "";
    }
    return trimmed;
  } catch {
    return "";
  }
}

export function validateRedirectUrl(url, allowedBase) {
  if (!url || typeof url !== "string") return "";
  const trimmed = url.trim();
  if (DANGEROUS_SCHEMES.test(trimmed)) return "";
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return "";
    if (allowedBase) {
      const base = new URL(allowedBase);
      if (parsed.origin !== base.origin) return "";
    }
    return trimmed;
  } catch {
    return "";
  }
}

const TRUSTED_IMAGE_HOSTS = ["cdn.prod.website-files.com"];

export function validateImageUrl(url) {
  if (!url || typeof url !== "string") return "";
  const trimmed = url.trim();
  if (DANGEROUS_SCHEMES.test(trimmed)) return "";
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "https:") return "";
    if (!TRUSTED_IMAGE_HOSTS.includes(parsed.hostname)) return "";
    return trimmed;
  } catch {
    return "";
  }
}

const SAFE_FONT_RE = /^[\w\s,'"-]+$/;

export function sanitizeFont(font) {
  if (!font || typeof font !== "string") return "";
  return SAFE_FONT_RE.test(font) ? font : "";
}

export function sanitizeCss(css) {
  if (!css || typeof css !== "string") return "";
  return css
    .replace(/url\s*\(/gi, "")
    .replace(/@import\b/gi, "")
    .replace(/expression\s*\(/gi, "")
    .replace(/javascript\s*:/gi, "")
    .replace(/-moz-binding\s*:/gi, "")
    .replace(/behavior\s*:/gi, "");
}
