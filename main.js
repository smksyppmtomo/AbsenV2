let gasUrl = localStorage.getItem("yppm_gas_url") || "https://script.google.com/macros/s/AKfycbyNHOZ49ekilhIwd22Dw1UOmmmrrPnqlpIANtwk4pY9ucJthloO8T1VcvWSm_x2Dt7d/exec";

let teachersData = [];
let attendanceLogs = [];
let izinLogs = [];
let selectedGuru = null;
let currentAttendanceStatus = "Masuk";
let currentGeoLocation = { lat: null, lng: null, address: "Lokasi belum didapatkan" };

let photoInputMode = "camera";
let photoBase64 = null;
let cameraStream = null;
let deferredPrompt = null;

let configJam = { jamMasuk: "07:00", jamTerlambat: "07:15", jamPulang: "15:00" };
let customConfirmCallback = null;

let calSelectedYear = new Date().getFullYear();
let calSelectedMonth = new Date().getMonth();

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

document.getElementById("customConfirmBtnAction").addEventListener("click", () => {
  if (typeof customConfirmCallback === "function") {
    const action = customConfirmCallback;
    closeCustomConfirmModal();
    action();
  } else {
    closeCustomConfirmModal();
  }
});

function parseToDateKey(dateVal) {
  if (!dateVal) return "";
  let d;
  if (typeof dateVal === "string") {
    const trimmed = dateVal.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
    d = new Date(trimmed);
  } else {
    d = new Date(dateVal);
  }
  if (isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatOnlyDate(dateVal) {
  if (!dateVal) return "-";
  const key = parseToDateKey(dateVal);
  if (!key) return String(dateVal);
  const parts = key.split("-");
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTimeOnly(timeVal, defaultVal = "--:--") {
  if (!timeVal) return defaultVal;
  if (typeof timeVal === "string" && /^\d{1,2}:\d{2}(:\d{2})?$/.test(timeVal.trim())) {
    const parts = timeVal.trim().split(":");
    return `${parts[0].padStart(2, "0")}:${parts[1].padStart(2, "0")}`;
  }
  const d = new Date(timeVal);
  if (!isNaN(d.getTime())) {
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  }
  return String(timeVal);
}

// SISTEM TOAST ALERT ULTRA-PROFESIONAL WOW LEVEL
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

let loadingStartTime = 0;
let loadingTimerInterval = null;

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
  const progressBar = document.getElementById("loadingProgressBar");
  const percentText = document.getElementById("loadingPercentText");
  const statusText = document.getElementById("loadingStatusText");

  if (progressBar) progressBar.style.width = `${percent}%`;
  if (percentText) percentText.innerText = `${percent}%`;
  if (statusText && text) statusText.innerText = text;
}

function hideLoadingOverlay() {
  const overlay = document.getElementById("appLoadingOverlay");
  stopLoadingTimer();
  if (overlay) {
    overlay.classList.add("opacity-0", "pointer-events-none");
    setTimeout(() => {
      overlay.style.display = "none";
    }, 500);
  }
}

function showLoadingOverlay(initialText = "Menghubungkan ke Server...") {
  const overlay = document.getElementById("appLoadingOverlay");
  if (overlay) {
    overlay.style.display = "flex";
    overlay.classList.remove("opacity-0", "pointer-events-none");
    updateLoadingProgress(0, initialText);
    startLoadingTimer();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initClock();
  registerPWA();
  initDates();
  loadRealtimeData();
  getCurrentLocation();
  autoSelectStatusByCurrentTime();
});

function autoSelectStatusByCurrentTime() {
  const currentHour = new Date().getHours();
  if (currentHour >= 6 && currentHour < 10) {
    setAttendanceStatus("Masuk");
  } else if (currentHour >= 10 && currentHour <= 18) {
    setAttendanceStatus("Pulang");
  }
}

function initClock() {
  const updateClock = () => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) + " WIB";
    const dateStr = now.toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

    document.getElementById("liveClock").innerText = timeStr;
    document.getElementById("dashCurrentDate").innerText = dateStr;
    const desktopDate = document.getElementById("dashCurrentDateDesktop");
    if (desktopDate) desktopDate.innerText = dateStr;
  };
  updateClock();
  setInterval(updateClock, 1000);
}

function initDates() {
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("izinStartDate").value = today;
  document.getElementById("izinEndDate").value = today;
  document.getElementById("gasUrlInput").value = gasUrl;
}

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
    document.getElementById("pwaInstallBtnContainer").classList.remove("hidden");
  });
}

function installPWA() {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(() => {
      deferredPrompt = null;
      document.getElementById("pwaInstallBtnContainer").classList.add("hidden");
    });
  }
}

function switchTab(tabId) {
  document.querySelectorAll(".page-view").forEach((el) => el.classList.remove("active"));
  document.querySelectorAll(".nav-btn").forEach((el) => {
    el.classList.remove("text-brand-yellow");
    el.classList.add("text-slate-400");
  });
  document.querySelectorAll(".top-nav-btn").forEach((el) => {
    el.classList.remove("text-brand-yellow");
    el.classList.add("text-slate-300");
  });

  const targetPage = document.getElementById(`page-${tabId}`);
  if (targetPage) targetPage.classList.add("active");

  const targetNav = document.getElementById(`nav-${tabId}`);
  if (targetNav) {
    targetNav.classList.remove("text-slate-400");
    targetNav.classList.add("text-brand-yellow");
  }

  const topNav = document.getElementById(`top-nav-${tabId}`);
  if (topNav) {
    topNav.classList.remove("text-slate-300");
    topNav.classList.add("text-brand-yellow");
  }

  if (tabId === "absensi") {
    autoSelectStatusByCurrentTime();
    updateFormProgress();
  }
  if (tabId === "kalender") renderCalendar();
  if (tabId === "profil") renderProfile();
}

async function apiCall(action, payload = {}) {
  const icon = document.getElementById("refreshIcon");
  if (icon) icon.classList.add("animate-spin");

  try {
    const response = await fetch(gasUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action, ...payload }),
    });
    const result = await response.json();
    if (icon) icon.classList.remove("animate-spin");
    return result;
  } catch (err) {
    if (icon) icon.classList.remove("animate-spin");
    return { success: false, message: "Gagal terhubung ke Server Web App Backend." };
  }
}

async function loadRealtimeData() {
  showLoadingOverlay("Menghubungkan ke Server Utama...");
  updateLoadingProgress(20, "Menghubungkan ke Server Utama...");

  let progressVal = 20;
  const progressTimer = setInterval(() => {
    if (progressVal < 85) {
      progressVal += Math.floor(Math.random() * 12) + 5;
      if (progressVal > 85) progressVal = 85;
      updateLoadingProgress(progressVal, "Mengunduh Data Presensi Server...");
    }
  }, 120);

  const res = await apiCall("getInitialData");
  clearInterval(progressTimer);

  if (res && res.success) {
    updateLoadingProgress(90, "Memproses Data...");

    teachersData = res.guruList || [];
    attendanceLogs = res.attendanceLogs || [];
    izinLogs = res.izinLogs || [];

    if (res.config) {
      configJam = {
        jamMasuk: formatTimeOnly(res.config.jamMasuk, "07:00"),
        jamTerlambat: formatTimeOnly(res.config.jamTerlambat, "07:15"),
        jamPulang: formatTimeOnly(res.config.jamPulang, "15:00"),
      };
      const wInfo = `${configJam.jamMasuk} - ${configJam.jamPulang} WIB`;
      document.getElementById("workHoursDisplay").innerText = wInfo;
      document.getElementById("cfgJamMasuk").value = configJam.jamMasuk;
      document.getElementById("cfgJamTerlambat").value = configJam.jamTerlambat;
      document.getElementById("cfgJamPulang").value = configJam.jamPulang;

      if (document.getElementById("cfgAnnTitle")) {
        document.getElementById("cfgAnnTitle").value = res.config.annTitle || "";
        document.getElementById("cfgAnnContent").value = res.config.annContent || "";
        document.getElementById("cfgAnnImage").value = res.config.annImage || "";
        document.getElementById("cfgAnnActive").checked = res.config.annActive === "true";
        updateAnnouncementPreview();
      }
    }

    if (res.announcement && res.announcement.active) {
      const ann = res.announcement;
      if (ann.title) document.getElementById("announceTitle").innerText = ann.title;
      if (ann.content) document.getElementById("announceContent").innerText = ann.content;
      if (ann.image) {
        const imgEl = document.getElementById("announceImg");
        imgEl.src = ann.image;
        imgEl.classList.remove("hidden");
      }
      document.getElementById("announcementModal").classList.remove("hidden");
    }

    populateGuruDropdown();
    populateAdminFilterGuru();
    loadAdminGuruList();
    updateTeacherDashboardStats();
    updateAdminMonitoringStats();
    renderAdminRekapTable();
    renderAdminIzinApprovalTable();
    renderCalendar();
    renderProfile();
    updateFormProgress();

    updateLoadingProgress(100, "Selesai!");
    setTimeout(() => {
      hideLoadingOverlay();
      showToast("Data Realtime Server Berhasil Dimuat!", "success");
    }, 350);
  } else {
    updateLoadingProgress(100, "Gagal terhubung!");
    setTimeout(() => {
      hideLoadingOverlay();
      showToast("Gagal memuat data dari Server.", "error");
      populateGuruDropdown();
    }, 500);
  }
}

function closeAnnouncementModal() {
  document.getElementById("announcementModal").classList.add("hidden");
}

function refreshDataRealtime() {
  loadRealtimeData();
}

function populateGuruDropdown() {
  const select = document.getElementById("selectGuru");
  select.innerHTML = '<option value="">-- Pilih Nama Anda --</option>';

  if (teachersData.length === 0) {
    select.innerHTML = '<option value="">(Belum Ada Data Guru di Server)</option>';
    return;
  }

  teachersData.forEach((g) => {
    select.innerHTML += `<option value="${g.nama}">${g.nama} (${g.mapel || "Guru"})</option>`;
  });

  const savedName = localStorage.getItem("yppm_remembered_guru");
  if (savedName && teachersData.some((g) => g.nama === savedName)) {
    select.value = savedName;
    document.getElementById("rememberMe").checked = true;
    onSelectGuruChange(savedName);
  }
}

function populateAdminFilterGuru() {
  const select = document.getElementById("filterGuruSelect");
  if (!select) return;
  select.innerHTML = '<option value="ALL">-- Semua Guru --</option>';
  teachersData.forEach((g) => {
    select.innerHTML += `<option value="${g.nama}">${g.nama}</option>`;
  });
}

function toggleRememberMe(checked) {
  if (!checked) {
    localStorage.removeItem("yppm_remembered_guru");
  } else if (selectedGuru) {
    localStorage.setItem("yppm_remembered_guru", selectedGuru.nama);
  }
}

function onSelectGuruChange(nama) {
  selectedGuru = teachersData.find((g) => g.nama === nama) || null;

  if (selectedGuru) {
    document.getElementById("dashTeacherName").innerText = selectedGuru.nama;
    document.getElementById("headerTeacherName").innerText = selectedGuru.nama;
    document.getElementById("dashAvatar").src = selectedGuru.foto || "https://iili.io/KjIKMJ9.png";
    document.getElementById("formAvatar").src = selectedGuru.foto || "https://iili.io/KjIKMJ9.png";

    if (document.getElementById("rememberMe").checked) {
      localStorage.setItem("yppm_remembered_guru", selectedGuru.nama);
    }

    updateTeacherDashboardStats();
    renderCalendar();
    renderProfile();
  } else {
    document.getElementById("dashTeacherName").innerText = "Silakan Pilih Nama Guru";
    document.getElementById("headerTeacherName").innerText = "Pilih Guru";
    document.getElementById("dashStatusBadge").innerText = "Belum Ditemukan";
    document.getElementById("dashStatusBadge").className = "text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-700/60 text-slate-300 border border-slate-600 inline-block";
  }
  updateFormProgress();
}

function switchPhotoInputMode(mode) {
  photoInputMode = mode;
  const tabCam = document.getElementById("tabModeCamera");
  const tabUp = document.getElementById("tabModeUpload");
  const groupCam = document.getElementById("cameraControlGroup");
  const groupUp = document.getElementById("uploadControlGroup");
  const placeholderIcon = document.getElementById("photoPlaceholderIcon");
  const placeholderText = document.getElementById("photoPlaceholderText");

  if (mode === "camera") {
    tabCam.className = "px-2 py-0.5 rounded-md bg-white text-slate-800 shadow font-bold";
    tabUp.className = "px-2 py-0.5 rounded-md text-slate-600 font-bold";
    groupCam.classList.remove("hidden");
    groupUp.classList.add("hidden");
    placeholderIcon.innerText = "add_a_photo";
    placeholderText.innerText = "Kamera belum diaktifkan";
  } else {
    tabUp.className = "px-2 py-0.5 rounded-md bg-white text-slate-800 shadow font-bold";
    tabCam.className = "px-2 py-0.5 rounded-md text-slate-600 font-bold";
    groupUp.classList.remove("hidden");
    groupCam.classList.add("hidden");
    placeholderIcon.innerText = "cloud_upload";
    placeholderText.innerText = "Pilih file foto dari perangkat Anda";

    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      cameraStream = null;
    }
    document.getElementById("cameraVideo").classList.add("hidden");
  }
}

function handleManualPhotoUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    showToast("File yang dipilih harus berupa gambar!", "error");
    return;
  }

  const reader = new FileReader();
  reader.onload = function (e) {
    const img = new Image();
    img.onload = function () {
      const canvas = document.createElement("canvas");
      const maxW = 640;
      const maxH = 480;
      let w = img.width;
      let h = img.height;

      if (w > maxW || h > maxH) {
        const ratio = Math.min(maxW / w, maxH / h);
        w = Math.round(w * ratio);
        h = Math.round(h * ratio);
      }

      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, w, h);

      photoBase64 = canvas.toDataURL("image/jpeg", 0.8);

      const imgPreview = document.getElementById("photoPreview");
      imgPreview.src = photoBase64;
      imgPreview.classList.remove("hidden");
      document.getElementById("cameraPlaceholder").classList.add("hidden");
      document.getElementById("uploadControlGroup").classList.add("hidden");
      document.getElementById("btnResetPhoto").classList.remove("hidden");

      showToast("Foto bukti berhasil dimuat!", "success");
      updateFormProgress();
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function uploadTeacherProfilePhoto(event) {
  if (!selectedGuru) {
    showToast("Pilih nama guru terlebih dahulu!", "warning");
    return;
  }

  const file = event.target.files[0];
  if (!file) return;

  showToast("Memproses foto profil guru...", "info");
  const reader = new FileReader();
  reader.onload = function (e) {
    const img = new Image();
    img.onload = async function () {
      const canvas = document.createElement("canvas");
      const maxW = 400;
      const maxH = 400;
      let w = img.width;
      let h = img.height;

      if (w > maxW || h > maxH) {
        const ratio = Math.min(maxW / w, maxH / h);
        w = Math.round(w * ratio);
        h = Math.round(h * ratio);
      }

      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, w, h);

      const fotoBase64 = canvas.toDataURL("image/jpeg", 0.85);

      showToast("Mengunggah foto profil ke Server...", "info");
      const res = await apiCall("updateGuruFoto", { nama: selectedGuru.nama, foto: fotoBase64 });
      if (res && res.success) {
        showToast("Foto Profil Guru Berhasil Diperbarui!", "success");
        selectedGuru.foto = fotoBase64;
        document.getElementById("profileAvatar").src = fotoBase64;
        document.getElementById("dashAvatar").src = fotoBase64;
        document.getElementById("formAvatar").src = fotoBase64;
        loadRealtimeData();
      } else {
        showToast(res.message || "Gagal mengunggah foto profil.", "error");
      }
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function updateFormProgress() {
  let score = 0;

  const setBadgeState = (stepNum, active) => {
    const badge = document.getElementById(`stepBadge${stepNum}`);
    const lbl = document.getElementById(`stepLbl${stepNum}`);
    if (active) {
      if (badge) badge.className = "w-6 h-6 rounded-full bg-emerald-600 text-white font-extrabold text-[11px] flex items-center justify-center transition-colors shadow-sm";
      if (lbl) lbl.className = "text-[10px] font-bold text-emerald-700 truncate w-full";
    } else {
      if (badge) badge.className = "w-6 h-6 rounded-full bg-slate-200 text-slate-600 font-extrabold text-[11px] flex items-center justify-center transition-colors";
      if (lbl) lbl.className = "text-[10px] font-bold text-slate-400 truncate w-full";
    }
  };

  if (selectedGuru) {
    score += 25;
    setBadgeState(1, true);
  } else {
    setBadgeState(1, false);
  }

  if (currentAttendanceStatus) {
    if (currentAttendanceStatus === "Izin") {
      const note = document.getElementById("izinNote").value.trim();
      if (note) score += 25;
      else score += 15;
    } else {
      score += 25;
    }
    setBadgeState(2, true);
  } else {
    setBadgeState(2, false);
  }

  let step3Score = 0;
  if (photoBase64 || currentAttendanceStatus === "Izin") step3Score += 15;
  if (currentGeoLocation.lat !== null) step3Score += 10;
  score += step3Score;

  if (step3Score >= 15) {
    setBadgeState(3, true);
  } else {
    setBadgeState(3, false);
  }

  if (score >= 75) {
    setBadgeState(4, true);
  } else {
    setBadgeState(4, false);
  }

  const bar = document.getElementById("stepProgressBar");
  const txt = document.getElementById("stepProgressText");

  if (bar) {
    bar.style.width = `${score}%`;
    if (score >= 90) {
      bar.className = "bg-emerald-600 h-full rounded-full transition-all duration-300";
    } else if (score >= 50) {
      bar.className = "bg-amber-500 h-full rounded-full transition-all duration-300";
    } else {
      bar.className = "bg-slate-400 h-full rounded-full transition-all duration-300";
    }
  }

  if (txt) {
    txt.innerText = `${score}% ${score >= 90 ? " (Siap Kirim!)" : " Selesai"}`;
    if (score >= 90) {
      txt.className = "text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300";
    } else {
      txt.className = "text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200";
    }
  }
}

function isSameDay(date1, date2) {
  const key1 = parseToDateKey(date1);
  const key2 = parseToDateKey(date2);
  return key1 !== "" && key1 === key2;
}

function updateTeacherDashboardStats() {
  if (!selectedGuru) {
    document.getElementById("statHadir").innerText = "0";
    document.getElementById("statTelat").innerText = "0";
    document.getElementById("statIzin").innerText = "0";
    document.getElementById("statAlpha").innerText = "0";
    document.getElementById("dashTimeIn").innerText = "--:--";
    document.getElementById("dashTimeOut").innerText = "--:--";
    return;
  }

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  document.getElementById("statMonthLabel").innerText = now.toLocaleDateString("id-ID", { month: "long", year: "numeric" });

  const selectedNameTrim = selectedGuru.nama.trim();
  const myLogs = attendanceLogs.filter((log) => log.guruNama && log.guruNama.trim() === selectedNameTrim);
  const myIzin = izinLogs.filter((iz) => iz.guruNama && iz.guruNama.trim() === selectedNameTrim);

  const todayLogs = myLogs.filter((log) => isSameDay(log.waktu, now));
  const masukLog = todayLogs.find((l) => l.status === "Masuk");
  const pulangLog = todayLogs.find((l) => l.status === "Pulang");

  if (masukLog) {
    const timeIn = formatTimeOnly(masukLog.waktu);
    document.getElementById("dashTimeIn").innerText = timeIn;
    document.getElementById("dashStatusBadge").innerText = "Sudah Absen Masuk";
    document.getElementById("dashStatusBadge").className = "text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 inline-block";
  } else {
    document.getElementById("dashTimeIn").innerText = "--:--";
    document.getElementById("dashStatusBadge").innerText = "Belum Absen Masuk";
    document.getElementById("dashStatusBadge").className = "text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 inline-block";
  }

  if (pulangLog) {
    const timeOut = formatTimeOnly(pulangLog.waktu);
    document.getElementById("dashTimeOut").innerText = timeOut;
  } else {
    document.getElementById("dashTimeOut").innerText = "--:--";
  }

  let countHadir = 0;
  let countTelat = 0;
  let countIzin = 0;

  const dateLogsMap = {};
  myLogs.forEach((log) => {
    const d = new Date(log.waktu);
    if (!isNaN(d.getTime()) && d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
      const key = parseToDateKey(d);
      if (!dateLogsMap[key]) dateLogsMap[key] = [];
      dateLogsMap[key].push(log);
    }
  });

  Object.keys(dateLogsMap).forEach((key) => {
    const logs = dateLogsMap[key];
    const mLog = logs.find((l) => l.status === "Masuk");
    if (mLog) {
      const timeStr = formatTimeOnly(mLog.waktu);
      if (timeStr > configJam.jamTerlambat) {
        countTelat++;
      } else {
        countHadir++;
      }
    }
  });

  myIzin.forEach((iz) => {
    const startKey = parseToDateKey(iz.startDate || iz.waktu);
    if (startKey) {
      const d = new Date(startKey);
      if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
        countIzin++;
      }
    }
  });

  let countAlpha = 0;
  const daysInMonthSoFar = now.getDate();
  for (let day = 1; day < daysInMonthSoFar; day++) {
    const checkDate = new Date(currentYear, currentMonth, day);
    const dayOfWeek = checkDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      const key = parseToDateKey(checkDate);
      const isIzinDay = myIzin.some((i) => {
        const s = parseToDateKey(i.startDate);
        const e = parseToDateKey(i.endDate);
        return key >= s && key <= e;
      });
      if (!dateLogsMap[key] && !isIzinDay) {
        countAlpha++;
      }
    }
  }

  document.getElementById("statHadir").innerText = countHadir;
  document.getElementById("statTelat").innerText = countTelat;
  document.getElementById("statIzin").innerText = countIzin;
  document.getElementById("statAlpha").innerText = countAlpha;
}

function updateAdminMonitoringStats() {
  const now = new Date();
  const todayLogs = attendanceLogs.filter((l) => isSameDay(l.waktu, now));
  const todayStr = parseToDateKey(now);
  const todayIzin = izinLogs.filter((i) => {
    const s = parseToDateKey(i.startDate);
    const e = parseToDateKey(i.endDate);
    return todayStr >= s && todayStr <= e;
  });

  const masukSet = new Set();
  let countTelatToday = 0;

  todayLogs.forEach((l) => {
    if (l.status === "Masuk") {
      masukSet.add(l.guruNama.trim());
      const timeStr = formatTimeOnly(l.waktu);
      if (timeStr > configJam.jamTerlambat) {
        countTelatToday++;
      }
    }
  });

  document.getElementById("admTotalGuru").innerText = teachersData.length;
  document.getElementById("admHadirToday").innerText = masukSet.size;
  document.getElementById("admTelatToday").innerText = countTelatToday;
  document.getElementById("admIzinToday").innerText = todayIzin.length;
}

function setAttendanceStatus(status) {
  currentAttendanceStatus = status;
  const btns = {
    Masuk: document.getElementById("btnStatMasuk"),
    Pulang: document.getElementById("btnStatPulang"),
    Izin: document.getElementById("btnStatIzin"),
  };

  Object.keys(btns).forEach((key) => {
    if (key === status) {
      btns[key].className = "py-2.5 rounded-xl border text-xs font-bold transition flex flex-col items-center justify-center space-y-1 bg-emerald-600 text-white border-emerald-600 shadow";
    } else {
      btns[key].className = "py-2.5 rounded-xl border text-xs font-bold transition flex flex-col items-center justify-center space-y-1 bg-white text-slate-600 border-slate-200";
    }
  });

  const izinSection = document.getElementById("izinFormSection");
  const btnSubmitText = document.getElementById("btnSubmitText");

  if (status === "Izin") {
    izinSection.classList.remove("hidden");
    btnSubmitText.innerText = "KIRIM PENGAJUAN IZIN KE SERVER";
  } else {
    izinSection.classList.add("hidden");
    btnSubmitText.innerText = "KIRIM PRESENSI KE SERVER";
  }

  updateFormProgress();
}

async function startCamera() {
  const video = document.getElementById("cameraVideo");
  const placeholder = document.getElementById("cameraPlaceholder");
  const facingMode = currentAttendanceStatus === "Izin" ? "environment" : "user";

  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: facingMode, width: { ideal: 640 }, height: { ideal: 480 } },
      audio: false,
    });
    video.srcObject = cameraStream;
    video.classList.remove("hidden");
    placeholder.classList.add("hidden");
    document.getElementById("btnTakePhoto").disabled = false;
    document.getElementById("btnTakePhoto").classList.remove("opacity-50", "cursor-not-allowed");
  } catch (err) {
    showToast("Izin kamera ditolak atau kamera tidak aktif!", "error");
  }
}

function takePhoto() {
  const video = document.getElementById("cameraVideo");
  const canvas = document.getElementById("cameraCanvas");
  const imgPreview = document.getElementById("photoPreview");

  canvas.width = video.videoWidth || 640;
  canvas.height = video.videoHeight || 480;
  const ctx = canvas.getContext("2d");

  ctx.save();
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  ctx.restore();

  photoBase64 = canvas.toDataURL("image/jpeg", 0.8);
  imgPreview.src = photoBase64;

  video.classList.add("hidden");
  imgPreview.classList.remove("hidden");

  if (cameraStream) {
    cameraStream.getTracks().forEach((track) => track.stop());
    cameraStream = null;
  }

  document.getElementById("cameraControlGroup").classList.add("hidden");
  document.getElementById("btnResetPhoto").classList.remove("hidden");
  showToast("Foto presensi siap dikirim", "success");
  updateFormProgress();
}

function resetPhoto() {
  photoBase64 = null;
  document.getElementById("photoPreview").classList.add("hidden");
  document.getElementById("cameraPlaceholder").classList.remove("hidden");
  document.getElementById("btnResetPhoto").classList.add("hidden");

  if (photoInputMode === "camera") {
    document.getElementById("cameraControlGroup").classList.remove("hidden");
    document.getElementById("btnTakePhoto").disabled = true;
    document.getElementById("btnTakePhoto").classList.add("opacity-50", "cursor-not-allowed");
  } else {
    document.getElementById("uploadControlGroup").classList.remove("hidden");
    document.getElementById("manualPhotoInput").value = "";
  }
  updateFormProgress();
}

function getCurrentLocation() {
  const locAddress = document.getElementById("locAddress");
  const locCoords = document.getElementById("locCoords");
  const mapIframe = document.getElementById("mapIframe");

  locAddress.innerText = "Mengambil koordinat GPS...";

  if (!navigator.geolocation) {
    locAddress.innerText = "Geolocation tidak didukung browser ini.";
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      currentGeoLocation = { lat, lng, address: `Koordinat GPS (${lat.toFixed(5)}, ${lng.toFixed(5)})` };

      locCoords.innerText = `Lat: ${lat.toFixed(6)} | Lng: ${lng.toFixed(6)}`;
      mapIframe.src = `https://maps.google.com/maps?q=${lat},${lng}&z=17&output=embed`;

      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
        const data = await res.json();
        if (data && data.display_name) {
          currentGeoLocation.address = data.display_name;
          locAddress.innerText = data.display_name;
        }
      } catch (e) {
        locAddress.innerText = `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`;
      }
      updateFormProgress();
    },
    (err) => {
      locAddress.innerText = "Gagal membaca lokasi GPS. Pastikan izin lokasi aktif.";
      mapIframe.src = "about:blank";
      updateFormProgress();
    },
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
  );
}

function openConfirmationModal() {
  if (!selectedGuru) {
    showToast("Silakan pilih nama guru terlebih dahulu!", "warning");
    return;
  }
  if (!photoBase64 && currentAttendanceStatus !== "Izin") {
    showToast("Silakan ambil foto selfie atau unggah foto bukti!", "warning");
    return;
  }

  if (currentAttendanceStatus === "Izin") {
    const note = document.getElementById("izinNote").value;
    if (!note) {
      showToast("Tuliskan alasan pengajuan izin!", "warning");
      return;
    }
  }

  document.getElementById("cnfName").innerText = selectedGuru.nama;
  document.getElementById("cnfStatus").innerText = currentAttendanceStatus;
  document.getElementById("cnfTime").innerText = new Date().toLocaleTimeString("id-ID");
  document.getElementById("cnfLocation").innerText = currentGeoLocation.address;
  document.getElementById("cnfPhoto").src = photoBase64 || "https://iili.io/KjIKMJ9.png";

  document.getElementById("confirmModal").classList.remove("hidden");
}

function closeConfirmModal() {
  document.getElementById("confirmModal").classList.add("hidden");
}

async function processSubmitAbsence() {
  closeConfirmModal();

  if (currentAttendanceStatus === "Izin") {
    showToast("Mengirim pengajuan izin ke Server...", "info");
    const payload = {
      guruNama: selectedGuru.nama,
      jenis: document.getElementById("izinType").value,
      startDate: document.getElementById("izinStartDate").value,
      endDate: document.getElementById("izinEndDate").value,
      keterangan: document.getElementById("izinNote").value,
      approvalStatus: "Menunggu",
      waktu: new Date().toISOString(),
    };

    const res = await apiCall("submitIzin", payload);
    if (res && res.success) {
      showToast("Pengajuan Izin Berhasil Tersimpan di Server!", "success");
      document.getElementById("izinNote").value = "";
      resetPhoto();
      await loadRealtimeData();
      switchTab("dashboard");
    } else {
      showToast(res.message || "Gagal mengirim izin ke Server", "error");
    }
    return;
  }

  showToast("Mengirim presensi ke Server...", "info");
  const nowIso = new Date().toISOString();
  const payload = {
    guruNama: selectedGuru.nama,
    status: currentAttendanceStatus,
    foto: photoBase64,
    lat: currentGeoLocation.lat,
    lng: currentGeoLocation.lng,
    address: currentGeoLocation.address,
    waktu: nowIso,
  };

  const res = await apiCall("submitAbsence", payload);
  if (res && res.success) {
    showToast("Presensi Berhasil Disimpan di Server!", "success");
    resetPhoto();
    await loadRealtimeData();
    switchTab("dashboard");
  } else {
    showToast(res.message || "Gagal menyimpan ke Server", "error");
  }
}

function renderProfile() {
  if (selectedGuru) {
    document.getElementById("profileName").innerText = selectedGuru.nama;
    document.getElementById("profileNip").innerText = "NIP: " + (selectedGuru.nip || "-");
    document.getElementById("profileMapel").innerText = selectedGuru.mapel || "-";
    document.getElementById("profileStatus").innerText = selectedGuru.status || "GTY";
    document.getElementById("profileAvatar").src = selectedGuru.foto || "https://iili.io/KjIKMJ9.png";
  }

  const leaderboardList = document.getElementById("leaderboardList");
  if (!leaderboardList) return;

  if (teachersData.length === 0) {
    leaderboardList.innerHTML = `<p class="text-xs text-slate-400 text-center py-4">Belum ada data guru dari Server.</p>`;
    return;
  }

  const stats = teachersData.map((g) => {
    const logs = attendanceLogs.filter((l) => l.guruNama && l.guruNama.trim() === g.nama.trim() && l.status === "Masuk");

    let totalMinutes = 0;
    let validCount = 0;
    let earliestTimeStr = "23:59";

    logs.forEach((l) => {
      const timeStr = formatTimeOnly(l.waktu);
      if (timeStr && timeStr !== "--:--") {
        const parts = timeStr.split(":");
        const mins = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
        totalMinutes += mins;
        validCount++;

        if (timeStr < earliestTimeStr) {
          earliestTimeStr = timeStr;
        }
      }
    });

    const avgMinutes = validCount > 0 ? totalMinutes / validCount : 9999;

    const avgHours = Math.floor(avgMinutes / 60);
    const avgMinsRem = Math.round(avgMinutes % 60);
    const avgTimeDisplay = validCount > 0 ? `${String(avgHours).padStart(2, "0")}:${String(avgMinsRem).padStart(2, "0")} WIB` : "-";

    return {
      nama: g.nama,
      mapel: g.mapel || "Guru",
      foto: g.foto || "https://iili.io/KjIKMJ9.png",
      count: validCount,
      avgMinutes: avgMinutes,
      avgTimeDisplay: avgTimeDisplay,
      earliestTimeStr: earliestTimeStr !== "23:59" ? earliestTimeStr + " WIB" : "-",
    };
  });

  stats.sort((a, b) => {
    if (a.count === 0 && b.count === 0) return 0;
    if (a.count === 0) return 1;
    if (b.count === 0) return -1;
    return a.avgMinutes - b.avgMinutes;
  });

  leaderboardList.innerHTML = "";
  const badges = ["🥇", "🥈", "🥉"];

  stats.forEach((st, idx) => {
    const badgeSymbol = badges[idx] || `${idx + 1}.`;
    const isTop1 = idx === 0 && st.count > 0;

    leaderboardList.innerHTML += `
          <div class="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-3.5 ${isTop1 ? "bg-amber-50/90 border-2 border-amber-300 shadow-sm" : "bg-slate-50 border border-slate-200"} rounded-2xl transition hover:shadow-md gap-2">
            <div class="flex items-center space-x-3 min-w-0">
              <span class="text-sm sm:text-base font-extrabold flex-shrink-0 text-slate-700 w-5 text-center">${badgeSymbol}</span>
              <img src="${st.foto}" class="w-10 h-10 sm:w-11 sm:h-11 rounded-full border border-amber-400 object-cover bg-white flex-shrink-0 shadow-sm" />
              <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-center gap-1">
                  <span class="text-xs sm:text-sm font-bold text-slate-800 break-words leading-tight">${st.nama}</span>
                  ${isTop1 ? '<span class="text-[9px] font-black bg-amber-500 text-slate-900 px-2 py-0.5 rounded-full inline-block">Top 1 Paling Pagi</span>' : ""}
                </div>
                <p class="text-[10px] sm:text-xs text-slate-500 mt-0.5">Rata-rata Masuk: <strong class="text-emerald-700 font-bold">${st.avgTimeDisplay}</strong></p>
              </div>
            </div>
            
            <div class="flex sm:flex-col justify-between sm:justify-center items-end text-right border-t sm:border-t-0 pt-1.5 sm:pt-0 border-slate-200/60 flex-shrink-0 pl-8 sm:pl-0">
              <span class="text-xs font-bold text-slate-800 bg-slate-200/70 sm:bg-transparent px-2 py-0.5 sm:p-0 rounded-md sm:rounded-none">${st.count} Hari Hadir</span>
              <span class="text-[10px] text-slate-400">Paling Pagi: <strong class="text-slate-600 font-semibold">${st.earliestTimeStr}</strong></span>
            </div>
          </div>
        `;
  });
}

function changeCalMonth(delta) {
  calSelectedMonth += delta;
  if (calSelectedMonth < 0) {
    calSelectedMonth = 11;
    calSelectedYear--;
  } else if (calSelectedMonth > 11) {
    calSelectedMonth = 0;
    calSelectedYear++;
  }
  renderCalendar();
}

function renderCalendar() {
  const calMonthLabel = document.getElementById("calendarMonthLabel");
  const calendarGrid = document.getElementById("calendarGrid");
  if (!calendarGrid) return;

  const dateObj = new Date(calSelectedYear, calSelectedMonth, 1);
  const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  calMonthLabel.innerText = `${monthNames[calSelectedMonth]} ${calSelectedYear}`;

  calendarGrid.innerHTML = "";
  const firstDay = dateObj.getDay();
  const daysInMonth = new Date(calSelectedYear, calSelectedMonth + 1, 0).getDate();

  for (let i = 0; i < firstDay; i++) {
    calendarGrid.innerHTML += `<div class="h-10 sm:h-12 bg-slate-50/50 rounded-lg"></div>`;
  }

  const now = new Date();
  const selectedNameTrim = selectedGuru ? selectedGuru.nama.trim() : null;

  for (let day = 1; day <= daysInMonth; day++) {
    const currentDayObj = new Date(calSelectedYear, calSelectedMonth, day);
    const dateKey = parseToDateKey(currentDayObj);
    const dayOfWeek = currentDayObj.getDay();

    let statusClass = "bg-white border-slate-200 text-slate-700";
    let badgeDot = "";
    let badgeText = "";
    let timeInStr = "-";
    let timeOutStr = "-";
    let noteStr = "-";

    if (dayOfWeek === 0 || dayOfWeek === 6) {
      statusClass = "bg-sky-50 border-sky-200 text-sky-700 font-medium";
      badgeText = "Libur";
    }

    if (selectedNameTrim) {
      const dayLogs = attendanceLogs.filter((l) => l.guruNama && l.guruNama.trim() === selectedNameTrim && isSameDay(l.waktu, currentDayObj));

      const dayIzin = izinLogs.find((i) => {
        if (!i.guruNama || i.guruNama.trim() !== selectedNameTrim) return false;
        const startKey = parseToDateKey(i.startDate || i.waktu);
        const endKey = parseToDateKey(i.endDate || i.startDate || i.waktu);
        return dateKey >= startKey && dateKey <= endKey;
      });

      const masukLog = dayLogs.find((l) => l.status === "Masuk");
      const pulangLog = dayLogs.find((l) => l.status === "Pulang");

      if (masukLog) {
        timeInStr = formatTimeOnly(masukLog.waktu);
        if (pulangLog) timeOutStr = formatTimeOnly(pulangLog.waktu);

        if (timeInStr > configJam.jamTerlambat) {
          statusClass = "bg-amber-50 border-amber-300 text-amber-800 font-bold";
          badgeDot = `<span class="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>`;
          badgeText = "Telat (" + timeInStr + ")";
        } else {
          statusClass = "bg-emerald-50 border-emerald-300 text-emerald-800 font-bold";
          badgeDot = `<span class="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>`;
          badgeText = "Hadir (" + timeInStr + ")";
        }
      } else if (dayIzin) {
        statusClass = "bg-purple-50 border-purple-300 text-purple-800 font-bold";
        badgeDot = `<span class="w-2 h-2 rounded-full bg-brand-accentPurple inline-block"></span>`;
        badgeText = dayIzin.jenis || "Izin";
        noteStr = `${dayIzin.keterangan || "Pengajuan Izin Guru"} (${dayIzin.approvalStatus || "Menunggu"})`;
      } else if (currentDayObj < now && dayOfWeek !== 0 && dayOfWeek !== 6) {
        statusClass = "bg-rose-50 border-rose-200 text-rose-800 font-medium";
        badgeDot = `<span class="w-2 h-2 rounded-full bg-rose-500 inline-block"></span>`;
        badgeText = "Alpha";
      }
    }

    const isToday = isSameDay(currentDayObj, now);
    const todayBorder = isToday ? "ring-2 ring-brand-yellow shadow-md" : "";

    const cellHtml = `
            <div 
              onclick="showCalendarDateDetail('${dateKey}', '${badgeText || "Kosong"}', '${timeInStr}', '${timeOutStr}', '${noteStr}')"
              class="h-11 sm:h-14 p-1 rounded-xl border flex flex-col justify-between cursor-pointer transition hover:scale-105 ${statusClass} ${todayBorder}"
            >
              <div class="flex justify-between items-center text-[10px] sm:text-xs font-bold">
                <span>${day}</span>
                ${badgeDot}
              </div>
              <p class="text-[8px] sm:text-[10px] truncate leading-none opacity-90 font-semibold">${badgeText}</p>
            </div>
          `;

    calendarGrid.innerHTML += cellHtml;
  }
}

function showCalendarDateDetail(dateKey, status, timeIn, timeOut, note) {
  const card = document.getElementById("calDateDetailCard");
  if (!card) return;

  document.getElementById("calDetailDateStr").innerText = "Tanggal: " + formatOnlyDate(dateKey);
  document.getElementById("calDetailBadge").innerText = status;
  document.getElementById("calDetailIn").innerText = "Jam Masuk: " + timeIn;
  document.getElementById("calDetailOut").innerText = "Jam Pulang: " + timeOut;
  document.getElementById("calDetailNote").innerText = "Keterangan: " + note;

  card.classList.remove("hidden");
}

function toggleAdminModal() {
  const modal = document.getElementById("adminModal");
  modal.classList.toggle("hidden");
}

async function loginAdmin() {
  const pass = document.getElementById("adminPasswordInput").value.trim();
  if (!pass) {
    showToast("Masukkan password admin!", "warning");
    return;
  }

  showToast("Memverifikasi password admin ke Server...", "info");
  const res = await apiCall("verifyAdminPassword", { password: pass });

  if (res && res.success) {
    document.getElementById("adminLoginSection").classList.add("hidden");
    document.getElementById("adminContentSection").classList.remove("hidden");
    showToast("Berhasil masuk Dashboard Admin!", "success");
  } else {
    showToast(res.message || "Password Admin Tidak Valid!", "error");
  }
}

async function changeAdminPasswordSubmit() {
  const oldPass = document.getElementById("cfgOldAdminPassword").value.trim();
  const newPass = document.getElementById("cfgNewAdminPassword").value.trim();

  if (!oldPass || !newPass) {
    showToast("Isi password lama dan password baru!", "warning");
    return;
  }

  showToast("Memperbarui password admin di Server...", "info");
  const res = await apiCall("changeAdminPassword", { oldPassword: oldPass, newPassword: newPass });

  if (res && res.success) {
    showToast("Password Admin Berhasil Diperbarui di Server!", "success");
    document.getElementById("cfgOldAdminPassword").value = "";
    document.getElementById("cfgNewAdminPassword").value = "";
  } else {
    showToast(res.message || "Gagal mengubah password admin.", "error");
  }
}

function switchAdminTab(tab) {
  const tabs = ["rekap", "approval", "import", "guru", "jam", "pengumuman", "config"];
  tabs.forEach((t) => {
    const capName = t.charAt(0).toUpperCase() + t.slice(1);
    const el = document.getElementById(`admTab${capName}`);
    const btn = document.getElementById(`admTabBtn${capName}`);
    if (el) el.classList.add("hidden");
    if (btn) {
      btn.classList.remove("border-b-2", "border-brand-navy", "text-brand-navy");
      btn.classList.add("text-slate-400");
    }
  });

  const activeCap = tab.charAt(0).toUpperCase() + tab.slice(1);
  const activeEl = document.getElementById(`admTab${activeCap}`);
  const activeBtn = document.getElementById(`admTabBtn${activeCap}`);
  if (activeEl) activeEl.classList.remove("hidden");
  if (activeBtn) {
    activeBtn.classList.remove("text-slate-400");
    activeBtn.classList.add("border-b-2", "border-brand-navy", "text-brand-navy");
  }
}

function renderAdminRekapTable() {
  const tbody = document.getElementById("adminRekapTableBody");
  if (!tbody) return;

  const guruFilter = document.getElementById("filterGuruSelect").value;
  const statusFilter = document.getElementById("filterStatusSelect").value;
  const monthFilter = document.getElementById("filterMonthSelect").value;
  const yearFilter = parseInt(document.getElementById("filterYearInput").value, 10);

  let filtered = attendanceLogs.filter((log) => {
    if (guruFilter !== "ALL" && log.guruNama !== guruFilter) return false;

    const logTime = formatTimeOnly(log.waktu);
    if (statusFilter === "Masuk" && log.status !== "Masuk") return false;
    if (statusFilter === "Pulang" && log.status !== "Pulang") return false;
    if (statusFilter === "Terlambat" && (log.status !== "Masuk" || logTime <= configJam.jamTerlambat)) return false;

    const d = new Date(log.waktu);
    if (!isNaN(d.getTime())) {
      if (monthFilter !== "ALL" && d.getMonth() !== parseInt(monthFilter, 10)) return false;
      if (!isNaN(yearFilter) && d.getFullYear() !== yearFilter) return false;
    }

    return true;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="p-4 text-center text-slate-400">Tidak ada data rekap presensi yang sesuai filter.</td></tr>`;
    return;
  }

  tbody.innerHTML = "";
  filtered.forEach((log) => {
    const dateDisplay = formatOnlyDate(log.waktu);
    const timeDisplay = formatTimeOnly(log.waktu);
    const photoBtn = log.foto
      ? `<button onclick="showAdminPhotoModal('${log.foto}', '${log.guruNama}')" class="px-2.5 py-1 bg-brand-navy text-brand-yellow font-bold text-[10px] rounded-lg shadow">Lihat Foto</button>`
      : `<span class="text-slate-400 text-[10px]">-</span>`;

    tbody.innerHTML += `
            <tr class="border-b hover:bg-slate-50">
              <td class="p-2 font-semibold">${dateDisplay} ${timeDisplay}</td>
              <td class="p-2 font-bold text-slate-800">${log.guruNama}</td>
              <td class="p-2 font-bold">${log.status}</td>
              <td class="p-2 text-slate-600 truncate max-w-[150px]">${log.address || log.keterangan || "-"}</td>
              <td class="p-2 text-center">${photoBtn}</td>
              <td class="p-2 text-center">
                <button onclick="deleteRekapLogConfirm('${log.id || log.waktu}')" class="p-1 text-rose-600 hover:bg-rose-50 rounded">
                  <span class="material-symbols-outlined text-base">delete</span>
                </button>
              </td>
            </tr>
          `;
  });
}

function renderAdminIzinApprovalTable() {
  const tbody = document.getElementById("adminIzinTableBody");
  const badge = document.getElementById("pendingIzinBadge");
  if (!tbody) return;

  let pendingCount = 0;
  if (izinLogs.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="p-4 text-center text-slate-400">Belum ada data pengajuan izin guru.</td></tr>`;
    if (badge) badge.innerText = "0 Menunggu";
    return;
  }

  tbody.innerHTML = "";
  izinLogs.forEach((iz) => {
    if ((iz.approvalStatus || "Menunggu") === "Menunggu") pendingCount++;

    const dateDisplay = `${formatOnlyDate(iz.startDate || iz.waktu)} s/d ${formatOnlyDate(iz.endDate || iz.startDate || iz.waktu)}`;
    const statusBadge =
      iz.approvalStatus === "Disetujui"
        ? `<span class="text-emerald-700 bg-emerald-100 font-bold px-2 py-0.5 rounded-full">Disetujui</span>`
        : iz.approvalStatus === "Ditolak"
          ? `<span class="text-rose-700 bg-rose-100 font-bold px-2 py-0.5 rounded-full">Ditolak</span>`
          : `<span class="text-amber-700 bg-amber-100 font-bold px-2 py-0.5 rounded-full">Menunggu</span>`;

    tbody.innerHTML += `
            <tr class="border-b hover:bg-slate-50">
              <td class="p-2 font-bold text-slate-800">${iz.guruNama}</td>
              <td class="p-2 font-semibold text-purple-800">${iz.jenis || "Izin"}</td>
              <td class="p-2 font-medium text-slate-600">${dateDisplay}</td>
              <td class="p-2 text-slate-600 truncate max-w-[150px]">${iz.keterangan || "-"}</td>
              <td class="p-2 text-center">${statusBadge}</td>
              <td class="p-2 text-center">
                <div class="flex justify-center space-x-1">
                  <button onclick="approveIzin('${iz.id || iz.waktu}', 'Disetujui')" class="px-2 py-1 bg-emerald-600 text-white font-bold text-[10px] rounded-lg shadow hover:bg-emerald-700">Setuju</button>
                  <button onclick="approveIzin('${iz.id || iz.waktu}', 'Ditolak')" class="px-2 py-1 bg-rose-600 text-white font-bold text-[10px] rounded-lg shadow hover:bg-rose-700">Tolak</button>
                </div>
              </td>
            </tr>
          `;
  });

  if (badge) badge.innerText = `${pendingCount} Menunggu`;
}

async function approveIzin(id, status) {
  showToast("Memproses status persetujuan izin...", "info");
  const res = await apiCall("approveIzin", { id, status });
  if (res && res.success) {
    showToast(`Pengajuan Izin Berhasil ${status}!`, "success");
    loadRealtimeData();
  } else {
    showToast(res.message || "Gagal memperbarui status izin.", "error");
  }
}

function getBase64ImageFromUrl(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        const dataURL = canvas.toDataURL("image/jpeg");
        resolve({ dataURL, width: img.width, height: img.height });
      } catch (e) {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

async function exportDataPDF() {
  if (!window.jspdf || !window.jspdf.jsPDF) {
    showToast("Library PDF belum siap, silakan coba beberapa saat lagi.", "warning");
    return;
  }

  showToast("Menyiapkan dokumen PDF...", "info");

  // Ambil data sesuai filter Admin (Per Guru, Per Bulan, Per Tahun, Per Status)
  const guruFilter = document.getElementById("filterGuruSelect").value;
  const statusFilter = document.getElementById("filterStatusSelect").value;
  const monthFilter = document.getElementById("filterMonthSelect").value;
  const yearFilter = parseInt(document.getElementById("filterYearInput").value, 10);

  const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

  let filteredLogs = attendanceLogs.filter((log) => {
    if (guruFilter !== "ALL" && log.guruNama !== guruFilter) return false;

    const logTime = formatTimeOnly(log.waktu);
    if (statusFilter === "Masuk" && log.status !== "Masuk") return false;
    if (statusFilter === "Pulang" && log.status !== "Pulang") return false;
    if (statusFilter === "Terlambat" && (log.status !== "Masuk" || logTime <= configJam.jamTerlambat)) return false;

    const d = new Date(log.waktu);
    if (!isNaN(d.getTime())) {
      if (monthFilter !== "ALL" && d.getMonth() !== parseInt(monthFilter, 10)) return false;
      if (!isNaN(yearFilter) && d.getFullYear() !== yearFilter) return false;
    }

    return true;
  });

  let filteredIzin = izinLogs.filter((iz) => {
    if (guruFilter !== "ALL" && iz.guruNama !== guruFilter) return false;
    const d = new Date(iz.startDate || iz.waktu);
    if (!isNaN(d.getTime())) {
      if (monthFilter !== "ALL" && d.getMonth() !== parseInt(monthFilter, 10)) return false;
      if (!isNaN(yearFilter) && d.getFullYear() !== yearFilter) return false;
    }
    return true;
  });

  if (filteredLogs.length === 0 && filteredIzin.length === 0) {
    showToast("Tidak ada data presensi atau izin yang sesuai filter untuk diexport!", "warning");
    return;
  }

  // Gabungkan Data Presensi & Data Izin ke dalam 1 Array Terpadu
  let combinedRecords = [];

  filteredLogs.forEach((l) => {
    const dt = new Date(l.waktu);
    combinedRecords.push({
      timestamp: !isNaN(dt.getTime()) ? dt.getTime() : 0,
      tanggal: formatOnlyDate(l.waktu),
      jam: formatTimeOnly(l.waktu),
      guruNama: l.guruNama,
      status: l.status,
      keterangan: l.address || l.keterangan || "-",
    });
  });

  filteredIzin.forEach((iz) => {
    const dt = new Date(iz.startDate || iz.waktu);
    const tglRange =
      iz.endDate && parseToDateKey(iz.endDate) !== parseToDateKey(iz.startDate || iz.waktu)
        ? `${formatOnlyDate(iz.startDate || iz.waktu)} s/d ${formatOnlyDate(iz.endDate)}`
        : formatOnlyDate(iz.startDate || iz.waktu);

    combinedRecords.push({
      timestamp: !isNaN(dt.getTime()) ? dt.getTime() : 0,
      tanggal: tglRange,
      jam: "-",
      guruNama: iz.guruNama,
      status: `Izin (${iz.jenis || "Izin"})`,
      keterangan: `${iz.keterangan || "Pengajuan Izin"} [${iz.approvalStatus || "Menunggu"}]`,
    });
  });

  // Urutkan data secara kronologis (dari tanggal terkecil / tanggal 1 dst)
  combinedRecords.sort((a, b) => a.timestamp - b.timestamp);

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  // 1. Kop Surat Resmi Sekolah
  const kopUrl = "https://i.ibb.co.com/gNc40z0/KOP-SURAT-page-0001.jpg";
  let startY = 15;

  try {
    const kopImgData = await getBase64ImageFromUrl(kopUrl);
    if (kopImgData) {
      const kopWidth = 190;
      const kopHeight = kopWidth * (kopImgData.height / kopImgData.width);
      doc.addImage(kopImgData.dataURL, "JPEG", 10, 8, kopWidth, kopHeight);
      startY = 12 + kopHeight;
    } else {
      startY = 20;
    }
  } catch (e) {
    startY = 20;
  }

  // 2. Judul Laporan PDF
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text("LAPORAN REKAPITULASI PRESENSI & IZIN GURU", 105, startY, { align: "center" });
  startY += 8;

  // 3. Kotak Identitas (Nama, Bulan, Total Absen & Izin)
  const namaDisplay = guruFilter !== "ALL" ? guruFilter : "Semua Guru";
  const bulanDisplay = monthFilter !== "ALL" ? `${monthNames[parseInt(monthFilter, 10)]} ${yearFilter || ""}` : `Semua Bulan ${yearFilter || ""}`;
  const totalAbsen = combinedRecords.length;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(10, startY, 190, 24, 2, 2, "FD");

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(51, 65, 85);
  doc.text("IDENTITAS REKAPITULASI", 14, startY + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text(`Nama Guru     : ${namaDisplay}`, 14, startY + 12);
  doc.text(`Bulan          : ${bulanDisplay}`, 14, startY + 17);
  doc.text(`Total Record   : ${totalAbsen} Catatan (Presensi & Izin)`, 14, startY + 22);

  startY += 29;

  // 4. Tabel Presensi & Izin Guru
  const tableBody = combinedRecords.map((r, index) => [index + 1, r.tanggal, r.jam, r.guruNama, r.status, r.keterangan]);

  doc.autoTable({
    startY: startY,
    head: [["No", "Tanggal", "Jam", "Nama Guru", "Status", "Lokasi / Keterangan"]],
    body: tableBody,
    styles: { fontSize: 8, cellPadding: 2.5 },
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: "bold", halign: "center" },
    columnStyles: {
      0: { halign: "center", cellWidth: 10 },
      1: { halign: "center", cellWidth: 32 },
      2: { halign: "center", cellWidth: 18 },
      3: { cellWidth: 42 },
      4: { halign: "center", cellWidth: 28 },
      5: { cellWidth: "auto" },
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 10, right: 10 },
  });

  // 5. Ringkasan di Akhir (Total Masuk, Pulang, dan Izin)
  let finalY = doc.lastAutoTable.finalY + 8;
  const pageHeight = doc.internal.pageSize.height;

  if (finalY + 35 > pageHeight) {
    doc.addPage();
    finalY = 20;
  }

  const totalMasuk = combinedRecords.filter((r) => r.status === "Masuk").length;
  const totalPulang = combinedRecords.filter((r) => r.status === "Pulang").length;
  const totalIzin = combinedRecords.filter((r) => r.status.startsWith("Izin")).length;

  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(148, 163, 184);
  doc.roundedRect(10, finalY, 190, 28, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text("RINGKASAN TOTAL PRESENSI & IZIN", 14, finalY + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text(`• Total Masuk  : ${totalMasuk} Kali`, 14, finalY + 13);
  doc.text(`• Total Pulang : ${totalPulang} Kali`, 14, finalY + 19);
  doc.text(`• Total Izin    : ${totalIzin} Kali`, 14, finalY + 25);

  // Footer Halaman
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Halaman ${i} dari ${totalPages}`, 200, 290, { align: "right" });
  }

  const filenameGuru = guruFilter !== "ALL" ? guruFilter.replace(/\s+/g, "_") : "Semua_Guru";
  doc.save(`Laporan_Presensi_${filenameGuru}_${new Date().toISOString().split("T")[0]}.pdf`);
  showToast("File PDF Berhasil Dihasilkan!", "success");
}

function downloadExcelTemplate() {
  const sampleData = [
    { Tanggal: "2026-08-10", Jam: "06:45", NamaGuru: "Gina", Status: "Masuk", Keterangan: "Hadir Tepat Waktu" },
    { Tanggal: "2026-08-10", Jam: "15:00", NamaGuru: "Gina", Status: "Pulang", Keterangan: "Selesai Mengajar" },
    { Tanggal: "2026-08-10", Jam: "06:50", NamaGuru: "Budi Santoso", Status: "Masuk", Keterangan: "Hadir Mengajar" },
  ];
  // Retained for import template if needed
}

function processExcelUpload() {
  const fileInput = document.getElementById("excelFileInput");
  if (!fileInput || !fileInput.files[0]) {
    showToast("Pilih file Excel terlebih dahulu!", "warning");
    return;
  }

  const file = fileInput.files[0];
  const reader = new FileReader();

  reader.onload = async (e) => {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const json = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

      if (!json || json.length === 0) {
        showToast("File Excel kosong atau format tidak sesuai!", "error");
        return;
      }

      showToast(`Mengimpor ${json.length} data presensi ke Server...`, "info");
      const res = await apiCall("importLogs", { logs: json });

      if (res && res.success) {
        showToast("Import Data Excel Berhasil Ditambahkan ke Server!", "success");
        fileInput.value = "";
        loadRealtimeData();
      } else {
        showToast(res.message || "Gagal mengimpor data ke Server.", "error");
      }
    } catch (err) {
      showToast("Gagal membaca struktur file Excel.", "error");
    }
  };

  reader.readAsArrayBuffer(file);
}

function loadAdminGuruList() {
  const tbody = document.getElementById("adminGuruTableBody");
  if (!tbody) return;

  if (teachersData.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="p-3 text-center text-slate-400">Belum ada data guru.</td></tr>`;
    return;
  }

  tbody.innerHTML = "";
  teachersData.forEach((g) => {
    const fotoImg = g.foto
      ? `<img src="${g.foto}" class="w-8 h-8 rounded-full border mx-auto object-cover bg-white shadow-sm" />`
      : `<span class="material-symbols-outlined text-slate-400 text-base">account_circle</span>`;

    const downloadBtn = g.foto
      ? `<button onclick="downloadTeacherPhoto('${g.nama}', '${g.foto}')" title="Unduh Foto Profil Guru" class="p-1 text-emerald-600 hover:bg-emerald-50 rounded">
                <span class="material-symbols-outlined text-base">download</span>
               </button>`
      : "";

    tbody.innerHTML += `
            <tr class="border-b hover:bg-slate-50">
              <td class="p-2 text-center">${fotoImg}</td>
              <td class="p-2 font-bold text-slate-800">${g.nama}</td>
              <td class="p-2 text-slate-600">${g.mapel || "Guru"} (${g.status || "GTY"})</td>
              <td class="p-2 text-center">
                <div class="flex justify-center space-x-1">
                  ${downloadBtn}
                  <button onclick="deleteGuruConfirm('${g.nama}')" title="Hapus Guru" class="p-1 text-rose-600 hover:bg-rose-50 rounded">
                    <span class="material-symbols-outlined text-base">delete</span>
                  </button>
                </div>
              </td>
            </tr>
          `;
  });
}

function updateAnnouncementPreview() {
  const url = document.getElementById("cfgAnnImage").value.trim();
  const imgEl = document.getElementById("cfgAnnImgPreview");
  const placeholder = document.getElementById("cfgAnnImgPlaceholder");
  if (!imgEl) return;

  if (url) {
    imgEl.src = url;
    imgEl.classList.remove("hidden");
    if (placeholder) placeholder.classList.add("hidden");
  } else {
    imgEl.classList.add("hidden");
    if (placeholder) placeholder.classList.remove("hidden");
  }
}

let currentAdminPhotoSrc = "";
let currentAdminPhotoTitle = "";

function showAdminPhotoModal(photoUrl, title) {
  currentAdminPhotoSrc = photoUrl;
  currentAdminPhotoTitle = title || "Foto_Presensi";
  document.getElementById("admPhotoTitle").innerText = title ? `Foto Selfie - ${title}` : "Foto Bukti Selfie Presensi";
  document.getElementById("admPhotoImg").src = photoUrl;
  document.getElementById("adminPhotoModal").classList.remove("hidden");
}

function closeAdminPhotoModal() {
  document.getElementById("adminPhotoModal").classList.add("hidden");
}

function downloadCurrentAdminPhoto() {
  if (!currentAdminPhotoSrc) {
    showToast("Tidak ada foto untuk diunduh.", "warning");
    return;
  }
  downloadTeacherPhoto(currentAdminPhotoTitle, currentAdminPhotoSrc);
}

function downloadTeacherPhoto(guruNama, photoSrc) {
  if (!photoSrc) {
    showToast("Foto tidak tersedia.", "warning");
    return;
  }
  const cleanName = (guruNama || "Foto").replace(/[^a-zA-Z0-9_-]/g, "_");
  const filename = `Foto_${cleanName}_${new Date().toISOString().split("T")[0]}.jpg`;

  const link = document.createElement("a");
  link.href = photoSrc;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast(`Foto ${guruNama} berhasil diunduh!`, "success");
}

function handleNewTeacherPhotoSelect(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    const img = new Image();
    img.onload = function () {
      const canvas = document.createElement("canvas");
      const maxW = 400;
      const maxH = 400;
      let w = img.width;
      let h = img.height;

      if (w > maxW || h > maxH) {
        const ratio = Math.min(maxW / w, maxH / h);
        w = Math.round(w * ratio);
        h = Math.round(h * ratio);
      }

      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, w, h);

      const fotoBase64 = canvas.toDataURL("image/jpeg", 0.85);
      document.getElementById("addGuruFotoBase64").value = fotoBase64;
      showToast("Foto profil guru siap disimpan!", "info");
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

async function addGuruSubmit() {
  const nama = document.getElementById("addGuruNama").value.trim();
  const nip = document.getElementById("addGuruNip").value.trim();
  const mapel = document.getElementById("addGuruMapel").value.trim();
  const status = document.getElementById("addGuruStatus").value;
  const fotoBase64 = document.getElementById("addGuruFotoBase64").value;

  if (!nama) {
    showToast("Isi nama lengkap guru!", "warning");
    return;
  }

  showToast("Menambahkan guru & foto profil ke Server...", "info");
  const res = await apiCall("addGuru", { nama, nip, mapel, status, foto: fotoBase64 || "https://iili.io/KjIKMJ9.png" });
  if (res && res.success) {
    showToast("Guru Baru Berhasil Ditambahkan ke Server!", "success");
    document.getElementById("addGuruNama").value = "";
    document.getElementById("addGuruNip").value = "";
    document.getElementById("addGuruMapel").value = "";
    document.getElementById("addGuruFotoInput").value = "";
    document.getElementById("addGuruFotoBase64").value = "";
    loadRealtimeData();
  } else {
    showToast(res.message || "Gagal menyimpan data guru.", "error");
  }
}

function deleteGuruConfirm(nama) {
  showCustomConfirm("Hapus Guru", `Apakah Anda yakin ingin menghapus data guru ${nama} dari Server?`, async () => {
    showToast("Menghapus guru dari Server...", "info");
    const res = await apiCall("deleteGuru", { nama });
    if (res && res.success) {
      showToast("Data Guru Berhasil Dihapus dari Server!", "success");
      loadRealtimeData();
    } else {
      showToast(res.message || "Gagal menghapus guru.", "error");
    }
  });
}

async function saveConfigJam() {
  const jamMasuk = document.getElementById("cfgJamMasuk").value;
  const jamTerlambat = document.getElementById("cfgJamTerlambat").value;
  const jamPulang = document.getElementById("cfgJamPulang").value;

  showToast("Menyimpan pengaturan jam kerja...", "info");
  const res = await apiCall("saveConfigJam", { jamMasuk, jamTerlambat, jamPulang });
  if (res && res.success) {
    showToast("Pengaturan Jam Kerja Berhasil Disimpan di Server!", "success");
    loadRealtimeData();
  } else {
    showToast(res.message || "Gagal menyimpan jam kerja.", "error");
  }
}

async function saveAnnouncementConfig() {
  const title = document.getElementById("cfgAnnTitle").value.trim();
  const content = document.getElementById("cfgAnnContent").value.trim();
  const image = document.getElementById("cfgAnnImage").value.trim();
  const active = document.getElementById("cfgAnnActive").checked;

  showToast("Menyimpan banner pengumuman...", "info");
  const res = await apiCall("saveAnnouncement", { title, content, image, active });
  if (res && res.success) {
    showToast("Banner Pengumuman Berhasil Disimpan di Server!", "success");
    loadRealtimeData();
  } else {
    showToast(res.message || "Gagal menyimpan pengumuman.", "error");
  }
}

function saveGasUrlConfig() {
  const url = document.getElementById("gasUrlInput").value.trim();
  if (url) {
    gasUrl = url;
    localStorage.setItem("yppm_gas_url", gasUrl);
    showToast("URL Backend Server Berhasil Disimpan!", "success");
    loadRealtimeData();
  }
}

function showAdminPhotoModal(photoUrl, title) {
  document.getElementById("admPhotoTitle").innerText = title ? `Foto Selfie - ${title}` : "Foto Bukti Selfie Presensi";
  document.getElementById("admPhotoImg").src = photoUrl;
  document.getElementById("adminPhotoModal").classList.remove("hidden");
}

function closeAdminPhotoModal() {
  document.getElementById("adminPhotoModal").classList.add("hidden");
}

function clearRekapDataConfirm() {
  showCustomConfirm("Kosongkan Rekap Server", "PERINGATAN: Seluruh data riwayat presensi di Server akan dihapus permanen. Lanjutkan?", async () => {
    showToast("Mengosongkan rekap server...", "info");
    const res = await apiCall("clearRekapData");
    if (res && res.success) {
      showToast("Seluruh Rekap Presensi Berhasil Dikosongkan dari Server!", "success");
      loadRealtimeData();
    } else {
      showToast(res.message || "Gagal mengosongkan rekap.", "error");
    }
  });
}

function deleteRekapLogConfirm(logId) {
  showCustomConfirm("Hapus Presensi", "Apakah Anda yakin ingin menghapus data presensi ini dari Server?", async () => {
    showToast("Menghapus baris presensi dari Server...", "info");
    const res = await apiCall("deleteRekapLog", { id: logId });
    if (res && res.success) {
      showToast("Baris Presensi Berhasil Dihapus dari Server!", "success");
      loadRealtimeData();
    } else {
      showToast(res.message || "Gagal menghapus baris presensi.", "error");
    }
  });
}
