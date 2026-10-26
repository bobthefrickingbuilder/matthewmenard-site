import { runIntro } from "/js/intro.js";
import "/js/performances.js";

runIntro();

// Photo strip arrows. Without JS the strip still scrolls sideways by touch, trackpad, or keyboard.
const strip = document.querySelector(".strip");
const buttons = [...document.querySelectorAll("[data-strip]")];
if (strip && buttons.length) {
  const update = () => {
    const max = strip.scrollWidth - strip.clientWidth - 2;
    buttons[0].disabled = strip.scrollLeft <= 2;
    buttons[1].disabled = strip.scrollLeft >= max;
  };
  for (const button of buttons) {
    button.hidden = false;
    button.addEventListener("click", () => {
      const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
      strip.scrollBy({ left: Number(button.dataset.strip) * strip.clientWidth * 0.8, behavior: reduced ? "auto" : "smooth" });
    });
  }
  strip.addEventListener("scroll", update, { passive: true });
  addEventListener("resize", update);
  update();
}

// With a mouse, the strip can also be dragged sideways. Snapping is paused while dragging
// and comes back on release, so it settles on the nearest photo.
if (strip) {
  let startX = 0, startScroll = 0, dragging = false, moved = false;
  strip.addEventListener("pointerdown", (e) => {
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    dragging = true;
    moved = false;
    startX = e.clientX;
    startScroll = strip.scrollLeft;
  });
  addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    if (!moved && Math.abs(dx) > 4) {
      moved = true;
      strip.classList.add("is-dragging");
    }
    if (moved) strip.scrollLeft = startScroll - dx;
  });
  addEventListener("pointerup", () => {
    if (!dragging) return;
    dragging = false;
    strip.classList.remove("is-dragging");
  });
  // A drag never counts as a click on a photo.
  strip.addEventListener("click", (e) => { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
  strip.addEventListener("dragstart", (e) => e.preventDefault());
}

// Singer / Composer / Conductor: each bio slides open and closed instead of jumping.
// The <details> element still does the real work, so it opens without JS too.
if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
  for (const details of document.querySelectorAll(".role")) {
    const summary = details.querySelector("summary");
    const bio = details.querySelector(".role__bio");
    let running = null;

    summary.addEventListener("click", (event) => {
      event.preventDefault();
      // A closed bio still reports its full height, so it starts from 0 unless it is open or mid-slide.
      const from = details.open ? bio.getBoundingClientRect().height : 0;
      running?.cancel();
      const opening = !details.open || details.classList.contains("is-closing");
      details.classList.remove("is-closing");
      if (opening) details.open = true;
      else details.classList.add("is-closing");

      const to = opening ? bio.scrollHeight : 0;
      bio.style.overflow = "hidden";
      running = bio.animate(
        [
          { height: `${from}px`, opacity: opening && from === 0 ? 0 : 1 },
          { height: `${to}px`, opacity: opening ? 1 : 0 },
        ],
        { duration: opening ? 520 : 380, easing: EASE }
      );
      if (opening) {
        [...bio.children].forEach((child, i) =>
          child.animate([{ transform: "translateY(0.6rem)", opacity: 0 }, { transform: "none", opacity: 1 }],
            { duration: 520, delay: 60 + i * 70, easing: EASE, fill: "backwards" }));
      }
      running.onfinish = () => {
        running = null;
        bio.style.overflow = "";
        if (!opening) {
          details.open = false;
          details.classList.remove("is-closing");
        }
      };
    });
  }
}

// Hero panels: the open panel moves to the next role every few seconds. Hovering or
// focusing a panel opens it and pauses the turns until the pointer leaves the hero.
// No turns with reduced motion or while the hero is off screen.
const hero = document.querySelector("[data-hero]");
if (hero) {
  const panels = [...hero.querySelectorAll(".hero__panel")];
  const TURN = 5000;
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let current = 0;
  let timer = 0;
  let visible = true;

  const open = (n) => {
    current = n;
    panels.forEach((panel, i) => panel.classList.toggle("is-active", i === n));
  };
  const stop = () => clearInterval(timer);
  const start = () => {
    stop();
    if (still || !visible) return;
    timer = setInterval(() => open((current + 1) % panels.length), TURN);
  };

  panels.forEach((panel, i) => {
    panel.addEventListener("pointerenter", () => { stop(); open(i); });
    panel.addEventListener("focus", () => { stop(); open(i); });
    panel.addEventListener("blur", start);
  });
  hero.addEventListener("pointerleave", start);
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    start();
  }).observe(hero);
}

// Scroll button: glides to the section under the hero, and fades out once the page
// has been scrolled a little (back again at the top).
const next = document.querySelector("[data-hero-next]");
if (next) {
  next.addEventListener("click", (event) => {
    event.preventDefault();
    // Measured from the hero's bottom edge: the next section may still be mid-reveal
    // (shifted down), which would make it land short.
    const end = next.closest(".hero").getBoundingClientRect().bottom + scrollY;
    const header = document.querySelector(".site-header")?.offsetHeight || 0;
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    scrollTo({ top: end - header, behavior: still ? "auto" : "smooth" });
  });
  const update = () => next.classList.toggle("is-gone", scrollY > 80);
  addEventListener("scroll", update, { passive: true });
  update();
}
