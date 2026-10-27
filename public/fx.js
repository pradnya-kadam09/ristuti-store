/* ==========================================================================
   RISTUTI HAUTE COUTURE - MICRO-INTERACTIONS & MOTION ENGINE
   ========================================================================== */

(function () {
  // Intersection Observer for graceful reveal animations
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("revealed");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
  );

  window.observeReveals = (root = document) => {
    root.querySelectorAll(".cat-card, .product-card, .pillar-box, .review-card, .editorial-img-box, .newsletter-card, .insta-item").forEach((el) => {
      if (!el.classList.contains("revealed")) {
        observer.observe(el);
      }
    });
  };

  // Sticky header transition on scroll
  const header = document.querySelector("#mainHeader");
  const onScroll = () => {
    if (header) {
      header.classList.toggle("scrolled", window.scrollY > 20);
    }
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Dynamic Year in footer
  const yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  // Initial call
  document.addEventListener("DOMContentLoaded", () => {
    window.observeReveals();
  });
})();
