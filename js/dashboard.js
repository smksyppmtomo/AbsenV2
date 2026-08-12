// Dashboard & Attendance Form Logic
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

    const clockEl = document.getElementById("liveClock");
    const dashDateEl = document.getElementById("dashCurrentDate");
    const desktopDate = document.getElementById("dashCurrentDateDesktop");

    if (clockEl) clockEl.innerText = timeStr;
    if (dashDateEl) dashDateEl.innerText = dateStr;
    if (desktopDate) desktopDate.innerText = dateStr;
  };
  updateClock();
  setInterval(updateClock, 1000);
}

function initDates() {
  const today = new Date().toISOString().split("T")[0];
  const startEl = document.getElementById("izinStartDate");
  const endEl = document.getElementById("izinEndDate");
  const urlEl = document.getElementById("gasUrlInput");

  if (startEl) startEl.value = today;
  if (endEl) endEl.value = today;
  if (urlEl) urlEl.value = gasUrl;
}

function switchTab(tabId) {
  document.querySelectorAll(".page-view").forEach((el) => el.classList.remove("active"));
  document.querySelectorAll(".nav-btn").forEach((el) => {
    el.classList.remove("text-brand-yellow", "active");
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
    targetNav.classList.add("text-brand-yellow", "active");
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
  if (tabId === "kalender" && typeof renderCalendar === "function") renderCalendar();
  if (tabId === "profil" && typeof renderProfile === "function") renderProfile();
}

// CUSTOM SEARCHABLE GURU DROPDOWN MODAL SYSTEM (SORTED A-Z)
function openCustomGuruModal() {
  const modal = document.getElementById("customGuruModal");
  if (!modal) return;
  modal.classList.remove("hidden");

  const input = document.getElementById("customGuruSearchInput");
  if (input) {
    input.value = "";
    setTimeout(() => input.focus(), 100);
  }
  renderCustomGuruOptions();
}

function closeCustomGuruModal() {
  const modal = document.getElementById("customGuruModal");
  if (modal) modal.classList.add("hidden");
}

function renderCustomGuruOptions(filterQuery = "") {
  const container = document.getElementById("customGuruOptionsContainer");
  if (!container) return;

  if (teachersData.length === 0) {
    container.innerHTML = `<p class="text-xs text-slate-400 text-center py-4">Belum ada data guru di Server.</p>`;
    return;
  }

  // URUTKAN NAMA GURU SESUAI ABJAD A-Z
  const sorted = [...teachersData].sort((a, b) =>
    (a.nama || "").localeCompare(b.nama || "", "id", { sensitivity: "base" })
  );

  const query = filterQuery.toLowerCase().trim();
  const filtered = sorted.filter(
    (g) =>
      (g.nama || "").toLowerCase().includes(query) ||
      (g.mapel || "").toLowerCase().includes(query) ||
      (g.nip || "").toLowerCase().includes(query)
  );

  if (filtered.length === 0) {
    container.innerHTML = `<p class="text-xs text-slate-400 text-center py-4">Pencarian "${filterQuery}" tidak ditemukan.</p>`;
    return;
  }

  let html = "";
  filtered.forEach((g) => {
    const isSelected = selectedGuru && selectedGuru.nama === g.nama;
    const avatarSrc = g.foto || "https://iili.io/KjIKMJ9.png";

    html += `
      <div 
        onclick="selectGuruCustomOption('${g.nama}')"
        class="flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition ${isSelected ? "bg-amber-50 border-2 border-amber-400 shadow-sm" : "hover:bg-slate-100 border border-slate-200"}"
      >
        <div class="flex items-center space-x-3 min-w-0">
          <img src="${avatarSrc}" class="w-10 h-10 rounded-full border border-amber-400 object-cover bg-white flex-shrink-0 shadow-xs" />
          <div class="min-w-0">
            <p class="text-xs font-extrabold text-slate-800 truncate">${g.nama}</p>
            <p class="text-[10px] text-slate-500 font-medium truncate">${g.mapel || "Guru"} ${g.nip ? "• NIP: " + g.nip : ""}</p>
          </div>
        </div>
        ${isSelected ? '<span class="material-symbols-outlined text-emerald-600 text-lg flex-shrink-0">check_circle</span>' : '<span class="material-symbols-outlined text-slate-300 text-base flex-shrink-0">chevron_right</span>'}
      </div>
    `;
  });

  container.innerHTML = html;
}

function selectGuruCustomOption(nama) {
  closeCustomGuruModal();
  const select = document.getElementById("selectGuru");
  if (select) select.value = nama;
  onSelectGuruChange(nama);
}

function populateGuruDropdown() {
  const select = document.getElementById("selectGuru");
  if (!select) return;

  select.innerHTML = '<option value="">-- Pilih Nama Anda --</option>';

  if (teachersData.length === 0) {
    select.innerHTML = '<option value="">(Belum Ada Data Guru di Server)</option>';
    return;
  }

  // URUTKAN NAMA GURU SESUAI ABJAD A-Z PERSIAPAN OPTIONS
  const sortedTeachers = [...teachersData].sort((a, b) =>
    (a.nama || "").localeCompare(b.nama || "", "id", { sensitivity: "base" })
  );

  sortedTeachers.forEach((g) => {
    select.innerHTML += `<option value="${g.nama}">${g.nama} (${g.mapel || "Guru"})</option>`;
  });

  const savedName = localStorage.getItem("yppm_remembered_guru");
  if (savedName && teachersData.some((g) => g.nama === savedName)) {
    select.value = savedName;
    const remCb = document.getElementById("rememberMe");
    if (remCb) remCb.checked = true;
    onSelectGuruChange(savedName);
  } else {
    updateCustomGuruTriggerLabel();
  }
}

function updateCustomGuruTriggerLabel() {
  const lbl = document.getElementById("customGuruSelectedText");
  if (!lbl) return;

  if (selectedGuru) {
    lbl.innerText = `${selectedGuru.nama} (${selectedGuru.mapel || "Guru"})`;
    lbl.className = "truncate font-extrabold text-slate-900";
  } else {
    lbl.innerText = "-- Klik untuk Cari / Pilih Nama Anda (A-Z) --";
    lbl.className = "truncate font-semibold text-slate-500";
  }
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

    const remCb = document.getElementById("rememberMe");
    if (remCb && remCb.checked) {
      localStorage.setItem("yppm_remembered_guru", selectedGuru.nama);
    }

    updateTeacherDashboardStats();
    if (typeof renderCalendar === "function") renderCalendar();
    if (typeof renderProfile === "function") renderProfile();
  } else {
    document.getElementById("dashTeacherName").innerText = "Silakan Pilih Nama Guru";
    document.getElementById("headerTeacherName").innerText = "Pilih Guru";
    document.getElementById("dashStatusBadge").innerText = "Belum Ditemukan";
    document.getElementById("dashStatusBadge").className = "text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-700/60 text-slate-300 border border-slate-600 inline-block";
  }

  updateCustomGuruTriggerLabel();
  updateFormProgress();
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
      const noteEl = document.getElementById("izinNote");
      const note = noteEl ? noteEl.value.trim() : "";
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

  const mLabel = document.getElementById("statMonthLabel");
  if (mLabel) mLabel.innerText = now.toLocaleDateString("id-ID", { month: "long", year: "numeric" });

  const selectedNameTrim = selectedGuru.nama.trim();
  const myLogs = attendanceLogs.filter((log) => log.guruNama && log.guruNama.trim() === selectedNameTrim);
  const myIzin = izinLogs.filter((iz) => iz.guruNama && iz.guruNama.trim() === selectedNameTrim);

  const todayLogs = myLogs.filter((log) => isSameDay(log.waktu, now));
  const masukLog = todayLogs.find((l) => l.status === "Masuk");
  const pulangLog = todayLogs.find((l) => l.status === "Pulang");

  const badgeEl = document.getElementById("dashStatusBadge");
  if (masukLog) {
    const timeIn = formatTimeOnly(masukLog.waktu);
    document.getElementById("dashTimeIn").innerText = timeIn;
    if (badgeEl) {
      badgeEl.innerText = "Sudah Absen Masuk";
      badgeEl.className = "text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 inline-block";
    }
  } else {
    document.getElementById("dashTimeIn").innerText = "--:--";
    if (badgeEl) {
      badgeEl.innerText = "Belum Absen Masuk";
      badgeEl.className = "text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 inline-block";
    }
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

function setAttendanceStatus(status) {
  currentAttendanceStatus = status;
  const btns = {
    Masuk: document.getElementById("btnStatMasuk"),
    Pulang: document.getElementById("btnStatPulang"),
    Izin: document.getElementById("btnStatIzin"),
  };

  Object.keys(btns).forEach((key) => {
    if (!btns[key]) return;
    if (key === status) {
      btns[key].className = "py-2.5 rounded-xl border text-xs font-bold transition flex flex-col items-center justify-center space-y-1 bg-emerald-600 text-white border-emerald-600 shadow";
    } else {
      btns[key].className = "py-2.5 rounded-xl border text-xs font-bold transition flex flex-col items-center justify-center space-y-1 bg-white text-slate-600 border-slate-200";
    }
  });

  const izinSection = document.getElementById("izinFormSection");
  const btnSubmitText = document.getElementById("btnSubmitText");

  if (status === "Izin") {
    if (izinSection) izinSection.classList.remove("hidden");
    if (btnSubmitText) btnSubmitText.innerText = "KIRIM PENGAJUAN IZIN KE SERVER";
  } else {
    if (izinSection) izinSection.classList.add("hidden");
    if (btnSubmitText) btnSubmitText.innerText = "KIRIM PRESENSI KE SERVER";
  }

  updateFormProgress();
}

function openConfirmationModal() {
  if (!selectedGuru) {
    showToast("Silakan pilih nama guru terlebih dahulu!", "warning");
    return;
  }
  if (!photoBase64 && currentAttendanceStatus !== "Izin") {
    showToast("Silakan ambil foto selfie!", "warning");
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
      if (typeof resetPhoto === "function") resetPhoto();
      await loadRealtimeData(true);
      switchTab("dashboard");
    } else {
      showToast(res.message || "Gagal mengirim izin ke Server", "error");
    }
    return;
  }

  showToast("Mengompres foto & mengirim presensi...", "info");
  const compressedPhoto = photoBase64 ? await compressImageBase64(photoBase64, 400, 0.6) : null;
  const nowIso = new Date().toISOString();
  const payload = {
    guruNama: selectedGuru.nama,
    status: currentAttendanceStatus,
    foto: compressedPhoto,
    lat: currentGeoLocation.lat,
    lng: currentGeoLocation.lng,
    address: currentGeoLocation.address,
    waktu: nowIso,
  };

  const res = await apiCall("submitAbsence", payload);
  if (res && res.success) {
    showToast("Presensi Berhasil Disimpan di Server!", "success");
    if (typeof resetPhoto === "function") resetPhoto();
    await loadRealtimeData(true);
    switchTab("dashboard");
  } else {
    showToast(res.message || "Gagal menyimpan ke Server", "error");
  }
}
