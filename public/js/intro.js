// Intro: two M's appear, expand into MATTHEW MENARD, then the name breaks into a wave of
// flip tiles from the click/tap point and reveals the page underneath.
//
// The page decides whether to play before first paint (inline script in <head> adds
// `intro-on` to <html>): never with reduced motion, once per browser session.
// Without JS, `intro-on` is never set and the page shows immediately. If this file fails
// to load, a CSS failsafe hides the intro after a few seconds (see intro.css).

// ---- Timing (ms unless noted). Tune here. ----------------------------------
export const TIMING = {
  M_APPEAR: 700, // The two M's fade, rise, and sharpen in at the center.
  M_HOLD: 250, // Pause on the two M's before the name expands.
  LETTER_DURATION: 1150, // Each letter's fade, rise, and sharpen.
  LETTER_STAGGER: 130, // Delay between letters, counted outward from each M.
  LETTER_EASE: "cubic-bezier(.16,1,.3,1)",
  LETTER_RISE: 40, // px each letter rises from.
  LETTER_SPREAD: 0.6, // 0–1: how far letters start from their M (1 = on top of it, 0 = in place).
  HINT_DELAY: 500, // After the last letter lands, before "Click anywhere" fades in.
  TILE_SIZE: 110, // Target tile size in px. Actual size fits the viewport exactly.
  MIN_COLUMNS: 4, // Phones never get fewer columns than this.
  FLIP_SPREAD: 650, // Delay from the click point to the farthest tile.
  FLIP_JITTER: 90, // Random extra delay per tile, 0 to this.
  FLIP_DURATION: 950,
  FLIP_EASE: "cubic-bezier(.65,0,.35,1)",
  FLIP_DIP: 0.92, // Tile scale at the 90° midpoint.
  SKIP_FADE: 250,
};

const STORAGE_KEY = "mm-intro-played";
const FONT_WAIT = 1200; // Longest wait for the display font before animating anyway.

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function runIntro(overrides = {}) {
  const root = document.documentElement;
  const intro = document.querySelector("[data-intro]");
  const skipButton = document.querySelector("[data-intro-skip]");
  if (!intro) return;
  if (!root.classList.contains("intro-on")) {
    intro.remove();
    skipButton?.remove();
    return;
  }

  const t = { ...TIMING, ...overrides };
  const stage = intro.querySelector(".intro-stage");
  const tileLayer = intro.querySelector(".intro-tiles");
  const hint = intro.querySelector(".intro-hint");
  const words = [...stage.querySelectorAll(".intro-word")];

  let state = "revealing"; // revealing → waiting → breaking → done
  let letterAnimations = [];
  let tiles = null;

  try {
    sessionStorage.setItem(STORAGE_KEY, "1");
  } catch {}

  intro.classList.add("is-running");
  skipButton?.classList.add("is-running");
  document.body.style.overflow = "hidden";
  hint.textContent = matchMedia("(hover: none) and (pointer: coarse)").matches ? "Tap anywhere" : "Click anywhere";

  async function reveal() {
    await Promise.race([document.fonts?.ready, sleep(FONT_WAIT)]);
    if (state !== "revealing") return;

    // Where each M ends up, and where it starts: the two side by side at the center.
    const ms = words.map((word) => word.querySelector(".intro-letter"));
    const finals = ms.map((m) => m.getBoundingClientRect());
    const pairLeft = innerWidth / 2 - (finals[0].width + finals[1].width) / 2;
    const starts = [pairLeft, pairLeft + finals[0].width];
    const offsets = finals.map((box, i) => ({
      x: starts[i] - box.left,
      y: innerHeight / 2 - (box.top + box.height / 2),
    }));

    const expandAt = t.M_APPEAR + t.M_HOLD;
    const mTotal = expandAt + t.LETTER_DURATION;
    let lastLanding = 0;

    words.forEach((word, w) => {
      const { x, y } = offsets[w];
      [...word.querySelectorAll(".intro-letter")].forEach((letter, k) => {
        if (k === 0) {
          // The M: appear in the center pair, hold, then glide to its place in the name.
          letterAnimations.push(
            letter.animate(
              [
                { opacity: 0, transform: `translate(${x}px, ${y + t.LETTER_RISE}px) scale(.94)`, filter: "blur(10px)", easing: t.LETTER_EASE },
                { opacity: 1, transform: `translate(${x}px, ${y}px) scale(1)`, filter: "blur(0px)", offset: t.M_APPEAR / mTotal },
                { opacity: 1, transform: `translate(${x}px, ${y}px) scale(1)`, filter: "blur(0px)", offset: expandAt / mTotal, easing: t.LETTER_EASE },
                { opacity: 1, transform: "translate(0px, 0px) scale(1)", filter: "blur(0px)" },
              ],
              { duration: mTotal, fill: "both" }
            )
          );
          lastLanding = Math.max(lastLanding, mTotal);
          return;
        }
        // The rest: fade, rise, and sharpen in order, unfurling outward from the M.
        const delay = expandAt + k * t.LETTER_STAGGER;
        letterAnimations.push(
          letter.animate(
            [
              { opacity: 0, transform: `translate(${x * t.LETTER_SPREAD}px, ${t.LETTER_RISE}px) scale(.94)`, filter: "blur(10px)" },
              { opacity: 1, transform: "translate(0px, 0px) scale(1)", filter: "blur(0px)" },
            ],
            { duration: t.LETTER_DURATION, delay, easing: t.LETTER_EASE, fill: "both" }
          )
        );
        lastLanding = Math.max(lastLanding, delay + t.LETTER_DURATION);
      });
    });
    stage.classList.remove("is-waiting");

    await sleep(lastLanding);
    if (state !== "revealing") return;
    state = "waiting";
    letterAnimations = [];
    hint.animate([{ opacity: 0, transform: "translateY(8px)" }, { opacity: 1, transform: "none" }], {
      duration: 900,
      delay: t.HINT_DELAY,
      easing: t.LETTER_EASE,
      fill: "both",
    });
    // Build the tiles while the name waits, so the click starts the wave on the next frame.
    tiles = buildTiles();
  }

  // Full-viewport grid. Each tile's front face holds a copy of the name, offset so the
  // copies line up into one seamless image. There is no back face: past 90° the tile is
  // see-through and the page shows.
  function buildTiles() {
    const W = innerWidth;
    const H = innerHeight;
    const cols = Math.max(t.MIN_COLUMNS, Math.round(W / t.TILE_SIZE));
    const cw = W / cols;
    const rows = Math.max(1, Math.round(H / cw));
    const ch = H / rows;

    const slice = stage.cloneNode(true);
    slice.classList.remove("is-waiting");
    slice.classList.add("intro-stage--slice");
    slice.style.width = `${W}px`;
    slice.style.height = `${H}px`;

    const fragment = document.createDocumentFragment();
    const list = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const tile = document.createElement("div");
        tile.className = "intro-tile";
        tile.style.left = `${c * cw}px`;
        tile.style.top = `${r * ch}px`;
        tile.style.width = `${cw}px`;
        tile.style.height = `${ch}px`;
        const card = document.createElement("div");
        card.className = "intro-card";
        const face = document.createElement("div");
        face.className = "intro-face";
        const copy = slice.cloneNode(true);
        // The face overhangs the tile by .5px to hide seams; shift the copy back to match.
        copy.style.left = `${0.5 - c * cw}px`;
        copy.style.top = `${0.5 - r * ch}px`;
        face.append(copy);
        card.append(face);
        tile.append(card);
        fragment.append(tile);
        list.push({ card, x: c * cw + cw / 2, y: r * ch + ch / 2 });
      }
    }
    tileLayer.replaceChildren(fragment);
    return { W, H, list };
  }

  async function breakApart(x, y) {
    if (state !== "revealing" && state !== "waiting") return;
    state = "breaking";
    letterAnimations.forEach((animation) => animation.finish());
    if (!tiles || tiles.W !== innerWidth || tiles.H !== innerHeight) tiles = buildTiles();

    hint.getAnimations().forEach((animation) => animation.cancel());
    intro.classList.add("is-breaking");

    const { W, H, list } = tiles;
    const far = Math.max(Math.hypot(x, y), Math.hypot(W - x, y), Math.hypot(x, H - y), Math.hypot(W - x, H - y));
    const turn = [
      { transform: "rotateY(0deg) scale(1)" },
      { transform: `rotateY(90deg) scale(${t.FLIP_DIP})`, offset: 0.5 },
      { transform: "rotateY(180deg) scale(1)" },
    ];
    await Promise.all(
      list.map(
        ({ card, x: tx, y: ty }) =>
          card.animate(turn, {
            duration: t.FLIP_DURATION,
            delay: (Math.hypot(tx - x, ty - y) / far) * t.FLIP_SPREAD + Math.random() * t.FLIP_JITTER,
            easing: t.FLIP_EASE,
            fill: "forwards",
          }).finished
      )
    );
    finish();
  }

  async function skip() {
    if (state === "done") return;
    const hadFocus = document.activeElement === skipButton;
    state = "breaking";
    await intro.animate([{ opacity: 1 }, { opacity: 0 }], { duration: t.SKIP_FADE, fill: "forwards" }).finished;
    finish();
    if (hadFocus) document.getElementById("main")?.focus({ preventScroll: true });
  }

  function finish() {
    state = "done";
    intro.remove();
    skipButton?.remove();
    root.classList.remove("intro-on");
    document.body.style.overflow = "";
    document.removeEventListener("keydown", onKeydown);
    removeEventListener("resize", onResize);
  }

  function onKeydown(event) {
    if (event.key === "Escape") {
      skip();
    } else if ((event.key === "Enter" || event.key === " ") && !event.target.closest("[data-intro-skip]")) {
      event.preventDefault();
      breakApart(innerWidth / 2, innerHeight / 2);
    }
  }

  function onResize() {
    if (state === "waiting") tiles = null;
  }

  intro.addEventListener("pointerup", (event) => {
    if (event.isPrimary) breakApart(event.clientX, event.clientY);
  });
  skipButton?.addEventListener("click", skip);
  document.addEventListener("keydown", onKeydown);
  addEventListener("resize", onResize);

  reveal();
}
