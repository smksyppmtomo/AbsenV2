// PWA Installation & Service Worker Manager Module
let deferredPrompt = null;

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./sw.js")
      .then((reg) => {
        console.log("PWA Service Worker registered successfully:", reg.scope);
      })
      .catch((err) => {
        console.warn("PWA Service Worker registration notice:", err);
      });
  });
}

// Intercept beforeinstallprompt to trigger TRUE Standalone App Installation
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;

  const headerInstallBtn = document.getElementById("headerPwaInstallBtn");
  if (headerInstallBtn) {
    headerInstallBtn.classList.remove("hidden");
  }

  // Show PWA popup modal automatically unless user already dismissed in this session
  if (!sessionStorage.getItem("pwa_modal_dismissed")) {
    showPwaInstallModal();
  }
});

function showPwaInstallModal() {
  const modal = document.getElementById("pwaInstallModal");
  if (modal) modal.classList.remove("hidden");
}

function closePwaInstallModal() {
  const modal = document.getElementById("pwaInstallModal");
  if (modal) modal.classList.add("hidden");
  sessionStorage.setItem("pwa_modal_dismissed", "true");
}

async function triggerPwaInstallation() {
  if (!deferredPrompt) {
    showToast("Aplikasi sudah terpasang atau gunakan opsi 'Instal Aplikasi' di menu browser HP/Desktop Anda.", "info");
    closePwaInstallModal();
    return;
  }

  deferredPrompt.prompt();

  const { outcome } = await deferredPrompt.userChoice;
  if (outcome === "accepted") {
    showToast("Memasang Aplikasi Presensi SMK YPPM TOMO di Perangkat Anda...", "success");
  } else {
    showToast("Pemasangan aplikasi dibatalkan.", "warning");
  }

  deferredPrompt = null;
  closePwaInstallModal();
}

window.addEventListener("appinstalled", () => {
  showToast("Aplikasi Presensi SMK YPPM TOMO Berhasil Terpasang di Perangkat!", "success");
  deferredPrompt = null;
  closePwaInstallModal();

  const headerInstallBtn = document.getElementById("headerPwaInstallBtn");
  if (headerInstallBtn) headerInstallBtn.classList.add("hidden");
});
