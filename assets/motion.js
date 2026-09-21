// Motion layer: preloader, smooth scroll (Lenis), and scroll-triggered
// reveals (GSAP + ScrollTrigger). Loaded after the Lenis/GSAP CDN scripts.
//
// Everything here degrades gracefully: if a CDN script is blocked or slow,
// or the visitor has "reduce motion" set, the page just behaves like a
// normal static site — instant load, native scroll, content visible from
// the start. Nothing is ever hidden by CSS ahead of time, so a failed
// script load can never leave content invisible.

(function () {
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------- Preloader ---------------- */
  var preloader = document.getElementById("preloader");
  var hidden = false;

  function hidePreloader() {
    if (hidden) return;
    hidden = true;
    document.documentElement.classList.remove("is-loading");
    if (!preloader) return;

    if (reduceMotion || typeof gsap === "undefined") {
      preloader.remove();
      return;
    }

    var mark = preloader.querySelector(".preloader-mark");
    gsap.timeline({ onComplete: function () { preloader.remove(); } })
      .to(mark, { opacity: 1, duration: 0.45, ease: "power1.out" })
      .to(preloader, { opacity: 0, duration: 0.5, ease: "power1.inOut" }, "+=0.2");
  }

  window.addEventListener("load", hidePreloader);
  // Safety net — never trap a visitor behind the preloader if an asset stalls.
  setTimeout(hidePreloader, 2200);

  /* ---------------- Smooth scroll (Lenis) ---------------- */
  var lenis;
  if (!reduceMotion && typeof Lenis !== "undefined") {
    lenis = new Lenis({ duration: 1.1, smoothWheel: true });

    if (typeof gsap !== "undefined") {
      gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
      gsap.ticker.lagSmoothing(0);
    } else {
      requestAnimationFrame(function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
      });
    }
  }

  /* ---------------- Scroll-triggered reveals (GSAP + ScrollTrigger) ---------------- */
  if (!reduceMotion && typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);

    if (lenis) {
      lenis.on("scroll", ScrollTrigger.update);
    }

    var targets = gsap.utils.toArray("[data-reveal]");
    if (targets.length) {
      ScrollTrigger.batch(targets, {
        start: "top 88%",
        once: true,
        onEnter: function (batch) {
          gsap.from(batch, {
            opacity: 0,
            y: 24,
            duration: 0.7,
            ease: "power2.out",
            stagger: 0.08,
          });
        },
      });
    }
  }
})();
