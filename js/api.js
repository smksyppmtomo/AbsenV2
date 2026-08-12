// Backend API Communication Module - Ultra Fast Mobile Mode & Resilient Network Sync
async function apiCall(action, payload = {}, timeoutMs = 6000) {
  const icon = document.getElementById("refreshIcon");
  if (icon) icon.classList.add("animate-spin");

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(gasUrl, {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action, ...payload }),
    });
    clearTimeout(timeoutId);
    const result = await response.json();
    if (icon) icon.classList.remove("animate-spin");
    return result;
  } catch (err) {
    clearTimeout(timeoutId);
    if (icon) icon.classList.remove("animate-spin");
    return { success: false, message: "Koneksi ke Server lambat atau terputus." };
  }
}

function applyDataState(data) {
  if (!data) return;
  teachersData = data.guruList || data.teachersData || [];
  attendanceLogs = data.attendanceLogs || [];
  izinLogs = data.izinLogs || [];

  const configObj = data.config || data.configJam;
  if (configObj) {
    configJam = {
      jamMasuk: formatTimeOnly(configObj.jamMasuk, "07:00"),
      jamTerlambat: formatTimeOnly(configObj.jamTerlambat, "07:15"),
      jamPulang: formatTimeOnly(configObj.jamPulang, "15:00"),
    };
    const wInfo = `${configJam.jamMasuk} - ${configJam.jamPulang} WIB`;
    const wEl = document.getElementById("workHoursDisplay");
    if (wEl) wEl.innerText = wInfo;

    const inEl = document.getElementById("cfgJamMasuk");
    const latEl = document.getElementById("cfgJamTerlambat");
    const outEl = document.getElementById("cfgJamPulang");
    if (inEl) inEl.value = configJam.jamMasuk;
    if (latEl) latEl.value = configJam.jamTerlambat;
    if (outEl) outEl.value = configJam.jamPulang;

    if (document.getElementById("cfgAnnTitle")) {
      document.getElementById("cfgAnnTitle").value = configObj.annTitle || "";
      document.getElementById("cfgAnnContent").value = configObj.annContent || "";
      document.getElementById("cfgAnnImage").value = configObj.annImage || "";
      if (document.getElementById("cfgAnnActive")) {
        document.getElementById("cfgAnnActive").checked = configObj.annActive === "true";
      }
      if (typeof updateAnnouncementPreview === "function") updateAnnouncementPreview();
    }
  }

  if (data.announcement && data.announcement.active) {
    const ann = data.announcement;
    const tEl = document.getElementById("announceTitle");
    const cEl = document.getElementById("announceContent");
    if (ann.title && tEl) tEl.innerText = ann.title;
    if (ann.content && cEl) cEl.innerText = ann.content;
    if (ann.image) {
      const imgEl = document.getElementById("announceImg");
      if (imgEl) {
        imgEl.src = ann.image;
        imgEl.classList.remove("hidden");
      }
    }
    const annModal = document.getElementById("announcementModal");
    if (annModal) annModal.classList.remove("hidden");
  }

  populateGuruDropdown();
  populateAdminFilterGuru();
  loadAdminGuruList();
  updateTeacherDashboardStats();
  updateAdminMonitoringStats();
  renderAdminRekapTable();
  renderAdminIzinApprovalTable();
  if (typeof renderAdminBelumAbsen === "function") renderAdminBelumAbsen();
  renderCalendar();
  renderProfile();
  updateFormProgress();
}

async function loadRealtimeData(isManualRefresh = false) {
  const localData = loadLocalCache();
  let hasCache = false;

  // 1. INSTANT STARTUP ON MOBILE (0ms UI render)
  if (localData && localData.guruList && localData.guruList.length > 0) {
    hasCache = true;
    applyDataState(localData);
  }

  if (!hasCache || isManualRefresh) {
    showLoadingOverlay("Menghubungkan ke Server Utama...");
  } else {
    // Hide overlay immediately so app opens instantly on HP
    hideLoadingOverlay();
  }

  const icon = document.getElementById("refreshIcon");
  if (icon) icon.classList.add("animate-spin");

  // 2. BACKGROUND NETWORK SYNC WITH 6-SECOND MOBILE TIMEOUT
  const res = await apiCall("getInitialData", {}, 6000);

  if (res && res.success) {
    saveLocalCache(res);
    applyDataState(res);
    if (!hasCache || isManualRefresh) {
      finishLoadingProgress(() => {
        if (isManualRefresh) {
          showToast("Data Realtime Server Berhasil Diperbarui!", "success");
        }
      });
    }
  } else {
    // Fallback gracefully without showing annoying error alerts on app open
    if (!hasCache || isManualRefresh) {
      finishLoadingProgress(() => {
        if (isManualRefresh) {
          showToast(res.message || "Koneksi lambat. Menggunakan data tersimpan.", "warning");
        }
      });
    }
  }
}

function refreshDataRealtime() {
  loadRealtimeData(true);
}

// REALTIME NETWORK CONNECTION MONITORING
window.addEventListener("offline", () => {
  const badge = document.getElementById("onlineStatusBadge");
  if (badge) {
    badge.className = "text-[10px] md:text-xs font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 flex items-center";
    badge.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1"></span> Luring (Offline)`;
  }
  showToast("⚠️ Perangkat luring (Offline). Menampilkan data lokal.", "warning");
});

window.addEventListener("online", () => {
  const badge = document.getElementById("onlineStatusBadge");
  if (badge) {
    badge.className = "text-[10px] md:text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 flex items-center";
    badge.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse"></span> Online`;
  }
  showToast("🌐 Koneksi internet terhubung kembali! Menyegarkan data realtime...", "success");
  loadRealtimeData(true);
});
