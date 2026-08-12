// Main Application Initializer & PWA Lifecycle Module
document.addEventListener("DOMContentLoaded", () => {
  initClock();
  registerPWA();
  initDates();
  loadRealtimeData();
  getCurrentLocation();
  autoSelectStatusByCurrentTime();

  // Attach global event listener for custom modal actions
  const customConfirmBtn = document.getElementById("customConfirmBtnAction");
  if (customConfirmBtn) {
    customConfirmBtn.addEventListener("click", () => {
      if (typeof customConfirmCallback === "function") {
        const action = customConfirmCallback;
        closeCustomConfirmModal();
        action();
      } else {
        closeCustomConfirmModal();
      }
    });
  }
});

function registerPWA() {
  if ("serviceWorker" in navigator) {
    const swCode = `
      self.addEventListener('install', e => e.waitUntil(self.skipWaiting()));
      self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
      self.addEventListener('fetch', e => e.respondWith(fetch(e.request).catch(() => caches.match(e.request))));
    `;
    const blob = new Blob([swCode], { type: "application/javascript" });
    navigator.serviceWorker.register(URL.createObjectURL(blob)).catch(() => {});
  }

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const pwaContainer = document.getElementById("pwaInstallBtnContainer");
    if (pwaContainer) pwaContainer.classList.remove("hidden");
  });
}

function installPWA() {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(() => {
      deferredPrompt = null;
      const pwaContainer = document.getElementById("pwaInstallBtnContainer");
      if (pwaContainer) pwaContainer.classList.add("hidden");
    });
  }
}
