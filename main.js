let gasUrl = localStorage.getItem("yppm_gas_url") || "https://script.google.com/macros/s/AKfycbwjY2W2GYkTK2c4iOvY9dn0tc05UTPz75bj6qj8VNRakATtzqBjM_BF75ffTGU3ZXkd/exec";

let teachersData = [];
let attendanceLogs = [];
let izinLogs = [];
let selectedGuru = null;
let currentAttendanceStatus = "Masuk";
let currentGeoLocation = { lat: null, lng: null, address: "Lokasi belum didapatkan" };
let photoBase64 = null;
let cameraStream = null;
let deferredPrompt = null;
let configJam = { jamMasuk: "07:00", jamTerlambat: "07:15", jamPulang: "15:00" };

let calSelectedYear = new Date().getFullYear();
let calSelectedMonth = new Date().getMonth();

// HELPER: Format tanggal rapi dari string ISO/Date/GMT menjadi DD MMM YYYY (misal: 07 Agu 2026)
function formatOnlyDate(dateVal) {
  if (!dateVal) return "-";
  let d;
  if (typeof dateVal === "string") {
    const trimmed = dateVal.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const parts = trimmed.split("-");
      d = new Date(parts[0], parts[1] - 1, parts[2]);
    } else {
      d = new Date(trimmed);
    }
  } else {
    d = new Date(dateVal);
  }

  if (isNaN(d.getTime())) return String(dateVal);

  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// Helper untuk memformat string jam/ISO Date menjadi 'HH:mm' yang bersih
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

function formatDateKey(dateObj) {
  const d = new Date(dateObj);
  if (isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function showToast(message, type = "info") {
  const container = document.getElementById("toastContainer");
  if (!container) return;

  const toast = document.createElement("div");
  let bg = "bg-slate-800 text-white";
  if (type === "success") bg = "bg-emerald-600 text-white";
  if (type === "error") bg = "bg-rose-600 text-white";
  if (type === "warning") bg = "bg-amber-500 text-brand-navy font-bold";

  toast.className = `p-3 rounded-xl shadow-xl text-xs flex items-center justify-between transition-all duration-300 transform translate-y-2 opacity-0 pointer-events-auto ${bg}`;
  toast.innerHTML = `<span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.remove("translate-y-2", "opacity-0");
  }, 10);

  setTimeout(() => {
    toast.classList.add("opacity-0", "translate-y-2");
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ANIMASI LOADING & PERCENTAGE FUNCTIONS
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
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initClock();
  registerPWA();
  initDates();
  loadRealtimeData();
  getCurrentLocation();
});

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
    navigator.serviceWorker.register(URL.createObjectURL(blob)).catch((err) => console.log("SW Fail:", err));
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
    console.warn("API fetch error:", err);
    return { success: false, message: "Tidak dapat terhubung ke Server" };
  }
}

async function loadRealtimeData() {
  showLoadingOverlay("Menghubungkan ke Server...");
  updateLoadingProgress(15, "Menghubungkan ke Server...");

  let progressVal = 15;
  const progressTimer = setInterval(() => {
    if (progressVal < 85) {
      progressVal += Math.floor(Math.random() * 12) + 5;
      if (progressVal > 85) progressVal = 85;
      updateLoadingProgress(progressVal, "Mengunduh Data Server...");
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
      document.getElementById("workHoursInfo").innerText = wInfo;
      document.getElementById("workHoursDisplay").innerText = wInfo;
    }

    populateGuruDropdown();
    populateAdminFilterGuru();
    loadAdminGuruList();
    renderIzinHistory();
    updateTeacherDashboardStats();
    updateAdminMonitoringStats();
    renderAdminRekapTable();
    renderCalendar();
    renderProfile();

    updateLoadingProgress(100, "Selesai!");
    setTimeout(() => {
      hideLoadingOverlay();
      showToast("Data Server Berhasil Dimuat!", "success");
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
    renderIzinHistory();
  } else {
    document.getElementById("dashTeacherName").innerText = "Silakan Pilih Nama Guru";
    document.getElementById("headerTeacherName").innerText = "Pilih Guru";
    document.getElementById("dashStatusBadge").innerText = "Belum Ditemukan";
    document.getElementById("dashStatusBadge").className = "text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-700/60 text-slate-300 border border-slate-600 inline-block";
  }
}

function isSameDay(date1, date2) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return !isNaN(d1.getTime()) && !isNaN(d2.getTime()) && d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
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
      const key = formatDateKey(d);
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
    const d = new Date(iz.startDate || iz.waktu);
    if (!isNaN(d.getTime()) && d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
      countIzin++;
    }
  });

  let countAlpha = 0;
  const daysInMonthSoFar = now.getDate();
  for (let day = 1; day < daysInMonthSoFar; day++) {
    const checkDate = new Date(currentYear, currentMonth, day);
    const dayOfWeek = checkDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      const key = formatDateKey(checkDate);
      if (!dateLogsMap[key] && !myIzin.some((i) => key >= i.startDate && key <= i.endDate)) {
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
  const todayStr = formatDateKey(now);
  const todayIzin = izinLogs.filter((i) => todayStr >= i.startDate && todayStr <= i.endDate);

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

function getFilteredCombinedData() {
  const guruFilter = document.getElementById("filterGuruSelect").value;
  const statusFilter = document.getElementById("filterStatusSelect").value;
  const monthFilter = document.getElementById("filterMonthSelect").value;
  const yearFilter = document.getElementById("filterYearInput").value;

  let combined = [];

  attendanceLogs.forEach((l) => {
    const d = new Date(l.waktu);
    const timeStr = formatTimeOnly(l.waktu);

    let displayWaktu = "-";
    if (!isNaN(d.getTime())) {
      displayWaktu = d.getFullYear() < 2000 ? `${timeStr} WIB` : d.toLocaleString("id-ID");
    } else {
      displayWaktu = timeStr;
    }

    let st = l.status;
    if (st === "Masuk" && timeStr > configJam.jamTerlambat) {
      st = "Terlambat";
    }

    combined.push({
      type: "ABSEN",
      guruNama: l.guruNama,
      status: st,
      rawStatus: l.status,
      waktuObj: !isNaN(d.getTime()) ? d : new Date(),
      waktuStr: displayWaktu,
      address: l.address || (l.lat ? `${l.lat.toFixed(4)}, ${l.lng.toFixed(4)}` : "-"),
      foto: l.foto || null,
    });
  });

  izinLogs.forEach((i) => {
    const d = new Date(i.waktu || i.startDate);
    const startFormatted = formatOnlyDate(i.startDate);
    const endFormatted = formatOnlyDate(i.endDate);
    const dateStrDisplay = startFormatted === endFormatted ? startFormatted : `${startFormatted} s/d ${endFormatted}`;

    combined.push({
      type: "IZIN",
      guruNama: i.guruNama,
      status: "Izin",
      rawStatus: "Izin",
      waktuObj: !isNaN(d.getTime()) ? d : new Date(),
      waktuStr: dateStrDisplay,
      address: i.keterangan || "Pengajuan Izin",
      foto: null,
    });
  });

  if (guruFilter !== "ALL") {
    combined = combined.filter((item) => item.guruNama.trim() === guruFilter.trim());
  }
  if (statusFilter !== "ALL") {
    combined = combined.filter((item) => item.status === statusFilter);
  }
  if (monthFilter !== "ALL") {
    combined = combined.filter((item) => item.waktuObj.getMonth() == monthFilter);
  }
  if (yearFilter) {
    combined = combined.filter((item) => item.waktuObj.getFullYear() == yearFilter);
  }

  combined.sort((a, b) => b.waktuObj - a.waktuObj);
  return combined;
}

function renderAdminRekapTable() {
  const tbody = document.getElementById("adminRekapTableBody");
  if (!tbody) return;

  const combined = getFilteredCombinedData();

  if (combined.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-slate-400 font-medium">Data rekap presensi kosong / tidak ditemukan.</td></tr>`;
    return;
  }

  tbody.innerHTML = "";
  combined.forEach((item) => {
    let badgeColor = "bg-emerald-100 text-emerald-800";
    if (item.status === "Terlambat") badgeColor = "bg-amber-100 text-amber-800";
    if (item.status === "Pulang") badgeColor = "bg-rose-100 text-rose-800";
    if (item.status === "Izin") badgeColor = "bg-purple-100 text-purple-800";

    tbody.innerHTML += `
          <tr class="border-b hover:bg-slate-50">
            <td class="p-2 text-[10px] md:text-xs text-slate-500">${item.waktuStr}</td>
            <td class="p-2 font-bold text-slate-800">${item.guruNama}</td>
            <td class="p-2"><span class="px-2 py-0.5 rounded-full text-[10px] md:text-xs font-bold ${badgeColor}">${item.status}</span></td>
            <td class="p-2 text-slate-600 truncate max-w-[140px]">${item.address}</td>
            <td class="p-2 text-center">
              ${item.foto ? `<button onclick="openAdminPhotoModal('${item.guruNama}', '${item.foto}')" class="text-brand-navy underline font-bold text-[10px] md:text-xs">Lihat Foto</button>` : '<span class="text-slate-300">-</span>'}
            </td>
          </tr>
        `;
  });
}

async function clearRekapDataConfirm() {
  const pass = prompt("Masukkan Password Admin untuk mengosongkan Rekap Log Aktivitas:");
  if (!pass) return;

  showToast("Mengosongkan Rekap Server...", "info");
  const res = await apiCall("clearLogs", { password: pass });
  if (res && res.success) {
    showToast("Rekap absensi berhasil dikosongkan!", "success");
    await loadRealtimeData();
  } else {
    showToast(res.message || "Gagal mengosongkan rekap", "error");
  }
}

function openAdminPhotoModal(nama, fotoSrc) {
  document.getElementById("admPhotoTitle").innerText = `Foto Selfie: ${nama}`;
  document.getElementById("admPhotoImg").src = fotoSrc;
  document.getElementById("adminPhotoModal").classList.remove("hidden");
}

function closeAdminPhotoModal() {
  document.getElementById("adminPhotoModal").classList.add("hidden");
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
  const calendarGrid = document.getElementById("calendarGrid");
  if (!calendarGrid) return;
  calendarGrid.innerHTML = "";

  const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

  document.getElementById("calendarMonthLabel").innerText = `${monthNames[calSelectedMonth]} ${calSelectedYear}`;

  const firstDayIndex = new Date(calSelectedYear, calSelectedMonth, 1).getDay();
  const totalDaysInMonth = new Date(calSelectedYear, calSelectedMonth + 1, 0).getDate();
  const today = new Date();

  const teacherName = selectedGuru ? selectedGuru.nama.trim() : null;
  const logsForMonth = teacherName
    ? attendanceLogs.filter((l) => {
        const d = new Date(l.waktu);
        return l.guruNama && l.guruNama.trim() === teacherName && d.getFullYear() === calSelectedYear && d.getMonth() === calSelectedMonth;
      })
    : [];

  const izinForMonth = teacherName
    ? izinLogs.filter((i) => {
        return i.guruNama && i.guruNama.trim() === teacherName;
      })
    : [];

  const dateLogsMap = {};
  logsForMonth.forEach((l) => {
    const key = formatDateKey(new Date(l.waktu));
    if (!dateLogsMap[key]) dateLogsMap[key] = [];
    dateLogsMap[key].push(l);
  });

  for (let i = 0; i < firstDayIndex; i++) {
    calendarGrid.innerHTML += `<div class="p-2 border border-transparent rounded-xl"></div>`;
  }

  for (let day = 1; day <= totalDaysInMonth; day++) {
    const dateObj = new Date(calSelectedYear, calSelectedMonth, day);
    const dateKey = formatDateKey(dateObj);
    const dayOfWeek = dateObj.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isFuture = dateObj > today && formatDateKey(today) !== dateKey;

    let bgClass = "bg-white text-slate-700 border-slate-200";
    let statusBadgeText = "Tanpa Log";
    let dayLog = dateLogsMap[dateKey] || [];

    const masukLog = dayLog.find((l) => l.status === "Masuk");
    const pulangLog = dayLog.find((l) => l.status === "Pulang");
    const hasIzin = izinForMonth.some((iz) => dateKey >= iz.startDate && dateKey <= iz.endDate);

    if (masukLog) {
      const timeStr = formatTimeOnly(masukLog.waktu);
      if (timeStr > configJam.jamTerlambat) {
        bgClass = "bg-amber-100 text-amber-900 border-amber-300 font-bold";
        statusBadgeText = "Terlambat";
      } else {
        bgClass = "bg-emerald-100 text-emerald-900 border-emerald-300 font-bold";
        statusBadgeText = "Hadir";
      }
    } else if (hasIzin) {
      bgClass = "bg-purple-100 text-purple-900 border-purple-300 font-bold";
      statusBadgeText = "Izin";
    } else if (isWeekend) {
      bgClass = "bg-sky-50 text-sky-700 border-sky-100";
      statusBadgeText = "Libur";
    } else if (!isFuture && dateObj < today) {
      bgClass = "bg-rose-100 text-rose-900 border-rose-200 font-bold";
      statusBadgeText = "Alpha";
    }

    const isToday = formatDateKey(today) === dateKey;
    const todayRing = isToday ? "ring-2 ring-brand-yellow font-extrabold" : "";

    const cellHtml = `
          <div onclick="clickCalDate('${dateKey}', '${statusBadgeText}', '${masukLog ? formatTimeOnly(masukLog.waktu) : "--"}', '${pulangLog ? formatTimeOnly(pulangLog.waktu) : "--"}')"
               class="p-2 border rounded-xl text-center text-xs cursor-pointer shadow-sm hover:scale-105 transition ${bgClass} ${todayRing}">
            <span class="block font-bold">${day}</span>
            <span class="text-[8px] opacity-80 block truncate mt-0.5">${statusBadgeText}</span>
          </div>
        `;
    calendarGrid.innerHTML += cellHtml;
  }
}

function clickCalDate(dateKey, statusText, jamMasuk, jamPulang) {
  const detailCard = document.getElementById("calDateDetailCard");
  detailCard.classList.remove("hidden");

  document.getElementById("calDetailDateStr").innerText = `Log Tanggal: ${formatOnlyDate(dateKey)}`;
  document.getElementById("calDetailBadge").innerText = statusText;
  document.getElementById("calDetailIn").innerText = `Jam Masuk: ${jamMasuk}`;
  document.getElementById("calDetailOut").innerText = `Jam Pulang: ${jamPulang}`;
  document.getElementById("calDetailNote").innerText = `Status Guru: ${selectedGuru ? selectedGuru.nama : "Belum Memilih Guru"}`;
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

  const badge = document.getElementById("cameraTypeBadge");
  badge.innerText = status === "Izin" ? "Kamera Depan / Belakang" : "Kamera Depan";
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
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  photoBase64 = canvas.toDataURL("image/jpeg", 0.8);
  imgPreview.src = photoBase64;

  video.classList.add("hidden");
  imgPreview.classList.remove("hidden");

  if (cameraStream) {
    cameraStream.getTracks().forEach((track) => track.stop());
  }

  document.getElementById("btnTakePhoto").classList.add("hidden");
  document.getElementById("btnStartCamera").classList.add("hidden");
  document.getElementById("btnResetPhoto").classList.remove("hidden");
  showToast("Foto presensi siap dikirim", "success");
}

function resetPhoto() {
  photoBase64 = null;
  document.getElementById("photoPreview").classList.add("hidden");
  document.getElementById("cameraPlaceholder").classList.remove("hidden");
  document.getElementById("btnTakePhoto").classList.remove("hidden");
  document.getElementById("btnStartCamera").classList.remove("hidden");
  document.getElementById("btnResetPhoto").classList.add("hidden");
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
    },
    (err) => {
      locAddress.innerText = "Gagal membaca lokasi GPS. Pastikan izin lokasi aktif.";
      mapIframe.src = "about:blank";
    },
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
  );
}

function openConfirmationModal() {
  if (!selectedGuru) {
    showToast("Silakan pilih nama guru terlebih dahulu!", "warning");
    return;
  }
  if (!photoBase64) {
    showToast("Silakan ambil foto selfie presensi!", "warning");
    return;
  }

  document.getElementById("cnfName").innerText = selectedGuru.nama;
  document.getElementById("cnfStatus").innerText = currentAttendanceStatus;
  document.getElementById("cnfTime").innerText = new Date().toLocaleTimeString("id-ID");
  document.getElementById("cnfLocation").innerText = currentGeoLocation.address;
  document.getElementById("cnfPhoto").src = photoBase64;

  document.getElementById("confirmModal").classList.remove("hidden");
}

function closeConfirmModal() {
  document.getElementById("confirmModal").classList.add("hidden");
}

async function processSubmitAbsence() {
  closeConfirmModal();
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

  const localTimeStr = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  if (currentAttendanceStatus === "Masuk") {
    document.getElementById("dashTimeIn").innerText = localTimeStr;
    document.getElementById("dashStatusBadge").innerText = "Sudah Absen Masuk";
    document.getElementById("dashStatusBadge").className = "text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 inline-block";
  } else if (currentAttendanceStatus === "Pulang") {
    document.getElementById("dashTimeOut").innerText = localTimeStr;
  }

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

async function submitIzin() {
  if (!selectedGuru) {
    showToast("Pilih nama guru terlebih dahulu!", "warning");
    return;
  }
  const note = document.getElementById("izinNote").value;
  if (!note) {
    showToast("Isi alasan pengajuan izin!", "warning");
    return;
  }

  showToast("Mengirim izin ke Server...", "info");
  const payload = {
    guruNama: selectedGuru.nama,
    jenis: document.getElementById("izinType").value,
    startDate: document.getElementById("izinStartDate").value,
    endDate: document.getElementById("izinEndDate").value,
    keterangan: note,
    waktu: new Date().toISOString(),
  };

  const res = await apiCall("submitIzin", payload);
  if (res && res.success) {
    showToast("Izin berhasil tersimpan!", "success");
    document.getElementById("izinNote").value = "";
    await loadRealtimeData();
  } else {
    showToast("Gagal mengirim izin", "error");
  }
}

function renderIzinHistory() {
  const container = document.getElementById("izinHistoryList");
  if (!container) return;

  const teacherName = selectedGuru ? selectedGuru.nama.trim() : null;
  const filtered = teacherName ? izinLogs.filter((i) => i.guruNama && i.guruNama.trim() === teacherName) : izinLogs;

  if (filtered.length === 0) {
    container.innerHTML = `<p class="text-xs text-slate-400 text-center py-4">Belum ada catatan pengajuan izin.</p>`;
    return;
  }

  container.innerHTML = "";
  filtered.forEach((iz) => {
    const startDateFormatted = formatOnlyDate(iz.startDate);
    const endDateFormatted = formatOnlyDate(iz.endDate);
    const dateDisplay = startDateFormatted === endDateFormatted ? startDateFormatted : `${startDateFormatted} - ${endDateFormatted}`;

    container.innerHTML += `
          <div class="p-3 bg-slate-50 border rounded-xl text-xs space-y-1">
            <div class="flex justify-between items-center font-bold text-slate-800 flex-wrap gap-1">
              <span class="bg-purple-100 text-purple-800 px-2 py-0.5 rounded-md font-extrabold text-[10px]">${iz.jenis}</span>
              <span class="text-brand-accentPurple text-[11px] font-semibold">${dateDisplay}</span>
            </div>
            <p class="text-slate-600 pt-0.5">${iz.keterangan || "-"}</p>
          </div>
        `;
  });
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
    leaderboardList.innerHTML = `<p class="text-xs text-slate-400 text-center py-3">Belum ada data guru dari Server.</p>`;
    return;
  }

  const stats = teachersData.map((g) => {
    const logs = attendanceLogs.filter((l) => l.guruNama && l.guruNama.trim() === g.nama.trim() && l.status === "Masuk");
    return {
      nama: g.nama,
      mapel: g.mapel,
      count: logs.length,
    };
  });

  stats.sort((a, b) => b.count - a.count);

  leaderboardList.innerHTML = "";
  const medals = ["🥇", "🥈", "🥉"];
  stats.forEach((st, idx) => {
    const medal = medals[idx] || `${idx + 1}.`;
    leaderboardList.innerHTML += `
          <div class="flex items-center justify-between p-2.5 ${idx === 0 ? "bg-amber-50 border border-amber-200" : "bg-slate-50"} rounded-xl">
            <div class="flex items-center space-x-2">
              <span class="text-sm font-bold">${medal}</span>
              <span class="text-xs font-bold text-slate-800">${st.nama}</span>
            </div>
            <span class="text-xs font-extrabold text-slate-700">${st.count} Hadir</span>
          </div>
        `;
  });
}

function toggleAdminModal() {
  document.getElementById("adminModal").classList.toggle("hidden");
}

function loginAdmin() {
  const pass = document.getElementById("adminPasswordInput").value;
  if (pass === "adminyppm2026") {
    document.getElementById("adminLoginSection").classList.add("hidden");
    document.getElementById("adminContentSection").classList.remove("hidden");
    loadAdminGuruList();
    renderAdminRekapTable();
  } else {
    showToast("Password Admin Salah!", "error");
  }
}

function switchAdminTab(tabName) {
  ["Rekap", "Guru", "Jam", "Config"].forEach((t) => {
    const el = document.getElementById(`admTab${t}`);
    const btn = document.getElementById(`admTabBtn${t}`);
    if (el) el.classList.add("hidden");
    if (btn) btn.className = "pb-2 text-slate-400 whitespace-nowrap";
  });

  const activeEl = document.getElementById(`admTab${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`);
  const activeBtn = document.getElementById(`admTabBtn${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`);
  if (activeEl) activeEl.classList.remove("hidden");
  if (activeBtn) activeBtn.className = "pb-2 border-b-2 border-brand-navy text-brand-navy font-bold whitespace-nowrap";
}

function loadAdminGuruList() {
  const tbody = document.getElementById("adminGuruTableBody");
  if (!tbody) return;

  if (teachersData.length === 0) {
    tbody.innerHTML = `<tr><td colspan="3" class="p-3 text-center text-slate-400">Belum ada data guru.</td></tr>`;
    document.getElementById("admTotalGuru").innerText = "0";
    return;
  }

  tbody.innerHTML = "";
  teachersData.forEach((g) => {
    tbody.innerHTML += `
          <tr class="border-b hover:bg-slate-50">
            <td class="p-2 font-bold text-slate-800">
              ${g.nama}
              <div class="text-[10px] text-slate-400 font-normal">NIP: ${g.nip || "-"}</div>
            </td>
            <td class="p-2 text-slate-600">${g.mapel || "-"} (${g.status || "GTY"})</td>
            <td class="p-2">
              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">Aktif</span>
            </td>
          </tr>
        `;
  });
  document.getElementById("admTotalGuru").innerText = teachersData.length;
}

async function addGuruSubmit() {
  const namaInput = document.getElementById("addGuruNama");
  const nama = namaInput.value.trim();
  if (!nama) return showToast("Isi nama guru!", "warning");

  showToast("Menyimpan guru ke Server...", "info");
  const payload = {
    nama,
    nip: document.getElementById("addGuruNip").value.trim(),
    mapel: document.getElementById("addGuruMapel").value.trim(),
    status: document.getElementById("addGuruStatus").value,
  };

  const res = await apiCall("addGuru", payload);
  if (res && res.success) {
    showToast("Guru berhasil tersimpan di Server!", "success");
    namaInput.value = "";
    document.getElementById("addGuruNip").value = "";
    document.getElementById("addGuruMapel").value = "";

    await loadRealtimeData();
    loadAdminGuruList();
  } else {
    showToast("Gagal menyimpan guru", "error");
  }
}

function saveConfigJam() {
  configJam.jamMasuk = formatTimeOnly(document.getElementById("cfgJamMasuk").value, "07:00");
  configJam.jamTerlambat = formatTimeOnly(document.getElementById("cfgJamTerlambat").value, "07:15");
  configJam.jamPulang = formatTimeOnly(document.getElementById("cfgJamPulang").value, "15:00");

  const wInfo = `${configJam.jamMasuk} - ${configJam.jamPulang} WIB`;
  document.getElementById("workHoursInfo").innerText = wInfo;
  document.getElementById("workHoursDisplay").innerText = wInfo;
  showToast("Pengaturan jam kerja diperbarui!", "success");
}

function saveGasUrlConfig() {
  const newUrl = document.getElementById("gasUrlInput").value.trim();
  if (newUrl) {
    gasUrl = newUrl;
    localStorage.setItem("yppm_gas_url", newUrl);
    showToast("URL Backend Server disimpan!", "success");
    loadRealtimeData();
  }
}

function calculateExportSummary(filteredData) {
  let totalMasuk = 0;
  let totalTerlambat = 0;
  let totalPulang = 0;
  let totalIzin = 0;

  const teacherStats = {};

  filteredData.forEach((item) => {
    const st = item.status;
    const guru = item.guruNama.trim();

    if (!teacherStats[guru]) {
      teacherStats[guru] = { masuk: 0, terlambat: 0, pulang: 0, izin: 0, total: 0 };
    }

    if (st === "Masuk") {
      totalMasuk++;
      teacherStats[guru].masuk++;
    } else if (st === "Terlambat") {
      totalTerlambat++;
      teacherStats[guru].terlambat++;
    } else if (st === "Pulang") {
      totalPulang++;
      teacherStats[guru].pulang++;
    } else if (st === "Izin") {
      totalIzin++;
      teacherStats[guru].izin++;
    }

    teacherStats[guru].total++;
  });

  return {
    totalMasuk,
    totalTerlambat,
    totalPulang,
    totalIzin,
    totalRecords: filteredData.length,
    teacherStats,
  };
}

function exportDataExcel() {
  const filteredData = getFilteredCombinedData();

  if (filteredData.length === 0) return showToast("Tidak ada data sesuai filter untuk diexport", "warning");

  const guruFilter = document.getElementById("filterGuruSelect").value;
  const monthFilter = document.getElementById("filterMonthSelect").value;

  const summary = calculateExportSummary(filteredData);

  const exportRows = filteredData.map((l) => ({
    "Waktu Presensi": l.waktuStr,
    "Nama Guru": l.guruNama,
    "Status Presensi": l.status,
    "Alamat / Lokasi GPS": l.address,
  }));

  exportRows.push({});
  exportRows.push({ "Waktu Presensi": "--- RINGKASAN TOTAL KEHADIRAN ---" });
  exportRows.push({ "Waktu Presensi": "Total Masuk (Tepat Waktu)", "Nama Guru": summary.totalMasuk });
  exportRows.push({ "Waktu Presensi": "Total Terlambat", "Nama Guru": summary.totalTerlambat });
  exportRows.push({ "Waktu Presensi": "Total Pulang", "Nama Guru": summary.totalPulang });
  exportRows.push({ "Waktu Presensi": "Total Izin / Sakit", "Nama Guru": summary.totalIzin });
  exportRows.push({ "Waktu Presensi": "Total Record Log", "Nama Guru": summary.totalRecords });

  exportRows.push({});
  exportRows.push({ "Waktu Presensi": "--- RINGKASAN KEHADIRAN PER GURU ---" });
  Object.keys(summary.teacherStats).forEach((guru) => {
    const st = summary.teacherStats[guru];
    exportRows.push({
      "Waktu Presensi": guru,
      "Nama Guru": `Masuk: ${st.masuk}`,
      "Status Presensi": `Terlambat: ${st.terlambat}`,
      "Alamat / Lokasi GPS": `Pulang: ${st.pulang} | Izin: ${st.izin} | Total: ${st.total}`,
    });
  });

  const ws = XLSX.utils.json_to_sheet(exportRows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Rekap Presensi");

  const teacherSummaryRows = Object.keys(summary.teacherStats).map((guru) => ({
    "Nama Guru": guru,
    "Masuk (Tepat Waktu)": summary.teacherStats[guru].masuk,
    Terlambat: summary.teacherStats[guru].terlambat,
    Pulang: summary.teacherStats[guru].pulang,
    "Izin / Sakit": summary.teacherStats[guru].izin,
    "Total Kehadiran": summary.teacherStats[guru].total,
  }));

  const wsSummary = XLSX.utils.json_to_sheet(teacherSummaryRows);
  XLSX.utils.book_append_sheet(wb, wsSummary, "Ringkasan Per Guru");

  XLSX.writeFile(wb, `Rekap_Presensi_SMK_YPPM_${guruFilter}_${monthFilter}.xlsx`);
  showToast("File Excel Rekapitulasi & Ringkasan berhasil diunduh", "success");
}

function exportDataPDF() {
  const filteredData = getFilteredCombinedData();

  if (filteredData.length === 0) return showToast("Tidak ada data sesuai filter untuk diexport", "warning");

  const guruFilter = document.getElementById("filterGuruSelect").value;
  const statusFilter = document.getElementById("filterStatusSelect").value;
  const yearFilter = document.getElementById("filterYearInput").value;

  const summary = calculateExportSummary(filteredData);

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("REKAPITULASI PRESENSI GURU SMK YPPM TOMO", 14, 15);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Filter Guru: ${guruFilter} | Status: ${statusFilter} | Tahun: ${yearFilter}`, 14, 21);

  const tableColumn = ["Waktu", "Nama Guru", "Status", "Lokasi GPS"];
  const tableRows = filteredData.map((l) => [l.waktuStr, l.guruNama, l.status, (l.address || "").substring(0, 32)]);

  doc.autoTable({
    startY: 25,
    head: [tableColumn],
    body: tableRows,
    theme: "striped",
    headStyles: { fillColor: [15, 23, 42] },
    styles: { fontSize: 8 },
  });

  const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY : 150;

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("RINGKASAN TOTAL KEHADIRAN", 14, finalY + 10);

  const summaryRows = [
    ["Total Masuk (Tepat Waktu)", summary.totalMasuk],
    ["Total Terlambat", summary.totalTerlambat],
    ["Total Pulang", summary.totalPulang],
    ["Total Izin / Sakit", summary.totalIzin],
    ["Total Record Log", summary.totalRecords],
  ];

  doc.autoTable({
    startY: finalY + 14,
    head: [["Kategori", "Jumlah"]],
    body: summaryRows,
    theme: "grid",
    headStyles: { fillColor: [245, 158, 11], textColor: [15, 23, 42] },
    styles: { fontSize: 8 },
  });

  doc.save(`Rekap_Presensi_SMK_YPPM_${guruFilter}.pdf`);
  showToast("File PDF Rekapitulasi berhasil diunduh", "success");
}
