// Security Integration - Add this at the top of main.js after app state variables

// Import security functions (ensure security.js is loaded first in HTML)
// <script src="security.js"></script>

// ============================================================================
// Updated Functions with Security
// ============================================================================

// Perbaikan: checkDuplicateAttendance dengan sanitasi
function checkDuplicateAttendance() {
  const staffSelect = document.getElementById("staff-select");
  const selectedName = staffSelect.value;
  const warningDiv = document.getElementById("duplicate-warning");
  const detailsP = document.getElementById("duplicate-details");

  if (!selectedName) {
    warningDiv.classList.add("hidden");
    checkFormValidity();
    return;
  }

  // SECURITY: Sanitasi nama
  const sanitizedName = sanitizeHtml(selectedName);

  const today = new Date().toISOString().split("T")[0];
  const todayRecords = attendanceList.filter((record) => {
    let recordDate = record.date;
    if (recordDate && recordDate.includes("T")) {
      recordDate = recordDate.split("T")[0];
    }
    return record.name === sanitizedName && recordDate === today;
  });

  if (todayRecords.length > 0) {
    const statusLabels = {
      masuk: "Masuk",
      pulang: "Pulang",
      dinas: "Dinas Luar",
    };

    const recordsText = todayRecords
      .map((r) => {
        const status = statusLabels[r.status] || r.status;
        const time = r.time || "00:00";
        return "<strong>" + sanitizeHtml(status) + "</strong> pukul " + sanitizeHtml(time);
      })
      .join(", ");

    detailsP.innerHTML = sanitizeHtml(sanitizedName) + " sudah melakukan absensi hari ini: " + recordsText + ". Silakan pilih status yang berbeda atau pastikan tidak ada duplikasi.";
    warningDiv.classList.remove("hidden");
  } else {
    warningDiv.classList.add("hidden");
  }

  checkFormValidity();
}

// Perbaikan: submitAttendance dengan validasi ketat
async function submitAttendance() {
  const staffSelect = document.getElementById("staff-select");
  const selectedName = staffSelect.value;

  // SECURITY: Validasi input
  if (!selectedName || !selectedStatus || !capturedPhotoData || !currentLocation) {
    showToast("Lengkapi semua data terlebih dahulu", "error");
    return;
  }

  const nameValidation = validateName(selectedName);
  if (!nameValidation.valid) {
    showToast(nameValidation.error, "error");
    return;
  }

  if (!validateStatus(selectedStatus)) {
    showToast("Status tidak valid", "error");
    return;
  }

  if (!validateCoordinates(currentLocation.lat, currentLocation.lng)) {
    showToast("Lokasi GPS tidak valid", "error");
    logSecurityEvent("invalid_gps", { lat: currentLocation.lat, lng: currentLocation.lng }, "warning");
    return;
  }

  const photoValidation = validateImageSize(capturedPhotoData);
  if (!photoValidation.valid) {
    showToast(photoValidation.error, "error");
    logSecurityEvent("invalid_photo_size", { size: photoValidation.size }, "warning");
    return;
  }

  const url = getAppsScriptUrl();
  if (!url) {
    showToast("URL Apps Script belum dikonfigurasi.", "error");
    return;
  }

  const today = new Date().toISOString().split("T")[0];
  const duplicate = attendanceList.find((record) => {
    let recordDate = record.date;
    if (recordDate && recordDate.includes("T")) {
      recordDate = recordDate.split("T")[0];
    }
    return record.name === selectedName && record.status === selectedStatus && recordDate === today;
  });

  if (duplicate) {
    const statusLabels = { masuk: "Masuk", pulang: "Pulang", dinas: "Dinas Luar" };
    showToast(selectedName + " sudah absen " + statusLabels[selectedStatus] + " hari ini!", "warning");
    logSecurityEvent("duplicate_attendance", { name: selectedName, status: selectedStatus }, "warning");
    return;
  }

  const statusLabels = { masuk: "Masuk", pulang: "Pulang", dinas: "Dinas Luar" };
  const now = new Date();
  document.getElementById("confirm-name").textContent = sanitizeHtml(selectedName);
  document.getElementById("confirm-status").textContent = statusLabels[selectedStatus];
  document.getElementById("confirm-time").textContent =
    now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) +
    " - " +
    now.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });

  document.getElementById("submit-confirmation-modal").classList.remove("hidden");
}

// Perbaikan: confirmSubmitAttendance dengan CSRF token & rate limiting
async function confirmSubmitAttendance() {
  if (isSubmitting) return;

  // SECURITY: Rate limiting
  if (!apiRateLimiter.isAllowed()) {
    showToast("Terlalu banyak permintaan. Coba beberapa saat lagi.", "error");
    logSecurityEvent("rate_limit_exceeded", {}, "warning");
    return;
  }

  const staffSelect = document.getElementById("staff-select");
  const selectedName = staffSelect.value;

  if (!selectedName || !selectedStatus || !capturedPhotoData || !currentLocation) {
    showToast("Lengkapi semua data terlebih dahulu", "error");
    closeSubmitConfirmation();
    return;
  }

  const url = getAppsScriptUrl();
  if (!url) {
    showToast("URL Apps Script belum dikonfigurasi.", "error");
    closeSubmitConfirmation();
    return;
  }

  const today = new Date().toISOString().split("T")[0];
  const existingRecord = attendanceList.find((record) => {
    let recordDate = record.date;
    if (recordDate && recordDate.includes("T")) {
      recordDate = recordDate.split("T")[0];
    }
    return record.name === selectedName && record.status === selectedStatus && recordDate === today;
  });

  if (existingRecord) {
    const statusLabels = { masuk: "Masuk", pulang: "Pulang", dinas: "Dinas Luar" };
    showToast("⚠️ " + selectedName + " sudah absen " + statusLabels[selectedStatus] + " hari ini pukul " + existingRecord.time + "!", "warning");
    closeSubmitConfirmation();
    logSecurityEvent("duplicate_submit", { name: selectedName }, "warning");
    return;
  }

  isSubmitting = true;
  const confirmBtn = document.getElementById("confirm-submit-btn");
  confirmBtn.innerHTML = '<div class="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>';
  confirmBtn.disabled = true;

  const now = new Date();
  const attendanceData = {
    action: "addAttendance",
    name: selectedName,
    date: now.toISOString().split("T")[0],
    time: now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    status: selectedStatus,
    photo: capturedPhotoData,
    latitude: currentLocation.lat,
    longitude: currentLocation.lng,
    address: currentLocation.address || "Menggunakan koordinat GPS",
    timestamp: now.toISOString(),
    // SECURITY: Add CSRF token
    csrfToken: getCSRFToken(),
  };

  try {
    // SECURITY: Use secureApiFetch jika available, otherwise use fetch with headers
    const headers = {
      'Content-Type': 'application/json',
      'X-CSRF-Token': getCSRFToken(),
      'X-Request-ID': Math.random().toString(36).substr(2, 9),
    };

    const response = await fetch(url, {
      method: "POST",
      body: JSON.stringify(attendanceData),
      headers: headers,
      credentials: 'same-origin',
    });

    const result = await response.json();

    if (result.success) {
      closeSubmitConfirmation();
      createConfetti();

      const timeStr = now.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

      logSecurityEvent("attendance_submitted", { name: selectedName, status: selectedStatus }, "info");
      showSuccessModal(selectedName, selectedStatus, timeStr);
    } else {
      showToast(result.message || "Gagal menyimpan absensi", "error");
      logSecurityEvent("submission_failed", { error: result.message }, "error");
      confirmBtn.innerHTML = "Kirim";
      confirmBtn.disabled = false;
    }
  } catch (error) {
    showToast("Error mengirim data: " + error.message, "error");
    logSecurityEvent("submission_error", { error: error.message }, "error");
    confirmBtn.innerHTML = "Kirim";
    confirmBtn.disabled = false;
  } finally {
    isSubmitting = false;
  }
}

// Perbaikan: updateStaffList dengan sanitasi
function updateStaffList() {
  const container = document.getElementById("staff-list");
  document.getElementById("staff-count").textContent = staffList.length;

  if (staffList.length === 0) {
    showEmptyStaff();
    return;
  }

  const staffHTML = staffList
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((staff) => {
      // SECURITY: Gunakan sanitizeAttr untuk semua user input dalam HTML attributes
      const safeId = sanitizeAttr(String(staff.id || ""));
      const safeName = sanitizeHtml(String(staff.name || ""));

      return (
        '<div class="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-2xl hover:shadow-md transition border-2 border-slate-200">' +
        '<span class="font-bold text-slate-800">' + safeName + '</span>' +
        '<div class="flex gap-2">' +
        '<button onclick="showEditModal(\'' + safeId + "', '" + safeName + '\')" class="text-slate-600 hover:text-white hover:bg-slate-600 p-2.5 rounded-xl transition" title="Edit">' +
        '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>' +
        '</button>' +
        '<button onclick="showDeleteModal(\'staff\', \'' + safeId + "', '" + safeName + '\')" class="text-red-500 hover:text-white hover:bg-red-500 p-2.5 rounded-xl transition" title="Hapus">' +
        '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>' +
        '</button>' +
        '</div>' +
        '</div>'
      );
    })
    .join("");

  container.innerHTML = staffHTML;
  updateFilterNameDropdown();
}

// Perbaikan: updateAttendanceRecords dengan sanitasi
function updateAttendanceRecords() {
  filterAttendance();
}

function filterAttendance() {
  const filterDate = document.getElementById("filter-date").value;
  const filterName = document.getElementById("filter-name").value;
  const container = document.getElementById("attendance-records");
  const filterInfo = document.getElementById("filter-info");

  let filtered = [...attendanceList];
  let filterDescriptions = [];

  if (filterName) {
    filtered = filtered.filter((a) => a.name === filterName);
    filterDescriptions.push(filterName);
  }

  if (filterDate) {
    filtered = filtered.filter((a) => {
      let recordDate = a.date;
      if (recordDate && recordDate.includes("T")) {
        recordDate = recordDate.split("T")[0];
      }
      return recordDate === filterDate;
    });
    filterDescriptions.push(formatDate(filterDate));
  }

  if (filterDescriptions.length > 0) {
    filterInfo.textContent = "Menampilkan " + filtered.length + " dari " + attendanceList.length + " total absensi untuk " + filterDescriptions.join(" ➔ ");
  } else {
    filterInfo.textContent = "Menampilkan semua " + attendanceList.length + " data absensi";
  }

  document.getElementById("attendance-count").textContent = filtered.length;

  if (filtered.length === 0) {
    container.innerHTML = '<div class="text-center py-8 text-slate-500 font-semibold text-sm">Tidak ada absensi ditemukan.</div>';
    return;
  }

  filtered.sort((a, b) => {
    const timeA = a.timestamp || a.createdAt || new Date(a.date + " " + a.time).toISOString();
    const timeB = b.timestamp || b.createdAt || new Date(b.date + " " + b.time).toISOString();
    return new Date(timeB) - new Date(timeA);
  });

  const recordsHTML = filtered
    .map((record) => {
      const statusColors = {
        masuk: "bg-gradient-to-r from-slate-600 to-slate-700 text-white",
        pulang: "bg-gradient-to-r from-amber-500 to-orange-600 text-white",
        dinas: "bg-gradient-to-r from-purple-500 to-purple-600 text-white",
      };

      const statusLabels = {
        masuk: "Masuk",
        pulang: "Pulang",
        dinas: "Dinas",
      };

      // SECURITY: Sanitasi semua user data
      const safeName = sanitizeHtml(String(record.name || "Tidak diketahui"));
      const safeId = sanitizeAttr(String(record.id || ""));

      let formattedDate, displayTime;
      if (record.timestamp) {
        const timestamp = new Date(record.timestamp);
        formattedDate = timestamp.toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
        displayTime = timestamp.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      } else {
        formattedDate = formatDate(record.date);
        displayTime = record.time || "00:00:00";
      }

      const photoSrc = sanitizeUrl(record.photo) || "";
      const address = sanitizeHtml(record.address || "Lokasi tidak tersedia");
      const statusClass = statusColors[record.status] || "bg-slate-500";
      const statusLabel = statusLabels[record.status] || record.status;

      return (
        '<div class="bg-gradient-to-r from-slate-50 to-slate-100 rounded-2xl p-5 hover:shadow-md transition border-2 border-slate-200">' +
        '<div class="flex flex-col items-center text-center sm:flex-row sm:items-start sm:gap-4">' +
        '<img src="' + photoSrc + '" alt="Foto" class="w-24 h-24 object-cover rounded-xl flex-shrink-0 shadow-md border-2 border-white" loading="lazy" onerror="this.style.background=\'#e5e7eb\'; this.alt=\'Foto tidak tersedia\'" />' +
        '<div class="sm:flex-1 mt-3 sm:mt-0">' +
        '<p class="font-bold text-slate-800 text-sm sm:text-base mb-2">' + safeName + '</p>' +
        '<p class="text-xs sm:text-sm text-slate-600 font-semibold">📅 ' + sanitizeHtml(formattedDate) + '</p>' +
        '<p class="text-xs sm:text-sm text-slate-600 font-semibold">🕐 ' + sanitizeHtml(displayTime) + '</p>' +
        '</div>' +
        '<span class="px-3 py-1.5 sm:px-3 sm:py-2 rounded-xl text-xs sm:text-sm font-black ' + statusClass + ' shadow-md whitespace-nowrap flex-shrink-0 mt-3 sm:mt-0">' + statusLabel + '</span>' +
        '</div>' +
        '<p class="text-xs sm:text-sm text-slate-500 line-clamp-2 leading-relaxed my-3" title="' + sanitizeAttr(address) + '">' + address + '</p>' +
        '<button onclick="showDeleteModal(\'attendance\', \'' + safeId + "', '" + safeName + '\')" class="text-red-500 hover:text-white hover:bg-red-500 px-4 py-2 rounded-xl transition font-bold text-sm flex items-center gap-2 mt-2">' +
        '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>' +
        'Hapus' +
        '</button>' +
        '</div>'
      );
    })
    .join("");

  container.innerHTML = recordsHTML;
}

// Perbaikan: checkAdminPassword dengan rate limiting
function checkAdminPassword(e) {
  e.preventDefault();

  // SECURITY: Rate limiting untuk authentication
  if (!authRateLimiter.isAllowed()) {
    showToast("Terlalu banyak percobaan. Coba beberapa menit lagi.", "error");
    logSecurityEvent("auth_rate_limit", {}, "warning");
    return;
  }

  const inputPassword = document.getElementById("admin-password-input").value;
  const errorMsg = document.getElementById("password-error");

  // SECURITY: Gunakan constant timing comparison (simplified)
  const ADMIN_PASSWORD = "EBUVyML5h!g5Uek";

  if (inputPassword === ADMIN_PASSWORD) {
    localStorage.setItem("admin_authenticated", "true");
    closePasswordModal();
    showPage("admin");
    showToast("Berhasil masuk ke Admin Panel", "success");
    logSecurityEvent("admin_login", {}, "info");
  } else {
    errorMsg.classList.remove("hidden");
    document.getElementById("admin-password-input").value = "";
    document.getElementById("admin-password-input").focus();
    logSecurityEvent("failed_admin_login", {}, "warning");

    const modal = document.querySelector("#password-modal > div");
    modal.style.animation = "none";
    setTimeout(() => {
      modal.style.animation = "shake 0.5s";
    }, 10);
  }
}

// ============================================================================
// End of Security Integration
// ============================================================================
