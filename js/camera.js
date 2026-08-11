// Camera Selfie Module (Strict Front Camera Live Only - Large High-Visibility Viewport)
async function startCamera() {
  const video = document.getElementById("cameraVideo");
  const placeholder = document.getElementById("cameraPlaceholder");
  
  // Directly lock facingMode to "user" (Selfie Front Camera only)
  const facingMode = "user";

  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: facingMode, width: { ideal: 640 }, height: { ideal: 480 } },
      audio: false,
    });
    video.srcObject = cameraStream;
    video.classList.remove("hidden");
    placeholder.classList.add("hidden");
    
    const btnTake = document.getElementById("btnTakePhoto");
    if (btnTake) {
      btnTake.disabled = false;
      btnTake.classList.remove("opacity-50", "cursor-not-allowed");
    }
  } catch (err) {
    showToast("Izin kamera ditolak atau kamera selfie tidak aktif!", "error");
  }
}

async function takePhoto() {
  const video = document.getElementById("cameraVideo");
  const canvas = document.getElementById("cameraCanvas");
  const imgPreview = document.getElementById("photoPreview");

  if (!video || !canvas || !imgPreview) return;

  canvas.width = video.videoWidth || 640;
  canvas.height = video.videoHeight || 480;
  const ctx = canvas.getContext("2d");

  ctx.save();
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  ctx.restore();

  const rawBase64 = canvas.toDataURL("image/jpeg", 0.7);
  // Ultra-fast Compression to max 400px & 0.6 quality (reduces size down to ~25KB)
  photoBase64 = await compressImageBase64(rawBase64, 400, 0.6);
  imgPreview.src = photoBase64;

  video.classList.add("hidden");
  imgPreview.classList.remove("hidden");

  if (cameraStream) {
    cameraStream.getTracks().forEach((track) => track.stop());
    cameraStream = null;
  }

  const controlGroup = document.getElementById("cameraControlGroup");
  const btnReset = document.getElementById("btnResetPhoto");
  if (controlGroup) controlGroup.classList.add("hidden");
  if (btnReset) btnReset.classList.remove("hidden");

  showToast("Foto selfie presensi siap dikirim (Terkompresi super ringan!)", "success");
  if (typeof updateFormProgress === "function") updateFormProgress();
}

function resetPhoto() {
  photoBase64 = null;
  const imgPreview = document.getElementById("photoPreview");
  const placeholder = document.getElementById("cameraPlaceholder");
  const btnReset = document.getElementById("btnResetPhoto");
  const controlGroup = document.getElementById("cameraControlGroup");
  const btnTake = document.getElementById("btnTakePhoto");

  if (imgPreview) imgPreview.classList.add("hidden");
  if (placeholder) placeholder.classList.remove("hidden");
  if (btnReset) btnReset.classList.add("hidden");

  if (controlGroup) controlGroup.classList.remove("hidden");
  if (btnTake) {
    btnTake.disabled = true;
    btnTake.classList.add("opacity-50", "cursor-not-allowed");
  }

  if (typeof updateFormProgress === "function") updateFormProgress();
}
