// Custom cursor: a small sage dot that sits exactly on the pointer. It opens into a ring over
// anything clickable, stretches wide over the draggable photo strip, and presses in on
// click. Mouse only. Skipped with reduced motion or forced colours, so the system cursor
// (which may be enlarged in accessibility settings) stays. Text fields keep the I-beam.
// Styles: "Custom cursor" in components.css.

const ok =
  matchMedia("(hover: hover) and (pointer: fine)").matches &&
  !matchMedia("(prefers-reduced-motion: reduce)").matches &&
  !matchMedia("(forced-colors: active)").matches;

if (ok) {
  const root = document.documentElement;
  const dot = document.createElement("div");
  dot.className = "cursor";
  dot.setAttribute("aria-hidden", "true");
  document.body.append(dot);

  const CLICKABLE = "a, button, summary, label, [role='button'], .card, .explore__item";
  const FIELD = "input, textarea, select, [contenteditable='true']";
  addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse") return;
    root.classList.add("has-cursor");
    // Moved on every event, with no easing, so it never trails the pointer.
    dot.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
    const t = e.target instanceof Element ? e.target : null;
    dot.classList.toggle("is-field", !!t?.closest(FIELD));
    dot.classList.toggle("is-drag", !!t?.closest(".strip"));
    dot.classList.toggle("is-link", !!t?.closest(CLICKABLE) && !t?.closest(FIELD));
    dot.classList.add("is-on");
  }, { passive: true });

  addEventListener("pointerdown", () => dot.classList.add("is-down"));
  addEventListener("pointerup", () => dot.classList.remove("is-down"));
  document.addEventListener("pointerleave", () => dot.classList.remove("is-on"));
  addEventListener("blur", () => dot.classList.remove("is-on"));
}
