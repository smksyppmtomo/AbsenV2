// Backend API Communication Module - Ultra Fast Direct Network Mode & Accurate Connection Monitoring
async function apiCall(action, payload = {}) {
  const icon = document.getElementById("refreshIcon");
  if (icon) icon.classList.add("animate-spin");

  try {
    const response = await fetch(gasUrl, {
      method: "POST",
      cache: "no-store",
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
  if (!navigator.onLine) {
    const localData = loadLocalCache();
    if (localData && localData.guruList) {
      applyDataState(localData);
    }
    showToast("⚠️ Perangkat dalam mode luring (Offline). Menampilkan data lokal.", "warning");
    return;
  }

  showLoadingOverlay("Menghubungkan ke Server Utama...");

  const icon = document.getElementById("refreshIcon");
  if (icon) icon.classList.add("animate-spin");

  try {
    const res = await apiCall("getInitialData");

    if (res && res.success) {
      saveLocalCache(res);
      applyDataState(res);
      finishLoadingProgress(() => {
        if (isManualRefresh) {
          showToast("Data Realtime Server Berhasil Diperbarui!", "success");
        }
      });
    } else {
      const localData = loadLocalCache();
      if (localData && localData.guruList) {
        applyDataState(localData);
      }
      finishLoadingProgress(() => {
        showToast(res.message || "Gangguan jaringan server. Menggunakan data tersimpan.", "warning");
      });
    }
  } catch (err) {
    const localData = loadLocalCache();
    if (localData && localData.guruList) {
      applyDataState(localData);
    }
    finishLoadingProgress(() => {
      showToast("Gagal terhubung ke Server. Memuat data cadangan lokal.", "error");
    });
  }
}

function refreshDataRealtime() {
  loadRealtimeData(true);
}

// REALTIME NETWORK CONNECTION MONITORING & ACCURATE INDICATOR
window.addEventListener("offline", () => {
  const badge = document.getElementById("onlineStatusBadge");
  if (badge) {
    badge.className = "text-[10px] md:text-xs font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 flex items-center";
    badge.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1"></span> Luring (Offline)`;
  }
  showToast("⚠️ Koneksi internet terputus (Offline). Menampilkan data lokal terakhir.", "warning");
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
