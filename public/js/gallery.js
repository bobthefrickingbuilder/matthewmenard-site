// Photo collage: deals the photos into columns of different widths, each photo going
// to whichever column is shortest so far. Every photo keeps its own shape and fills its
// column, so there are no holes inside the collage; only the bottom edge is ragged.
// Without JS the photos sit in plain equal columns at their natural shape (components.css).

const LAYOUTS = [
  // [minimum screen width, column widths]
  [832, [1.25, 0.8, 1.05]],
  [576, [1.15, 0.85]],
  [0, [1]],
];

for (const gallery of document.querySelectorAll(".gallery")) {
  const photos = [...gallery.querySelectorAll(":scope > .photo")];
  // Each photo carries its shape as data-r (width ÷ height). It is set here because the
  // security policy blocks style="" attributes in the HTML.
  for (const photo of photos) photo.style.setProperty("--r", photo.dataset.r);
  let current = null;

  const layout = () => {
    let widths = LAYOUTS.find(([min]) => innerWidth >= min)[1];
    if (photos.length < 5) widths = widths.slice(0, 2); // Two photos never need three columns.
    const key = widths.join();
    if (key === current) return;
    current = key;

    gallery.replaceChildren();
    gallery.classList.add("gallery--columns");
    gallery.style.gridTemplateColumns = widths.map((w) => `${w}fr`).join(" ");
    const columns = widths.map((w) => {
      const column = document.createElement("div");
      column.className = "gallery__column";
      gallery.append(column);
      return { column, width: w, height: 0 };
    });
    for (const photo of photos) {
      const ratio = parseFloat(photo.dataset.r) || 1;
      // Height of this photo relative to the others: column width ÷ photo shape.
      const shortest = columns.reduce((a, b) => (b.height < a.height ? b : a));
      shortest.column.append(photo);
      shortest.height += shortest.width / ratio;
    }
  };

  layout();
  addEventListener("resize", layout);
}
