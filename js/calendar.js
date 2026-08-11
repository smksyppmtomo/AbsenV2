// Monthly Attendance Calendar Module
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
  if (calMonthLabel) calMonthLabel.innerText = `${monthNames[calSelectedMonth]} ${calSelectedYear}`;

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
