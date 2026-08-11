// Global Configuration and Application State
let gasUrl = localStorage.getItem("yppm_gas_url") || "https://script.google.com/macros/s/AKfycbyNHOZ49ekilhIwd22Dw1UOmmmrrPnqlpIANtwk4pY9ucJthloO8T1VcvWSm_x2Dt7d/exec";

let teachersData = [];
let attendanceLogs = [];
let izinLogs = [];
let selectedGuru = null;
let currentAttendanceStatus = "Masuk";
let currentGeoLocation = { lat: null, lng: null, address: "Lokasi belum didapatkan" };

let photoBase64 = null;
let cameraStream = null;
let deferredPrompt = null;

let configJam = { jamMasuk: "07:00", jamTerlambat: "07:15", jamPulang: "15:00" };
let customConfirmCallback = null;

let calSelectedYear = new Date().getFullYear();
let calSelectedMonth = new Date().getMonth();

// Date & Time Utility Functions
function parseToDateKey(dateVal) {
  if (!dateVal) return "";
  let d;
  if (typeof dateVal === "string") {
    const trimmed = dateVal.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
    d = new Date(trimmed);
  } else {
    d = new Date(dateVal);
  }
  if (isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatOnlyDate(dateVal) {
  if (!dateVal) return "-";
  const key = parseToDateKey(dateVal);
  if (!key) return String(dateVal);
  const parts = key.split("-");
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTimeOnly(timeVal, defaultVal = "--:--") {
  if (!timeVal) return defaultVal;
  if (typeof timeVal === "string" && /^\d{1,2}:\d{2}(:\d{2})?$/.test(timeVal.trim())) {
    const parts = timeVal.trim().split(":");
    return `${parts[0].padStart(2, "0")}:${parts[1].padStart(2, "0")}`;
  }
  const d = new Date(timeVal);
  if (!isNaN(d.getTime())) {
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  }
  return String(timeVal);
}

function isSameDay(date1, date2) {
  const key1 = parseToDateKey(date1);
  const key2 = parseToDateKey(date2);
  return key1 !== "" && key1 === key2;
}

// Ultra-Fast Image Base64 Compression Helper (Reduces size by 80-90%)
function compressImageBase64(dataUrl, maxDim = 400, quality = 0.6) {
  return new Promise((resolve) => {
    if (!dataUrl || !dataUrl.startsWith("data:image")) {
      resolve(dataUrl);
      return;
    }
    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);
      const compressed = canvas.toDataURL("image/jpeg", quality);
      resolve(compressed);
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

// Local Cache Manager for Instant Application Load (Stale-While-Revalidate)
const CACHE_KEY_DATA = "yppm_app_initial_cache_v1";

function saveLocalCache(data) {
  try {
    if (!data) return;
    localStorage.setItem(
      CACHE_KEY_DATA,
      JSON.stringify({
        guruList: data.guruList || [],
        attendanceLogs: data.attendanceLogs || [],
        izinLogs: data.izinLogs || [],
        config: data.config || null,
        timestamp: Date.now(),
      })
    );
  } catch (e) {
    console.warn("Local cache save failed:", e);
  }
}

function loadLocalCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY_DATA);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

