// Site-wide motion: scroll reveals, gentle parallax on [data-parallax] images, and the
// header shadow once the page scrolls. With reduced motion only the header shadow runs.
// Loaded on every page through nav.js. Styles live in the Motion section of components.css.

const root = document.documentElement;
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

// Keep in sync with the selector list in components.css.
const REVEAL = [
  "main .page-head > *", "main .section-head", "main .section > h2", "main .section > .stack",
  "main .grid > *", "main .gallery > *", "main .roles > li", "main .process > li", "main .faq__item",
  "main .events > li", "main .split > *", "main .panel", "main .prose > *", "main .bio-teaser > *",
  "main .contact-cta > *", "main .marquee", "main .explore > li", "main .work__aside", "main .facts",
  "main .score-sample", "main .work__section", "main .contact-layout > *", "main .request-form",
  "main .stats__list > li", "main .strip > li", "main .arch",
].join(", ");

function reveal() {
  const show = (el, i) => {
    el.style.setProperty("--reveal-i", Math.min(i, 6));
    el.classList.add("is-in");
    // Once settled, drop the reveal transition so hover effects use their own timing.
    const done = () => el.classList.add("reveal-done");
    el.addEventListener("transitionend", done, { once: true });
    setTimeout(done, 1600 + i * 100);
  };

  const observer = new IntersectionObserver(
    (entries) => {
      // Items arriving together rise one after another, in reading order.
      entries
        .filter((entry) => entry.isIntersecting)
        .map((entry) => entry.target)
        .sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1))
        .forEach((el, i) => {
          observer.unobserve(el);
          show(el, i);
        });
    },
    { rootMargin: "0px 0px -8% 0px" }
  );

  const watch = (scope) => {
    for (const el of scope.querySelectorAll(REVEAL)) if (!el.classList.contains("is-in")) observer.observe(el);
  };
  watch(document);

  // Content added later (performances list, filters, form results) gets the same treatment.
  new MutationObserver((records) => {
    for (const record of records) for (const node of record.addedNodes) if (node.nodeType === 1) {
      if (node.matches(REVEAL)) observer.observe(node);
      watch(node);
    }
  }).observe(document.querySelector("main") || document.body, { childList: true, subtree: true });
}

// Staff dividers between sections draw in from the left (see .section + .section in base.css).
function staves() {
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) if (entry.isIntersecting) {
      entry.target.classList.add("is-drawn");
      observer.unobserve(entry.target);
    }
  }, { rootMargin: "0px 0px -10% 0px" });
  document.querySelectorAll(".section + .section").forEach((el) => observer.observe(el));
}

// Numbers marked data-count tick up from zero the first time they are seen.
function counters() {
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) if (entry.isIntersecting) {
      observer.unobserve(entry.target);
      const el = entry.target;
      const end = Number(el.dataset.count);
      const start = performance.now();
      const tick = (now) => {
        const t = Math.min((now - start) / 1400, 1);
        el.textContent = Math.round(end * (1 - (1 - t) ** 3));
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
  }, { threshold: 0.6 });
  document.querySelectorAll("[data-count]").forEach((el) => observer.observe(el));
}

// Parallax: the image drifts a little slower than the page. The image is scaled up in CSS
// so the drift never shows an edge.
function parallax() {
  const items = [...document.querySelectorAll("[data-parallax]")];
  if (!items.length) return;
  let ticking = false;
  const update = () => {
    ticking = false;
    for (const el of items) {
      const box = el.parentElement.getBoundingClientRect();
      if (box.bottom < 0 || box.top > innerHeight) continue;
      const progress = (box.top + box.height / 2 - innerHeight / 2) / innerHeight; // -1 … 1
      el.style.setProperty("--parallax", `${(progress * Number(el.dataset.parallax || 6)).toFixed(2)}%`);
    }
  };
  addEventListener("scroll", () => {
    if (!ticking) requestAnimationFrame(update);
    ticking = true;
  }, { passive: true });
  update();
}

function headerShadow() {
  const set = () => root.classList.toggle("is-scrolled", scrollY > 8);
  addEventListener("scroll", set, { passive: true });
  set();
}

headerShadow();
if (!reduced && "IntersectionObserver" in window) {
  reveal();
  staves();
  counters();
  parallax();
  // Without this class the CSS failsafe shows everything after a moment.
  root.classList.add("motion-ready");
}
