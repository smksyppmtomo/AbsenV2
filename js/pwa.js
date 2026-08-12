// PWA Installation & Service Worker Manager Module (Android, iOS Safari & Desktop)
let deferredPrompt = null;

// Detect iOS / iPhone / iPad device
function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

// Detect if app is already running in standalone PWA mode
function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

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

// Intercept beforeinstallprompt for Android & Desktop Chrome/Edge
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;

  const headerInstallBtn = document.getElementById("headerPwaInstallBtn");
  if (headerInstallBtn) {
    headerInstallBtn.classList.remove("hidden");
  }

  // Show PWA popup modal automatically if user hasn't dismissed in this session and not already standalone
  if (!isStandalone() && !sessionStorage.getItem("pwa_modal_dismissed")) {
    showPwaInstallModal();
  }
});

function showPwaInstallModal() {
  if (isStandalone()) return; // Don't show modal if already running as installed app

  const modal = document.getElementById("pwaInstallModal");
  if (!modal) return;

  const androidBlock = document.getElementById("pwaAndroidPromptBlock");
  const iosBlock = document.getElementById("pwaIosPromptBlock");

  if (isIOS()) {
    if (androidBlock) androidBlock.classList.add("hidden");
    if (iosBlock) iosBlock.classList.remove("hidden");
  } else {
    if (androidBlock) androidBlock.classList.remove("hidden");
    if (iosBlock) iosBlock.classList.add("hidden");
  }

  modal.classList.remove("hidden");
}

function closePwaInstallModal() {
  const modal = document.getElementById("pwaInstallModal");
  if (modal) modal.classList.add("hidden");
  sessionStorage.setItem("pwa_modal_dismissed", "true");
}

async function triggerPwaInstallation() {
  if (isIOS()) {
    showToast("Di iPhone/iPad: Ketuk ikon Bagikan (Share 📤) di Safari, lalu pilih 'Tambahkan ke Layar Utama'.", "info");
    return;
  }

  if (!deferredPrompt) {
    showToast("Aplikasi sudah terpasang atau gunakan opsi 'Instal Aplikasi' / 'Tambahkan ke Layar Utama' di menu browser HP Anda.", "info");
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

// Auto prompt check on DOMContentLoaded for iOS or ready devices
document.addEventListener("DOMContentLoaded", () => {
  if (isIOS() && !isStandalone() && !sessionStorage.getItem("pwa_modal_dismissed")) {
    setTimeout(() => {
      showPwaInstallModal();
    }, 1500);
  }
});
