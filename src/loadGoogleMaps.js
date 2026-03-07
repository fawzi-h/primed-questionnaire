import getBaseUrl from "./Api/BaseUrl.jsx";

// Module-level promise — the key is fetched and the script is injected at most once.
let mapsPromise = null;

const loadGoogleMapsApi = () => {
  // Return existing promise if already in flight or completed
  if (mapsPromise) return mapsPromise;

  // Script already present (e.g. host page loaded Maps independently)
  if (document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]')) {
    mapsPromise = Promise.resolve();
    return mapsPromise;
  }

  mapsPromise = fetch(`${getBaseUrl()}/api/config/maps-key`)
    .then((res) => res.json())
    .then(({ key }) => {
      if (!key) {
        console.error("Google Maps API key is missing");
        return;
      }
      return new Promise((resolve, reject) => {
        if (typeof window.initMap !== "function") {
          window.initMap = function() {};
        }
        const script = document.createElement("script");
        script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=places&loading=async&callback=initMap`;
        script.async = true;
        script.defer = true;
        script.onload = () => resolve();
        script.onerror = (err) => reject(err);
        document.head.appendChild(script);
      });
    })
    .catch((error) => {
      console.error("Failed to load Google Maps script:", error);
      mapsPromise = null; // allow retry on next import if something went wrong
    });

  return mapsPromise;
};

// Kick off immediately when the module is first imported
loadGoogleMapsApi();
