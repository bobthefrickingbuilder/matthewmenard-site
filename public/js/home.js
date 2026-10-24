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
