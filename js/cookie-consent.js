(function () {
  const banner = document.getElementById("cookie-banner");
  const acceptBtn = document.getElementById("cookie-accept");
  const STORAGE_KEY = "cookie-consent-ack";

  try {
    if (!localStorage.getItem(STORAGE_KEY)) {
      banner.classList.remove("hidden");
    }
  } catch (e) {
    // localStorage unavailable (e.g. private mode edge case) — skip the banner rather than error.
  }

  acceptBtn.addEventListener("click", () => {
    banner.classList.add("hidden");
    try { localStorage.setItem(STORAGE_KEY, "1"); } catch (e) { /* ignore */ }
  });
})();
