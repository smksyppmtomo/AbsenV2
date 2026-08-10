// GPS Geolocation Module
function getCurrentLocation() {
  const locAddress = document.getElementById("locAddress");
  const locCoords = document.getElementById("locCoords");
  const mapIframe = document.getElementById("mapIframe");

  if (locAddress) locAddress.innerText = "Mengambil koordinat GPS...";

  if (!navigator.geolocation) {
    if (locAddress) locAddress.innerText = "Geolocation tidak didukung browser ini.";
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      currentGeoLocation = { lat, lng, address: `Koordinat GPS (${lat.toFixed(5)}, ${lng.toFixed(5)})` };

      if (locCoords) locCoords.innerText = `Lat: ${lat.toFixed(6)} | Lng: ${lng.toFixed(6)}`;
      if (mapIframe) mapIframe.src = `https://maps.google.com/maps?q=${lat},${lng}&z=17&output=embed`;

      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
        const data = await res.json();
        if (data && data.display_name) {
          currentGeoLocation.address = data.display_name;
          if (locAddress) locAddress.innerText = data.display_name;
        }
      } catch (e) {
        if (locAddress) locAddress.innerText = `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`;
      }
      if (typeof updateFormProgress === "function") updateFormProgress();
    },
    (err) => {
      if (locAddress) locAddress.innerText = "Gagal membaca lokasi GPS. Pastikan izin lokasi aktif.";
      if (mapIframe) mapIframe.src = "about:blank";
      if (typeof updateFormProgress === "function") updateFormProgress();
    },
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
  );
}
