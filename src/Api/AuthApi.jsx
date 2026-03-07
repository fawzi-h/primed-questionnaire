import axios from "axios";
import getBaseUrl from "./BaseUrl";

// Create an Axios instance — baseURL is resolved per-request so that
// data-api-url / data-api-url-dev attributes are always read from the live DOM.
//
// Cross-origin (widget) notes:
//  - X-Requested-With removed: it is a Laravel same-origin convention that
//    triggers an OPTIONS preflight and is not required by the JSON API.
//  - withCredentials removed: session cookies are not used cross-origin;
//    the server must use token-based auth for embedded widget requests.
//  - withXSRFToken removed: XSRF cookies cannot be read cross-origin.
const api = axios.create({
  headers: {
    // 'Accept' is a CORS-safelisted header — no preflight triggered.
    'Accept': 'application/json',
    // 'Content-Type: application/json' is NOT safelisted and triggers an OPTIONS
    // preflight even on GET requests. Axios sets it automatically on POST/PUT/PATCH
    // when a JSON body is present, so we must NOT set it as a global default.
  },
  withCredentials: false,
});

api.interceptors.request.use((config) => {
  config.baseURL = getBaseUrl();
  return config;
});


export default api;