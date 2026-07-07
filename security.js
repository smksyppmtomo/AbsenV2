/**
 * SECURITY UTILITIES - Encryption, Sanitization, CSRF Protection
 * Perbaikan Keamanan untuk Aplikasi Absensi
 */

// ============================================================================
// 1. SANITIZATION - Cegah XSS Attack
// ============================================================================

/**
 * Sanitasi string untuk mencegah XSS
 * @param {string} str - String yang perlu di-sanitasi
 * @returns {string} - String yang aman
 */
function sanitizeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Sanitasi HTML attribute
 * @param {string} str - String untuk attribute
 * @returns {string} - String yang aman untuk attribute
 */
function sanitizeAttr(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML.replace(/"/g, "&quot;").replace(/'/g, "&#x27;");
}

/**
 * Buat element dengan text content (aman dari XSS)
 * @param {string} tag - Tag HTML
 * @param {string} text - Text content
 * @param {string} className - CSS class (optional)
 * @returns {HTMLElement}
 */
function createSafeElement(tag, text, className = "") {
  const el = document.createElement(tag);
  el.textContent = text; // Gunakan textContent, bukan innerHTML
  if (className) el.className = className;
  return el;
}

// ============================================================================
// 2. CSRF TOKEN MANAGEMENT
// ============================================================================

const CSRF_STORAGE_KEY = "csrf_token_absensi";
const CSRF_HEADER = "X-CSRF-Token";

/**
 * Generate CSRF Token
 * @returns {string} - CSRF token
 */
function generateCSRFToken() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/**
 * Dapatkan atau buat CSRF Token
 * @returns {string} - CSRF token
 */
function getCSRFToken() {
  let token = sessionStorage.getItem(CSRF_STORAGE_KEY);
  if (!token) {
    token = generateCSRFToken();
    sessionStorage.setItem(CSRF_STORAGE_KEY, token);
  }
  return token;
}

/**
 * Verifikasi CSRF Token dari response
 * @param {string} token - Token dari response
 * @returns {boolean} - Valid atau tidak
 */
function verifyCSRFToken(token) {
  const stored = sessionStorage.getItem(CSRF_STORAGE_KEY);
  return stored && stored === token;
}

// ============================================================================
// 3. DATA ENCRYPTION (Optional - untuk data sensitif)
// ============================================================================

/**
 * Simple encryption menggunakan TextEncoder
 * Untuk produksi, gunakan library seperti crypto-js
 * @param {string} text - Text yang akan di-encrypt
 * @param {string} key - Secret key
 * @returns {string} - Encrypted text (Base64)
 */
function encryptData(text, key) {
  try {
    // Simple XOR + Base64 encoding (JANGAN untuk produksi)
    // Untuk produksi gunakan: https://github.com/brix/crypto-js
    let encrypted = "";
    for (let i = 0; i < text.length; i++) {
      encrypted += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return btoa(encrypted);
  } catch (error) {
    console.error("Encryption error:", error);
    return text;
  }
}

/**
 * Decrypt data
 * @param {string} encrypted - Encrypted text (Base64)
 * @param {string} key - Secret key
 * @returns {string} - Decrypted text
 */
function decryptData(encrypted, key) {
  try {
    let decrypted = atob(encrypted);
    let text = "";
    for (let i = 0; i < decrypted.length; i++) {
      text += String.fromCharCode(decrypted.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return text;
  } catch (error) {
    console.error("Decryption error:", error);
    return "";
  }
}

// ============================================================================
// 4. SECURE API CALLS
// ============================================================================

/**
 * Buat secure fetch request dengan CSRF token
 * @param {string} url - URL endpoint
 * @param {object} options - Fetch options
 * @returns {Promise<Response>}
 */
async function secureApiFetch(url, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    [CSRF_HEADER]: getCSRFToken(),
    ...options.headers,
  };

  // Tambah rate limiting header
  headers["X-Request-ID"] = generateCSRFToken().substring(0, 16);

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response;
}

// ============================================================================
// 5. INPUT VALIDATION
// ============================================================================

/**
 * Validasi input name (hanya huruf, spasi, dan tanda baca umum)
 * @param {string} name - Name input
 * @returns {object} - { valid: boolean, error: string }
 */
function validateName(name) {
  name = name.trim();

  if (!name || name.length < 3) {
    return { valid: false, error: "Nama minimal 3 karakter" };
  }

  if (name.length > 100) {
    return { valid: false, error: "Nama maksimal 100 karakter" };
  }

  // Cek invalid characters (hanya buka input yang aman)
  if (!/^[a-zA-Z\s\.\,\-\(\)]+$/.test(name)) {
    return { valid: false, error: "Nama hanya boleh huruf, spasi, dan tanda baca dasar" };
  }

  return { valid: true, error: "" };
}

/**
 * Validasi status attendance
 * @param {string} status - Status value
 * @returns {boolean}
 */
function validateStatus(status) {
  const validStatuses = ["masuk", "pulang", "dinas"];
  return validStatuses.includes(status);
}

/**
 * Validasi coordinates GPS
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {boolean}
 */
function validateCoordinates(lat, lng) {
  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

/**
 * Validasi image size (max 2MB)
 * @param {string} base64 - Base64 image data
 * @returns {object} - { valid: boolean, error: string, size: number }
 */
function validateImageSize(base64) {
  if (!base64) {
    return { valid: false, error: "Foto tidak boleh kosong", size: 0 };
  }

  // Approx size: Base64 = 4/3 dari binary size
  const bytes = Math.ceil((base64.length * 3) / 4);
  const maxBytes = 2 * 1024 * 1024; // 2MB

  if (bytes > maxBytes) {
    return {
      valid: false,
      error: `Foto terlalu besar (${(bytes / 1024 / 1024).toFixed(1)}MB > 2MB)`,
      size: bytes,
    };
  }

  return { valid: true, error: "", size: bytes };
}

// ============================================================================
// 6. SECURE STORAGE (LocalStorage dengan enkripsi)
// ============================================================================

const SECURE_STORAGE_PREFIX = "secure_";
const SECURE_STORAGE_KEY = "YPPM_TOMO_SECRET_2024"; // Ubah sesuai kebutuhan

/**
 * Simpan data ke secure storage (terenkripsi)
 * @param {string} key - Storage key
 * @param {any} value - Value (akan di-stringify)
 */
function setSecureStorage(key, value) {
  try {
    const json = JSON.stringify(value);
    const encrypted = encryptData(json, SECURE_STORAGE_KEY);
    localStorage.setItem(SECURE_STORAGE_PREFIX + key, encrypted);
  } catch (error) {
    console.error("Secure storage error:", error);
  }
}

/**
 * Baca data dari secure storage (decrypt)
 * @param {string} key - Storage key
 * @returns {any} - Decrypted value
 */
function getSecureStorage(key) {
  try {
    const encrypted = localStorage.getItem(SECURE_STORAGE_PREFIX + key);
    if (!encrypted) return null;
    const json = decryptData(encrypted, SECURE_STORAGE_KEY);
    return JSON.parse(json);
  } catch (error) {
    console.error("Secure storage read error:", error);
    return null;
  }
}

/**
 * Hapus secure storage
 * @param {string} key - Storage key
 */
function removeSecureStorage(key) {
  localStorage.removeItem(SECURE_STORAGE_PREFIX + key);
}

// ============================================================================
// 7. ADMIN AUTHENTICATION - BACKEND VERIFICATION
// ============================================================================

/**
 * Verifikasi admin session
 * Harus dikombinasikan dengan backend validation
 * @returns {boolean}
 */
function isValidAdminSession() {
  const sessionToken = getSecureStorage("admin_session");
  if (!sessionToken) return false;

  // Cek expiration (4 jam)
  const now = Date.now();
  if (now - sessionToken.timestamp > 4 * 60 * 60 * 1000) {
    removeSecureStorage("admin_session");
    return false;
  }

  return true;
}

/**
 * Clear admin session
 */
function clearAdminSession() {
  removeSecureStorage("admin_session");
}

// ============================================================================
// 8. CONTENT SECURITY POLICY Helper
// ============================================================================

/**
 * Set CSP meta tag (harus juga di-set di HTTP header)
 */
function setContentSecurityPolicy() {
  const cspMeta = document.createElement("meta");
  cspMeta.httpEquiv = "Content-Security-Policy";
  cspMeta.content = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' cdn.tailwindcss.com cdn.jsdelivr.net unpkg.com;
    style-src 'self' 'unsafe-inline' fonts.googleapis.com fonts.gstatic.com cdn.tailwindcss.com;
    img-src 'self' data: https:;
    font-src 'self' fonts.gstatic.com;
    connect-src 'self' script.google.com api.open-meteo.com nominatim.openstreetmap.org tile.openstreetmap.org;
    frame-ancestors 'none';
    form-action 'self';
    base-uri 'self';
    require-trusted-types-for 'script';
  `.replace(/\n/g, "");
  document.head.appendChild(cspMeta);
}

// ============================================================================
// 9. RATE LIMITING
// ============================================================================

class RateLimiter {
  constructor(maxRequests = 5, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = [];
  }

  isAllowed() {
    const now = Date.now();
    // Hapus request yang sudah lama
    this.requests = this.requests.filter((time) => now - time < this.windowMs);

    if (this.requests.length >= this.maxRequests) {
      return false;
    }

    this.requests.push(now);
    return true;
  }

  getRemainingTime() {
    if (this.requests.length === 0) return 0;
    const oldestRequest = this.requests[0];
    return Math.ceil((this.windowMs - (Date.now() - oldestRequest)) / 1000);
  }
}

const apiRateLimiter = new RateLimiter(10, 60000); // 10 requests per minute

// ============================================================================
// 10. LOG SECURITY EVENTS
// ============================================================================

/**
 * Log security event (send ke backend)
 * @param {string} event - Event name
 * @param {object} data - Event data
 */
function logSecurityEvent(event, data = {}) {
  const log = {
    timestamp: new Date().toISOString(),
    event: event,
    userAgent: navigator.userAgent,
    url: window.location.href,
    data: data,
  };

  // Console untuk development
  console.warn("[SECURITY]", log);

  // Kirim ke backend untuk logging (optional)
  // fetch(getAppsScriptUrl() + '?action=logSecurityEvent', {
  //   method: 'POST',
  //   body: JSON.stringify(log)
  // }).catch(err => console.error('Failed to log security event:', err));
}

// ============================================================================
// Export untuk digunakan
// ============================================================================
