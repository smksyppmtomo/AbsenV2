// Main Application Initializer
document.addEventListener("DOMContentLoaded", () => {
  initClock();
  initDates();
  loadRealtimeData();
  getCurrentLocation();
  autoSelectStatusByCurrentTime();

  // Attach global event listener for custom modal actions
  const customConfirmBtn = document.getElementById("customConfirmBtnAction");
  if (customConfirmBtn) {
    customConfirmBtn.addEventListener("click", () => {
      if (typeof customConfirmCallback === "function") {
        const action = customConfirmCallback;
        closeCustomConfirmModal();
        action();
      } else {
        closeCustomConfirmModal();
      }
    });
  }
});
