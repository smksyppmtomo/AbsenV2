// Backend API Communication Module
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

  // 1. INSTANT LOAD FROM CACHE (0ms latency user experience)
  if (localData && localData.guruList && localData.guruList.length > 0) {
    hasCache = true;
    applyDataState(localData);
  }

  // 2. SHOW OVERLAY WITH DYNAMIC ANIMATED PROGRESS (0% -> 100%)
  if (!hasCache || isManualRefresh) {
    showLoadingOverlay("Menghubungkan ke Server Utama...");
  } else {
    // Hidden smoothly after background update if cache already present
    hideLoadingOverlay();
  }

  const icon = document.getElementById("refreshIcon");
  if (icon) icon.classList.add("animate-spin");

  // 3. BACKGROUND NETWORK FETCH (STALE-WHILE-REVALIDATE)
  const res = await apiCall("getInitialData");

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
    if (!hasCache || isManualRefresh) {
      finishLoadingProgress(() => {
        if (!hasCache) {
          showToast("Gagal memuat data dari Server.", "error");
        }
      });
    }
  }
}

function refreshDataRealtime() {
  loadRealtimeData(true);
}
