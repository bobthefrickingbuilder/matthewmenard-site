// Colour preview: try candidate palettes on the real pages before choosing one.
// Off unless the address has ?palette=<name> (or ?palette=on). The choice then follows you
// from page to page for this browser tab; ?palette=off or the Close button ends it.
// Palettes live in /design/palettes.css. Nothing here runs for normal visitors.

const KEY = "mm-palette-preview";
const root = document.documentElement;
const param = new URLSearchParams(location.search).get("palette");

let state = null;
try {
  if (param === "off") sessionStorage.removeItem(KEY);
  else if (param) sessionStorage.setItem(KEY, param === "on" ? "current" : param);
  state = sessionStorage.getItem(KEY);
} catch {}

if (state) start(state);

async function start(initial) {
  const links = ["/design/palettes.css", "/design/palette-bar.css"].map((href) => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    document.head.append(link);
    return link;
  });

  const apply = (id) => {
    if (id === "current") root.removeAttribute("data-palette");
    else root.dataset.palette = id;
    try { sessionStorage.setItem(KEY, id); } catch {}
    for (const b of bar.querySelectorAll("[data-pick]")) b.setAttribute("aria-pressed", String(b.dataset.pick === id));
  };

  const palettes = await fetch("/design/palettes.json").then((r) => r.json());
  const options = { current: { label: "Current (Chapel Green)", swatches: ["#101b17", "#2b4a3d", "#eef2ea", "#b7d4a9", "#e6a05c"] }, ...palettes };

  const bar = document.createElement("aside");
  bar.className = "palette-bar";
  bar.setAttribute("aria-label", "Colour preview");
  bar.innerHTML = `<p class="palette-bar__title">Colour preview</p><div class="palette-bar__options"></div><button type="button" class="palette-bar__close">Close preview</button>`;
  const list = bar.querySelector(".palette-bar__options");
  for (const [id, p] of Object.entries(options)) {
    const b = document.createElement("button");
    b.type = "button";
    b.dataset.pick = id;
    b.title = p.note || "The colours the site uses now.";
    const dots = document.createElement("span");
    dots.className = "palette-bar__dots";
    dots.setAttribute("aria-hidden", "true");
    for (const c of p.swatches) {
      const d = document.createElement("span");
      d.style.background = c;
      dots.append(d);
    }
    b.append(dots, document.createTextNode(p.label));
    b.addEventListener("click", () => apply(id));
    list.append(b);
  }
  bar.querySelector(".palette-bar__close").addEventListener("click", () => {
    try { sessionStorage.removeItem(KEY); } catch {}
    root.removeAttribute("data-palette");
    bar.remove();
    links.forEach((link) => link.remove());
  });
  document.body.append(bar);
  apply(options[initial] ? initial : "current");
}
