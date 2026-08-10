// Admin Panel & Monitoring Module (Including Belum Absen Daily Tracker)

function toggleAdminModal() {
  const modal = document.getElementById("adminModal");
  if (modal) modal.classList.toggle("hidden");
}

async function loginAdmin() {
  const passEl = document.getElementById("adminPasswordInput");
  const pass = passEl ? passEl.value.trim() : "";
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
    renderAdminBelumAbsen();
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
  const tabs = ["belumAbsen", "rekap", "approval", "import", "guru", "jam", "pengumuman", "config"];
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

  if (tab === "belumAbsen") {
    renderAdminBelumAbsen();
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

function updateAdminMonitoringStats() {
  const now = new Date();
  const todayLogs = attendanceLogs.filter((l) => isSameDay(l.waktu, now));
  const todayStr = parseToDateKey(now);
  const todayIzin = izinLogs.filter((i) => {
    const s = parseToDateKey(i.startDate || i.waktu);
    const e = parseToDateKey(i.endDate || i.startDate || i.waktu);
    return todayStr >= s && todayStr <= e;
  });

  const masukSet = new Set();
  let countTelatToday = 0;

  todayLogs.forEach((l) => {
    if (l.status === "Masuk" && l.guruNama) {
      masukSet.add(l.guruNama.trim());
      const timeStr = formatTimeOnly(l.waktu);
      if (timeStr > configJam.jamTerlambat) {
        countTelatToday++;
      }
    }
  });

  const totEl = document.getElementById("admTotalGuru");
  const hadEl = document.getElementById("admHadirToday");
  const telEl = document.getElementById("admTelatToday");
  const iziEl = document.getElementById("admIzinToday");

  if (totEl) totEl.innerText = teachersData.length;
  if (hadEl) hadEl.innerText = masukSet.size;
  if (telEl) telEl.innerText = countTelatToday;
  if (iziEl) iziEl.innerText = todayIzin.length;
}

// ----------------------------------------------------
// FEATURE 3: MONITORING GURU BELUM ABSEN MASUK & PULANG
// ----------------------------------------------------
function renderAdminBelumAbsen() {
  const containerMasuk = document.getElementById("belumMasukListContainer");
  const containerPulang = document.getElementById("belumPulangListContainer");
  const dateInput = document.getElementById("admBelumAbsenDate");
  if (!dateInput) return;

  if (!dateInput.value) {
    dateInput.value = parseToDateKey(new Date());
  }

  const selectedDateStr = dateInput.value;
  const parts = selectedDateStr.split("-");
  const targetDateObj = new Date(parts[0], parts[1] - 1, parts[2]);

  // Filter logs for selected date
  const dayLogs = attendanceLogs.filter((l) => isSameDay(l.waktu, targetDateObj));
  
  // Filter approved/pending izins for selected date
  const dayIzins = izinLogs.filter((i) => {
    const s = parseToDateKey(i.startDate || i.waktu);
    const e = parseToDateKey(i.endDate || i.startDate || i.waktu);
    return selectedDateStr >= s && selectedDateStr <= e && i.approvalStatus !== "Ditolak";
  });

  const masukMap = {};
  const pulangMap = {};

  dayLogs.forEach((l) => {
    if (!l.guruNama) return;
    const nameNorm = l.guruNama.trim();
    if (l.status === "Masuk") {
      masukMap[nameNorm] = l;
    } else if (l.status === "Pulang") {
      pulangMap[nameNorm] = l;
    }
  });

  const izinMap = {};
  dayIzins.forEach((i) => {
    if (!i.guruNama) return;
    izinMap[i.guruNama.trim()] = i;
  });

  const listBelumMasuk = [];
  const listBelumPulang = [];
  const listSudahLengkap = [];

  teachersData.forEach((g) => {
    const name = g.nama.trim();
    const isIzin = izinMap[name];
    const hasMasuk = masukMap[name];
    const hasPulang = pulangMap[name];

    if (isIzin) {
      // Guru sedang izin
      return;
    }

    if (!hasMasuk) {
      listBelumMasuk.push({
        nama: g.nama,
        mapel: g.mapel || "Guru",
        foto: g.foto || "https://iili.io/KjIKMJ9.png",
      });
    } else {
      if (!hasPulang) {
        listBelumPulang.push({
          nama: g.nama,
          mapel: g.mapel || "Guru",
          foto: g.foto || "https://iili.io/KjIKMJ9.png",
          jamMasuk: formatTimeOnly(hasMasuk.waktu),
        });
      } else {
        listSudahLengkap.push({
          nama: g.nama,
          jamMasuk: formatTimeOnly(hasMasuk.waktu),
          jamPulang: formatTimeOnly(hasPulang.waktu),
        });
      }
    }
  });

  // Update Badges
  const bMasukCount = document.getElementById("cntBelumMasuk");
  const bPulangCount = document.getElementById("cntBelumPulang");
  const bLengkapCount = document.getElementById("cntSudahLengkap");
  const bIzinCount = document.getElementById("cntTotalIzinDay");

  if (bMasukCount) bMasukCount.innerText = listBelumMasuk.length;
  if (bPulangCount) bPulangCount.innerText = listBelumPulang.length;
  if (bLengkapCount) bLengkapCount.innerText = listSudahLengkap.length;
  if (bIzinCount) bIzinCount.innerText = Object.keys(izinMap).length;

  // Render Belum Masuk List
  if (containerMasuk) {
    if (listBelumMasuk.length === 0) {
      containerMasuk.innerHTML = `
        <div class="p-4 text-center text-emerald-600 bg-emerald-50 rounded-xl border border-emerald-200">
          <span class="material-symbols-outlined text-2xl block mb-1">task_alt</span>
          <p class="font-bold text-xs">Semua Guru Sudah Absen Masuk!</p>
        </div>
      `;
    } else {
      let html = '<div class="space-y-2 max-h-60 overflow-y-auto pr-1">';
      listBelumMasuk.forEach((item, idx) => {
        html += `
          <div class="flex items-center justify-between p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs">
            <div class="flex items-center space-x-2.5 min-w-0">
              <span class="font-extrabold text-rose-700 text-[11px] w-4">${idx + 1}.</span>
              <img src="${item.foto}" class="w-8 h-8 rounded-full border border-rose-300 object-cover bg-white flex-shrink-0" />
              <div class="min-w-0">
                <p class="font-bold text-slate-800 truncate">${item.nama}</p>
                <p class="text-[10px] text-slate-500 truncate">${item.mapel}</p>
              </div>
            </div>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-200 text-rose-800 flex-shrink-0">Belum Masuk</span>
          </div>
        `;
      });
      html += '</div>';
      containerMasuk.innerHTML = html;
    }
  }

  // Render Belum Pulang List
  if (containerPulang) {
    if (listBelumPulang.length === 0) {
      containerPulang.innerHTML = `
        <div class="p-4 text-center text-emerald-600 bg-emerald-50 rounded-xl border border-emerald-200">
          <span class="material-symbols-outlined text-2xl block mb-1">verified</span>
          <p class="font-bold text-xs">Tidak Ada Guru Menunggak Absen Pulang!</p>
        </div>
      `;
    } else {
      let html = '<div class="space-y-2 max-h-60 overflow-y-auto pr-1">';
      listBelumPulang.forEach((item, idx) => {
        html += `
          <div class="flex items-center justify-between p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs">
            <div class="flex items-center space-x-2.5 min-w-0">
              <span class="font-extrabold text-amber-800 text-[11px] w-4">${idx + 1}.</span>
              <img src="${item.foto}" class="w-8 h-8 rounded-full border border-amber-300 object-cover bg-white flex-shrink-0" />
              <div class="min-w-0">
                <p class="font-bold text-slate-800 truncate">${item.nama}</p>
                <p class="text-[10px] text-slate-500 truncate">${item.mapel} (Masuk: ${item.jamMasuk})</p>
              </div>
            </div>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 flex-shrink-0">Belum Pulang</span>
          </div>
        `;
      });
      html += '</div>';
      containerPulang.innerHTML = html;
    }
  }
}

function copyBelumAbsenAnnouncement() {
  const dateInput = document.getElementById("admBelumAbsenDate");
  const selectedDateStr = dateInput ? dateInput.value : parseToDateKey(new Date());
  const dateDisplay = formatOnlyDate(selectedDateStr);

  const parts = selectedDateStr.split("-");
  const targetDateObj = new Date(parts[0], parts[1] - 1, parts[2]);

  const dayLogs = attendanceLogs.filter((l) => isSameDay(l.waktu, targetDateObj));
  const dayIzins = izinLogs.filter((i) => {
    const s = parseToDateKey(i.startDate || i.waktu);
    const e = parseToDateKey(i.endDate || i.startDate || i.waktu);
    return selectedDateStr >= s && selectedDateStr <= e && i.approvalStatus !== "Ditolak";
  });

  const masukMap = {};
  const pulangMap = {};
  dayLogs.forEach((l) => {
    if (!l.guruNama) return;
    const nameNorm = l.guruNama.trim();
    if (l.status === "Masuk") masukMap[nameNorm] = l;
    else if (l.status === "Pulang") pulangMap[nameNorm] = l;
  });

  const izinMap = {};
  dayIzins.forEach((i) => {
    if (i.guruNama) izinMap[i.guruNama.trim()] = i;
  });

  const belumMasuk = [];
  const belumPulang = [];

  teachersData.forEach((g) => {
    const name = g.nama.trim();
    if (izinMap[name]) return;
    if (!masukMap[name]) {
      belumMasuk.push(g.nama);
    } else if (!pulangMap[name]) {
      belumPulang.push(g.nama);
    }
  });

  let text = `📌 *PEMBERITAHUAN PRESENSI GURU SMK YPPM TOMO*\n📅 Tanggal: ${dateDisplay}\n\n`;

  text += `🚨 *GURU BELUM ABSEN MASUK (${belumMasuk.length} Guru):*\n`;
  if (belumMasuk.length === 0) {
    text += `✅ (Nihil / Semua Sudah Absen Masuk)\n`;
  } else {
    belumMasuk.forEach((n, idx) => {
      text += `${idx + 1}. ${n}\n`;
    });
  }

  text += `\n🕔 *GURU BELUM ABSEN PULANG (${belumPulang.length} Guru):*\n`;
  if (belumPulang.length === 0) {
    text += `✅ (Nihil / Semua Sudah Absen Pulang)\n`;
  } else {
    belumPulang.forEach((n, idx) => {
      text += `${idx + 1}. ${n}\n`;
    });
  }

  text += `\nMohon Bpk/Ibu Guru yang bersangkutan untuk segera melengkapi presensi. Terima kasih. 🙏`;

  navigator.clipboard.writeText(text).then(
    () => {
      showToast("Teks Pengumuman Belum Absen Berhasil Disalin!", "success");
    },
    () => {
      showToast("Gagal menyalin teks ke clipboard.", "error");
    }
  );
}

function renderAdminRekapTable() {
  const tbody = document.getElementById("adminRekapTableBody");
  if (!tbody) return;

  const guruFilterSelect = document.getElementById("filterGuruSelect");
  const statusFilterSelect = document.getElementById("filterStatusSelect");
  const monthFilterSelect = document.getElementById("filterMonthSelect");
  const yearFilterInput = document.getElementById("filterYearInput");

  const guruFilter = guruFilterSelect ? guruFilterSelect.value : "ALL";
  const statusFilter = statusFilterSelect ? statusFilterSelect.value : "ALL";
  const monthFilter = monthFilterSelect ? monthFilterSelect.value : "ALL";
  const yearFilter = yearFilterInput ? parseInt(yearFilterInput.value, 10) : 2026;

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

  combinedRecords.sort((a, b) => a.timestamp - b.timestamp);

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

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

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text("LAPORAN REKAPITULASI PRESENSI & IZIN GURU", 105, startY, { align: "center" });
  startY += 8;

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
  const urlEl = document.getElementById("cfgAnnImage");
  const url = urlEl ? urlEl.value.trim() : "";
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

      const rawBase = canvas.toDataURL("image/jpeg", 0.7);
      const fotoBase64 = await compressImageBase64(rawBase, 300, 0.6);
      document.getElementById("addGuruFotoBase64").value = fotoBase64;
      showToast("Foto profil guru siap disimpan (Terkompresi super ringan!)", "info");
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
