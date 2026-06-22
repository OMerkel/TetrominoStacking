/**
 * Service Worker Registration Module
 *
 * Handles registration and lifecycle management of the offline-first service worker.
 * Provides minimal API for app integration: register() and status monitoring.
 */

/**
 * Register the service worker if supported by the browser
 */
export const registerServiceWorker = () => {
  if (!("serviceWorker" in navigator)) {
    console.debug("Service Worker API not supported");
    return Promise.resolve(null);
  }

  return navigator.serviceWorker
    .register("/TetrominoStacking/html5/src/service-worker.js", {
      scope: "/TetrominoStacking/html5/src/",
    })
    .then((registration) => {
      console.debug("Service Worker registered:", registration);

      // Listen for updates
      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener("statechange", () => {
          if (
            newWorker.state === "installed" &&
            navigator.serviceWorker.controller
          ) {
            // New service worker ready; notify app
            console.debug("Service Worker update available");
            // Optional: dispatch custom event for UI notification
            window.dispatchEvent(
              new CustomEvent("sw-update-ready", { detail: registration }),
            );
          }
        });
      });

      return registration;
    })
    .catch((error) => {
      console.warn("Service Worker registration failed:", error);
      return null;
    });
};

/**
 * Check if the app is currently online
 */
export const isOnline = () => navigator.onLine;

/**
 * Listen for online/offline status changes
 */
export const onOnlineStatusChange = (callback) => {
  window.addEventListener("online", () => callback(true));
  window.addEventListener("offline", () => callback(false));
  return () => {
    window.removeEventListener("online", () => callback(true));
    window.removeEventListener("offline", () => callback(false));
  };
};
