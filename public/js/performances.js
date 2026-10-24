// Renders upcoming performances from /data/performances.js into [data-performances] lists.
// The section stays hidden when nothing is upcoming. data-limit caps the count.

import performances from "/data/performances.js";

const today = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD in local time
const upcoming = performances
  .filter((p) => p.date >= today)
  .sort((a, b) => a.date.localeCompare(b.date));

const format = new Intl.DateTimeFormat("en-CA", { month: "short", day: "numeric", year: "numeric" });

for (const list of document.querySelectorAll("[data-performances]")) {
  const items = upcoming.slice(0, Number(list.dataset.limit) || undefined);
  if (!items.length) continue;
  list.replaceChildren(
    ...items.map((p) => {
      const li = document.createElement("li");
      const time = document.createElement("time");
      time.dateTime = p.date;
      time.textContent = format.format(new Date(`${p.date}T12:00:00`));
      const body = document.createElement("div");
      const title = document.createElement(p.url ? "a" : "strong");
      title.textContent = p.title;
      if (p.url) title.href = p.url;
      body.append(title);
      const detail = [p.ensemble, p.venue].filter(Boolean).join(" · ");
      if (detail) {
        const meta = document.createElement("p");
        meta.className = "meta";
        meta.textContent = detail;
        body.append(meta);
      }
      li.append(time, body);
      return li;
    })
  );
  list.closest("[data-performances-section]")?.removeAttribute("hidden");
}
