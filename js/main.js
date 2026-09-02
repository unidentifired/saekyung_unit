(function () {
  const nav = document.getElementById("site-nav");
  const mobileBtn = document.getElementById("mobile-menu-btn");
  const mobileMenu = document.getElementById("mobile-menu");
  const yearEl = document.getElementById("year");

  if (yearEl) yearEl.textContent = new Date().getFullYear();

  function onScroll() {
    if (window.scrollY > 40) nav.classList.add("scrolled");
    else nav.classList.remove("scrolled");
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  mobileBtn.addEventListener("click", () => {
    mobileMenu.classList.toggle("hidden");
  });
  mobileMenu.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", () => mobileMenu.classList.add("hidden"));
  });

  // ---------- Swipeable gallery ----------
  const track = document.getElementById("gallery-track");
  const prevBtn = document.getElementById("gallery-prev");
  const nextBtn = document.getElementById("gallery-next");
  const dotsWrap = document.getElementById("gallery-dots");

  if (track) {
    const slides = Array.from(track.children);

    slides.forEach((_, i) => {
      const dot = document.createElement("button");
      dot.className = "gallery-dot" + (i === 0 ? " active" : "");
      dot.setAttribute("aria-label", `Go to photo ${i + 1}`);
      dot.addEventListener("click", () => scrollToSlide(i));
      dotsWrap.appendChild(dot);
    });
    const dots = Array.from(dotsWrap.children);

    function scrollToSlide(i) {
      slides[i].scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }

    function currentIndex() {
      const trackCenter = track.scrollLeft + track.clientWidth / 2;
      let closest = 0;
      let closestDist = Infinity;
      slides.forEach((slide, i) => {
        const dist = Math.abs((slide.offsetLeft + slide.clientWidth / 2) - trackCenter);
        if (dist < closestDist) { closestDist = dist; closest = i; }
      });
      return closest;
    }

    function syncUI() {
      const idx = currentIndex();
      dots.forEach((d, i) => d.classList.toggle("active", i === idx));
      if (prevBtn) prevBtn.disabled = idx === 0;
      if (nextBtn) nextBtn.disabled = idx === slides.length - 1;
    }

    let scrollTimeout;
    track.addEventListener("scroll", () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(syncUI, 80);
    }, { passive: true });

    if (prevBtn) prevBtn.addEventListener("click", () => scrollToSlide(Math.max(0, currentIndex() - 1)));
    if (nextBtn) nextBtn.addEventListener("click", () => scrollToSlide(Math.min(slides.length - 1, currentIndex() + 1)));

    syncUI();
  }
})();
