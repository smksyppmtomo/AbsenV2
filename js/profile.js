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

