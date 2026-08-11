// Toast & Loading Overlay Notification System
function showToast(message, type = "info") {
  const container = document.getElementById("toastContainer");
  if (!container) return;

  const toast = document.createElement("div");

  let borderClass = "border-l-4 border-slate-500";
  let iconSymbol = "info";
  let badgeBg = "bg-slate-700 text-slate-200";
  let titleText = "Informasi Sistem";

  if (type === "success") {
    borderClass = "border-l-4 border-emerald-500 shadow-emerald-500/10";
    iconSymbol = "check_circle";
    badgeBg = "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30";
    titleText = "Berhasil";
  } else if (type === "error") {
    borderClass = "border-l-4 border-rose-500 shadow-rose-500/10";
    iconSymbol = "error";
    badgeBg = "bg-rose-500/20 text-rose-400 border border-rose-500/30";
    titleText = "Terjadi Kesalahan";
  } else if (type === "warning") {
    borderClass = "border-l-4 border-amber-500 shadow-amber-500/10";
    iconSymbol = "warning";
    badgeBg = "bg-amber-500/20 text-amber-400 border border-amber-500/30";
    titleText = "Peringatan";
  } else {
    borderClass = "border-l-4 border-indigo-500 shadow-indigo-500/10";
    iconSymbol = "info";
    badgeBg = "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30";
    titleText = "Informasi Server";
  }

  toast.className = `glass-navy text-white rounded-2xl shadow-2xl p-4 transition-all duration-300 transform -translate-y-4 opacity-0 pointer-events-auto relative overflow-hidden flex items-start space-x-3 border border-slate-700/80 ${borderClass}`;

  toast.innerHTML = `
    <div class="p-2 rounded-xl ${badgeBg} flex items-center justify-center flex-shrink-0">
      <span class="material-symbols-outlined text-lg">${iconSymbol}</span>
    </div>
    <div class="flex-1 min-w-0 pr-4">
      <h5 class="text-xs font-extrabold tracking-wide uppercase text-slate-200">${titleText}</h5>
      <p class="text-xs font-medium text-slate-300 mt-0.5 leading-relaxed break-words">${message}</p>
    </div>
    <button onclick="this.parentElement.remove()" class="text-slate-400 hover:text-white p-1 rounded-full flex-shrink-0 transition">
      <span class="material-symbols-outlined text-sm">close</span>
    </button>
    <div class="absolute bottom-0 left-0 right-0 h-1 bg-slate-800/80 overflow-hidden">
      <div class="h-full bg-brand-yellow toast-progress-bar"></div>
    </div>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.remove("-translate-y-4", "opacity-0");
    toast.classList.add("translate-y-0", "opacity-100");
  }, 20);

  setTimeout(() => {
    toast.classList.remove("translate-y-0", "opacity-100");
    toast.classList.add("-translate-y-2", "opacity-0");
    setTimeout(() => toast.remove(), 350);
  }, 3500);
}

function showCustomConfirm(title, message, callback) {
  document.getElementById("customConfirmTitle").innerText = title;
  document.getElementById("customConfirmMessage").innerText = message;
  customConfirmCallback = callback;
  document.getElementById("customConfirmModal").classList.remove("hidden");
}

function closeCustomConfirmModal() {
  document.getElementById("customConfirmModal").classList.add("hidden");
  customConfirmCallback = null;
}

function closeAnnouncementModal() {
  const modal = document.getElementById("announcementModal");
  if (modal) modal.classList.add("hidden");
}

// DYNAMIC SMOOTH LOADING PROGRESS SYSTEM
let loadingStartTime = 0;
let loadingTimerInterval = null;
let loadingProgressInterval = null;
let currentLoadingPercent = 0;

function startLoadingTimer() {
  loadingStartTime = Date.now();
  if (loadingTimerInterval) clearInterval(loadingTimerInterval);

  const timerEl = document.getElementById("loadingSecondsText");
  if (timerEl) timerEl.innerText = "0.0s";

  loadingTimerInterval = setInterval(() => {
    const elapsedMs = Date.now() - loadingStartTime;
    const seconds = (elapsedMs / 1000).toFixed(1);
    if (timerEl) {
      timerEl.innerText = `${seconds}s`;
    }
  }, 100);
}

function stopLoadingTimer() {
  if (loadingTimerInterval) {
    clearInterval(loadingTimerInterval);
    loadingTimerInterval = null;
  }
}

function updateLoadingProgress(percent, text) {
  currentLoadingPercent = Math.min(100, Math.max(0, Math.round(percent)));
  const progressBar = document.getElementById("loadingProgressBar");
  const percentText = document.getElementById("loadingPercentText");
  const statusText = document.getElementById("loadingStatusText");

  if (progressBar) progressBar.style.width = `${currentLoadingPercent}%`;
  if (percentText) percentText.innerText = `${currentLoadingPercent}%`;
  if (statusText && text) statusText.innerText = text;
}

function showLoadingOverlay(initialText = "Menghubungkan ke Server...") {
  const overlay = document.getElementById("appLoadingOverlay");
  if (!overlay) return;

  overlay.style.display = "flex";
  overlay.classList.remove("opacity-0", "pointer-events-none");
  updateLoadingProgress(5, initialText);
  startLoadingTimer();

  if (loadingProgressInterval) clearInterval(loadingProgressInterval);

  let target = 5;
  loadingProgressInterval = setInterval(() => {
    if (target < 92) {
      target += Math.floor(Math.random() * 6) + 3;
      if (target > 92) target = 92;

      let msg = "Menghubungkan ke Server Utama...";
      if (target > 30) msg = "Mengunduh Data Presensi Guru...";
      if (target > 65) msg = "Memproses & Menyusun Data Server...";

      updateLoadingProgress(target, msg);
    }
  }, 70);
}

function finishLoadingProgress(callback) {
  if (loadingProgressInterval) {
    clearInterval(loadingProgressInterval);
    loadingProgressInterval = null;
  }

  let step = currentLoadingPercent;
  const finishInterval = setInterval(() => {
    step += 8;
    if (step >= 100) {
      step = 100;
      clearInterval(finishInterval);
      updateLoadingProgress(100, "Selesai Memuat Data Server!");
      
      setTimeout(() => {
        hideLoadingOverlay();
        if (typeof callback === "function") callback();
      }, 350);
    } else {
      updateLoadingProgress(step, "Memproses Data Server...");
    }
  }, 40);
}

function hideLoadingOverlay() {
  if (loadingProgressInterval) {
    clearInterval(loadingProgressInterval);
    loadingProgressInterval = null;
  }
  stopLoadingTimer();

  const overlay = document.getElementById("appLoadingOverlay");
  if (overlay) {
    overlay.classList.add("opacity-0", "pointer-events-none");
    setTimeout(() => {
      overlay.style.display = "none";
    }, 450);
  }
}
