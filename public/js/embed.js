// Click-to-load players. Nothing loads from the third party until the visitor presses Play.
// Markup: <div class="embed" data-embed="https://…" data-embed-title="…" data-embed-ratio="16/9|audio">

const ALLOWED = ["https://www.youtube-nocookie.com/", "https://player.vimeo.com/", "https://open.spotify.com/embed/", "https://w.soundcloud.com/player/"];

for (const embed of document.querySelectorAll("[data-embed]")) {
  const src = embed.dataset.embed;
  if (!ALLOWED.some((origin) => src.startsWith(origin))) continue;
  if (embed.dataset.embedRatio === "audio") embed.classList.add("embed--audio");

  embed.querySelector(".embed__play")?.addEventListener("click", () => {
    const frame = document.createElement("iframe");
    frame.src = src + (src.includes("?") ? "&" : "?") + "autoplay=1";
    frame.title = embed.dataset.embedTitle || "Media player";
    frame.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
    frame.loading = "lazy";
    frame.referrerPolicy = "strict-origin-when-cross-origin";
    embed.replaceChildren(frame);
    frame.focus();
  });
}
