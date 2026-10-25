// A full-screen hero marked [data-hero-scroll] glides down to the content below it
// 1.5 seconds after the page opens. Skipped with reduced motion, when the page opens
// part-way down (a link to a section, or Back), and as soon as the visitor scrolls,
// taps, clicks, or presses a key, so it never fights them.

const hero = document.querySelector("[data-hero-scroll]");
const DELAY = 1500;
const DURATION = 1100;

if (hero && !matchMedia("(prefers-reduced-motion: reduce)").matches && !location.hash) {
  let cancelled = false;
  let frame = 0;
  const cancel = () => {
    cancelled = true;
    cancelAnimationFrame(frame);
    for (const type of EVENTS) removeEventListener(type, cancel);
  };
  const EVENTS = ["wheel", "touchstart", "pointerdown", "keydown"];
  for (const type of EVENTS) addEventListener(type, cancel, { passive: true });

  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

  setTimeout(() => {
    if (cancelled || scrollY > 10) return cancel();
    const header = document.querySelector(".site-header")?.offsetHeight || 0;
    const end = hero.getBoundingClientRect().bottom + scrollY - header;
    const start = scrollY;
    const t0 = performance.now();
    const step = (now) => {
      if (cancelled) return;
      const t = Math.min((now - t0) / DURATION, 1);
      scrollTo({ top: start + (end - start) * ease(t), behavior: "instant" });
      if (t < 1) frame = requestAnimationFrame(step);
      else cancel();
    };
    frame = requestAnimationFrame(step);
  }, DELAY);
}
