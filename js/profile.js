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

  const stats = teachersData.map((g) => {
    const logs = attendanceLogs.filter(
      (l) => l.guruNama && l.guruNama.trim() === g.nama.trim() && l.status === "Masuk"
    );

    let onTimeCount = 0;
    let lateCount = 0;
    let totalOnTimeMinutes = 0;
    let earliestTimeStr = "23:59";
    let sumPunctualityScore = 0;

    // Convert jamTerlambat to minutes from midnight (default 07:15 = 435 mins)
    const jamTerlambatParts = (configJam.jamTerlambat || "07:15").split(":");
    const limitMins = parseInt(jamTerlambatParts[0], 10) * 60 + parseInt(jamTerlambatParts[1], 10);
    const targetMins = 6 * 60; // Target kedatangan ideal 06:00 WIB = 360 mins

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

          // Skor Ketepatan Waktu Per Hari:
          // Jam 06:00 WIB = 100 poin, menurun proporsional hingga jamTerlambat (07:15 WIB) = 50 poin
          const delta = Math.max(0, mins - targetMins);
          const range = Math.max(1, limitMins - targetMins);
          const dayScore = Math.max(50, 100 - (delta * 50 / range));
          sumPunctualityScore += dayScore;
        } else {
          lateCount++;
          sumPunctualityScore += 0; // 0 poin jika terlambat
        }
      }
    });

    const totalAttendance = onTimeCount + lateCount;
    const onTimeRate = totalAttendance > 0 ? (onTimeCount / totalAttendance) : 0;
    const avgOnTimeMins = onTimeCount > 0 ? totalOnTimeMinutes / onTimeCount : 9999;
    const avgPunctualityScore = totalAttendance > 0 ? (sumPunctualityScore / totalAttendance) : 0;

    // Algoritma Komposit Skor Kedisiplinan Guru (0 - 100 Poin):
    // - 50% Bobot Kedatangan Pagi (Mendekati 06:00 WIB)
    // - 40% Bobot Persentase Tepat Waktu (%)
    // - 10% Bonus Konsistensi Kehadiran On-Time
    const totalDisciplineScore = totalAttendance > 0
      ? (avgPunctualityScore * 0.5) + (onTimeRate * 40) + Math.min(10, onTimeCount * 0.5)
      : 0;

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
      disciplineScore: Math.round(totalDisciplineScore * 10) / 10,
    };
  });

  stats.sort((a, b) => {
    // Guru tanpa kehadiran ditempatkan di paling bawah
    if (a.totalAttendance === 0 && b.totalAttendance === 0) return 0;
    if (a.totalAttendance === 0) return 1;
    if (b.totalAttendance === 0) return -1;

    // Urutan 1: Skor Kedisiplinan Tertinggi (Poin 06:00 WIB + Konsistensi Tepat Waktu %)
    if (b.disciplineScore !== a.disciplineScore) {
      return b.disciplineScore - a.disciplineScore;
    }

    // Urutan 2: Rata-rata jam masuk paling pagi (mendekati 06:00 WIB)
    if (a.avgOnTimeMins !== b.avgOnTimeMins) {
      return a.avgOnTimeMins - b.avgOnTimeMins;
    }

    // Urutan 3: Jumlah hari tepat waktu terbanyak
    return b.onTimeCount - a.onTimeCount;
  });

  leaderboardList.innerHTML = "";
  const badges = ["🥇", "🥈", "🥉"];

  stats.forEach((st, idx) => {
    const badgeSymbol = badges[idx] || `${idx + 1}.`;
    const isTop1 = idx === 0 && st.totalAttendance > 0;

    leaderboardList.innerHTML += `
      <div class="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 ${isTop1 ? "bg-amber-50/90 border-2 border-amber-400 shadow-md" : "bg-slate-50 border border-slate-200"} rounded-2xl transition hover:shadow-md gap-2.5">
        <div class="flex items-center space-x-3 min-w-0">
          <span class="text-base sm:text-lg font-extrabold flex-shrink-0 text-slate-700 w-6 text-center">${badgeSymbol}</span>
          <img src="${st.foto}" class="w-11 h-11 sm:w-12 sm:h-12 rounded-full border-2 border-amber-400 object-cover bg-white flex-shrink-0 shadow-sm" />
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-1.5">
              <span class="text-xs sm:text-sm font-bold text-slate-800 break-words leading-tight">${st.nama}</span>
              ${isTop1 ? '<span class="text-[9px] font-black bg-amber-500 text-slate-900 px-2 py-0.5 rounded-full inline-block shadow-sm">👑 Juara 1 Kedisiplinan</span>' : ""}
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

