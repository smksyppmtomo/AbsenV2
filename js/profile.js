// Teacher Profile & Discipline Leaderboard Module
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

  // 1. CARI TOTAL KEHADIRAN MASUK MAKSIMUM DI ANTARA SEMUA GURU
  let maxAttendanceCount = 1;
  teachersData.forEach((g) => {
    const count = attendanceLogs.filter(
      (l) => l.guruNama && l.guruNama.trim() === g.nama.trim() && l.status === "Masuk"
    ).length;
    if (count > maxAttendanceCount) maxAttendanceCount = count;
  });

  const stats = teachersData.map((g) => {
    const logs = attendanceLogs.filter(
      (l) => l.guruNama && l.guruNama.trim() === g.nama.trim() && l.status === "Masuk"
    );

    let onTimeCount = 0;
    let lateCount = 0;
    let totalOnTimeMinutes = 0;
    let earliestTimeStr = "23:59";
    let sumPunctualityScore = 0;

    // Limit jamTerlambat (default 07:15 = 435 menit dari 00:00)
    const jamTerlambatParts = (configJam.jamTerlambat || "07:15").split(":");
    const limitMins = parseInt(jamTerlambatParts[0], 10) * 60 + parseInt(jamTerlambatParts[1], 10);
    const targetMins = 6 * 60; // Target ideal 06:00 WIB = 360 menit

    logs.forEach((l) => {
      const timeStr = formatTimeOnly(l.waktu);
      if (timeStr && timeStr !== "--:--") {
        const parts = timeStr.split(":");
        const mins = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);

        if (timeStr < earliestTimeStr) {
          earliestTimeStr = timeStr;
        }

        if (mins <= limitMins) {
          onTimeCount++;
          totalOnTimeMinutes += mins;

          // Skor Ketepatan Waktu Per Hari (06:00 = 100 poin, menurun hingga 07:15 = 50 poin)
          const delta = Math.max(0, mins - targetMins);
          const range = Math.max(1, limitMins - targetMins);
          const dayScore = Math.max(50, 100 - (delta * 50 / range));
          sumPunctualityScore += dayScore;
        } else {
          lateCount++;
          sumPunctualityScore += 0;
        }
      }
    });

    const totalAttendance = onTimeCount + lateCount;
    const onTimeRate = totalAttendance > 0 ? (onTimeCount / totalAttendance) : 0;
    const avgOnTimeMins = onTimeCount > 0 ? totalOnTimeMinutes / onTimeCount : 9999;
    const avgPunctualityScore = totalAttendance > 0 ? (sumPunctualityScore / totalAttendance) : 0;

    // 2. SKALA BOBOT VOLUME KEHADIRAN (Mencegah guru yang baru 1x absen langsung Top 1)
    // Target volume minimal disesuaikan dengan 70% kehadiran terbanyak (minimal 3 hari)
    const targetVolume = Math.max(3, maxAttendanceCount * 0.7);
    const volumeFactor = Math.min(1.0, totalAttendance / targetVolume);

    // Skor Komposit Dasar (0 - 100 Poin)
    const rawDisciplineScore = totalAttendance > 0
      ? (avgPunctualityScore * 0.45) + (onTimeRate * 45) + Math.min(10, onTimeCount * 0.5)
      : 0;

    // Skor Akhir Setelah Dikalikan Faktor Kuantitas Kehadiran
    const finalDisciplineScore = rawDisciplineScore * volumeFactor;

    const avgHours = Math.floor(avgOnTimeMins / 60);
    const avgMinsRem = Math.round(avgOnTimeMins % 60);
    const avgTimeDisplay = onTimeCount > 0
      ? `${String(avgHours).padStart(2, "0")}:${String(avgMinsRem).padStart(2, "0")} WIB`
      : "-";

    return {
      nama: g.nama,
      mapel: g.mapel || "Guru",
      foto: g.foto || "https://iili.io/KjIKMJ9.png",
      onTimeCount: onTimeCount,
      lateCount: lateCount,
      totalAttendance: totalAttendance,
      onTimeRatePercent: Math.round(onTimeRate * 100),
      avgOnTimeMins: avgOnTimeMins,
      avgTimeDisplay: avgTimeDisplay,
      earliestTimeStr: earliestTimeStr !== "23:59" ? earliestTimeStr + " WIB" : "-",
      disciplineScore: Math.round(finalDisciplineScore * 10) / 10,
    };
  });

  // 3. URUTKAN LEADERBOARD KEDISIPLINAN SEsecara ADIL DAN ADIL
  stats.sort((a, b) => {
    if (a.totalAttendance === 0 && b.totalAttendance === 0) return 0;
    if (a.totalAttendance === 0) return 1;
    if (b.totalAttendance === 0) return -1;

    // Urutan 1: Skor Kedisiplinan Tertinggi (Kuantitas + Ketepatan Waktu Pagi)
    if (b.disciplineScore !== a.disciplineScore) {
      return b.disciplineScore - a.disciplineScore;
    }

    // Urutan 2: Jumlah kehadiran tepat waktu terbanyak
    if (b.onTimeCount !== a.onTimeCount) {
      return b.onTimeCount - a.onTimeCount;
    }

    // Urutan 3: Rata-rata jam masuk paling pagi
    return a.avgOnTimeMins - b.avgOnTimeMins;
  });

  leaderboardList.innerHTML = "";
  const badges = ["🥇", "🥈", "🥉"];

  stats.forEach((st, idx) => {
    const badgeSymbol = badges[idx] || `${idx + 1}.`;
    const isTop1 = idx === 0 && st.totalAttendance > 0;
    const isLowVolume = st.totalAttendance < 3 && st.totalAttendance > 0;

    leaderboardList.innerHTML += `
      <div 
        onclick="showLeaderboardDetailModal('${st.nama}')"
        title="Klik untuk melihat rincian presensi ${st.nama}"
        class="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 ${isTop1 ? "bg-amber-50/90 border-2 border-amber-400 shadow-md" : "bg-slate-50 border border-slate-200"} rounded-2xl transition hover:shadow-md hover:scale-[1.01] cursor-pointer gap-2.5"
      >
        <div class="flex items-center space-x-3 min-w-0">
          <span class="text-base sm:text-lg font-extrabold flex-shrink-0 text-slate-700 w-6 text-center">${badgeSymbol}</span>
          <img src="${st.foto}" class="w-11 h-11 sm:w-12 sm:h-12 rounded-full border-2 border-amber-400 object-cover bg-white flex-shrink-0 shadow-sm" />
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-1.5">
              <span class="text-xs sm:text-sm font-bold text-slate-800 break-words leading-tight">${st.nama}</span>
              ${isTop1 ? '<span class="text-[9px] font-black bg-amber-500 text-slate-900 px-2 py-0.5 rounded-full inline-block shadow-sm">👑 Juara 1 Kedisiplinan</span>' : ""}
              ${isLowVolume ? '<span class="text-[9px] font-semibold bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded">Min. Kehadiran</span>' : ""}
            </div>
            <p class="text-[10px] sm:text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-x-2">
              <span>Rata-rata Masuk: <strong class="text-emerald-700 font-bold">${st.avgTimeDisplay}</strong></span>
              <span class="text-slate-300">•</span>
              <span>Paling Pagi: <strong class="text-slate-700 font-semibold">${st.earliestTimeStr}</strong></span>
            </p>
          </div>
        </div>
        
        <div class="flex sm:flex-col justify-between sm:justify-center items-end text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200/80 flex-shrink-0 pl-9 sm:pl-0 gap-0.5">
          <span class="text-xs font-extrabold text-amber-700 bg-amber-100 sm:bg-transparent px-2 py-0.5 sm:p-0 rounded-md">⭐ ${st.disciplineScore} Poin</span>
          <span class="text-[10px] text-slate-500 font-semibold">${st.onTimeRatePercent}% Tepat Waktu (${st.onTimeCount}/${st.totalAttendance} Hari)</span>
        </div>
      </div>
    `;
  });
}

function showLeaderboardDetailModal(teacherNama) {
  const modal = document.getElementById("leaderboardDetailModal");
  if (!modal) return;

  const g = teachersData.find((t) => t.nama.trim() === teacherNama.trim());
  if (!g) return;

  const logs = attendanceLogs.filter(
    (l) => l.guruNama && l.guruNama.trim() === g.nama.trim() && l.status === "Masuk"
  );

  let onTimeCount = 0;
  let lateCount = 0;
  let totalOnTimeMinutes = 0;
  let earliestTimeStr = "23:59";
  let sumPunctualityScore = 0;

  const jamTerlambatParts = (configJam.jamTerlambat || "07:15").split(":");
  const limitMins = parseInt(jamTerlambatParts[0], 10) * 60 + parseInt(jamTerlambatParts[1], 10);
  const targetMins = 6 * 60;

  logs.sort((a, b) => new Date(b.waktu).getTime() - new Date(a.waktu).getTime());

  logs.forEach((l) => {
    const timeStr = formatTimeOnly(l.waktu);
    if (timeStr && timeStr !== "--:--") {
      const parts = timeStr.split(":");
      const mins = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);

      if (timeStr < earliestTimeStr) {
        earliestTimeStr = timeStr;
      }

      if (mins <= limitMins) {
        onTimeCount++;
        totalOnTimeMinutes += mins;
        const delta = Math.max(0, mins - targetMins);
        const range = Math.max(1, limitMins - targetMins);
        const dayScore = Math.max(50, 100 - (delta * 50 / range));
        sumPunctualityScore += dayScore;
      } else {
        lateCount++;
      }
    }
  });

  const totalAttendance = onTimeCount + lateCount;
  const onTimeRate = totalAttendance > 0 ? (onTimeCount / totalAttendance) : 0;
  const avgOnTimeMins = onTimeCount > 0 ? totalOnTimeMinutes / onTimeCount : 9999;
  const avgPunctualityScore = totalAttendance > 0 ? (sumPunctualityScore / totalAttendance) : 0;

  let maxAttendanceCount = 1;
  teachersData.forEach((tc) => {
    const c = attendanceLogs.filter(
      (l) => l.guruNama && l.guruNama.trim() === tc.nama.trim() && l.status === "Masuk"
    ).length;
    if (c > maxAttendanceCount) maxAttendanceCount = c;
  });

  const targetVolume = Math.max(3, maxAttendanceCount * 0.7);
  const volumeFactor = Math.min(1.0, totalAttendance / targetVolume);
  const rawDisciplineScore = totalAttendance > 0
    ? (avgPunctualityScore * 0.45) + (onTimeRate * 45) + Math.min(10, onTimeCount * 0.5)
    : 0;
  const finalDisciplineScore = rawDisciplineScore * volumeFactor;

  const avgHours = Math.floor(avgOnTimeMins / 60);
  const avgMinsRem = Math.round(avgOnTimeMins % 60);
  const avgTimeDisplay = onTimeCount > 0
    ? `${String(avgHours).padStart(2, "0")}:${String(avgMinsRem).padStart(2, "0")} WIB`
    : "-";

  // Populate Modal UI
  const avEl = document.getElementById("lbModalAvatar");
  const nmEl = document.getElementById("lbModalName");
  const mpEl = document.getElementById("lbModalMapel");
  const npEl = document.getElementById("lbModalNip");

  if (avEl) avEl.src = g.foto || "https://iili.io/KjIKMJ9.png";
  if (nmEl) nmEl.innerText = g.nama;
  if (mpEl) mpEl.innerText = "Mata Pelajaran: " + (g.mapel || "Guru");
  if (npEl) npEl.innerText = "NIP: " + (g.nip || "-");

  const scEl = document.getElementById("lbModalScore");
  const otEl = document.getElementById("lbModalOnTimePercent");
  const tmEl = document.getElementById("lbModalAvgTime");
  const erEl = document.getElementById("lbModalEarliest");
  const lcEl = document.getElementById("lbModalLogCount");

  if (scEl) scEl.innerText = (Math.round(finalDisciplineScore * 10) / 10) + " Poin";
  if (otEl) otEl.innerText = Math.round(onTimeRate * 100) + "% (" + onTimeCount + "/" + totalAttendance + ")";
  if (tmEl) tmEl.innerText = avgTimeDisplay;
  if (erEl) erEl.innerText = earliestTimeStr !== "23:59" ? earliestTimeStr + " WIB" : "-";
  if (lcEl) lcEl.innerText = logs.length + " Catatan";

  // Render History Table Body
  const tbody = document.getElementById("lbModalLogsTableBody");
  if (tbody) {
    if (logs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" class="p-3 text-center text-slate-400">Belum ada riwayat jam masuk guru ini.</td></tr>`;
    } else {
      let html = "";
      logs.forEach((l) => {
        const dateDisplay = formatOnlyDate(l.waktu);
        const timeDisplay = formatTimeOnly(l.waktu);
        const timeParts = timeDisplay.split(":");
        const mins = parseInt(timeParts[0], 10) * 60 + parseInt(timeParts[1], 10);

        const isOnTime = mins <= limitMins;
        const statusBadge = isOnTime
          ? `<span class="px-2 py-0.5 text-[9px] font-bold rounded-full bg-emerald-100 text-emerald-800">Tepat Waktu</span>`
          : `<span class="px-2 py-0.5 text-[9px] font-bold rounded-full bg-rose-100 text-rose-800">Terlambat</span>`;

        html += `
          <tr class="border-b hover:bg-slate-50">
            <td class="p-2 font-medium text-slate-700">${dateDisplay}</td>
            <td class="p-2 font-bold text-slate-800">${timeDisplay} WIB</td>
            <td class="p-2 text-center">${statusBadge}</td>
            <td class="p-2 text-slate-500 truncate max-w-[140px]">${l.address || l.keterangan || "-"}</td>
          </tr>
        `;
      });
      tbody.innerHTML = html;
    }
  }

  modal.classList.remove("hidden");
}

function closeLeaderboardDetailModal() {
  const modal = document.getElementById("leaderboardDetailModal");
  if (modal) modal.classList.add("hidden");
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

      const rawBase = canvas.toDataURL("image/jpeg", 0.7);
      const fotoBase64 = await compressImageBase64(rawBase, 300, 0.6);

      showToast("Mengunggah foto profil ke Server...", "info");
      const res = await apiCall("updateGuruFoto", { nama: selectedGuru.nama, foto: fotoBase64 });
      if (res && res.success) {
        showToast("Foto Profil Guru Berhasil Diperbarui!", "success");
        selectedGuru.foto = fotoBase64;
        document.getElementById("profileAvatar").src = fotoBase64;
        document.getElementById("dashAvatar").src = fotoBase64;
        document.getElementById("formAvatar").src = fotoBase64;
        loadRealtimeData(true);
      } else {
        showToast(res.message || "Gagal mengunggah foto profil.", "error");
      }
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}
