// Compositions filters and sorting. Filter options come from the cards' data-type,
// data-voicing, and data-year, so adding a card is all it takes. A filter with fewer than
// two values stays hidden, and so does any sort option that would not change anything.

const form = document.querySelector("[data-filters]");
const cards = [...document.querySelectorAll("[data-works] > li")];
const count = document.querySelector("[data-filter-count]");
const empty = document.querySelector("[data-filter-empty]");
const selects = [...form.querySelectorAll("[data-filter]")];
const sort = form.querySelector("[data-sort]");
const list = document.querySelector("[data-works]");

for (const select of selects) {
  const key = select.dataset.filter;
  const values = [...new Set(cards.map((card) => card.dataset[key]).filter(Boolean))].sort((a, b) =>
    key === "year" ? b.localeCompare(a) : a.localeCompare(b)
  );
  values.forEach((value) => select.append(new Option(value, value)));
  if (values.length < 2) select.closest(".field").hidden = true;
}

// Sorting. "Featured" is the order the cards are written in the page.
const title = (card) => card.querySelector("h2, h3").textContent.trim();
const year = (card) => Number(card.dataset.year) || null;
const price = (card) => (card.dataset.price ? Number(card.dataset.price) : null);
// Works without a year or price go last, in their featured order.
const by = (get, dir) => (a, b) => {
  const x = get(a), y = get(b);
  if (x === null || y === null) return (x === null) - (y === null);
  return ((x > y) - (x < y)) * dir;
};
const SORTS = {
  title: (a, b) => title(a).localeCompare(title(b)),
  "title-desc": (a, b) => title(b).localeCompare(title(a)),
  newest: by(year, -1),
  oldest: by(year, 1),
  price: by(price, 1),
  "price-desc": by(price, -1),
  "for-sale": (a, b) => (price(a) === null) - (price(b) === null),
};
const distinct = (get) => new Set(cards.map(get).filter((v) => v !== null)).size;
for (const option of [...sort.options]) {
  const v = option.value;
  const useful =
    !v || v.startsWith("title") ? cards.length > 1 :
    v === "newest" || v === "oldest" ? distinct(year) > 1 :
    v.startsWith("price") ? distinct(price) > 1 :
    v === "for-sale" ? cards.some((c) => price(c) === null) && cards.some((c) => price(c) !== null) : true;
  if (!useful) option.remove();
}
if (sort.options.length < 2) sort.closest(".field").hidden = true;

function order() {
  const sorted = sort.value ? [...cards].sort(SORTS[sort.value]) : cards;
  list.append(...sorted);
}

function apply() {
  let shown = 0;
  for (const card of cards) {
    const match = selects.every((s) => !s.value || card.dataset[s.dataset.filter] === s.value);
    card.hidden = !match;
    if (match) shown++;
  }
  count.textContent = `${shown} of ${cards.length} ${cards.length === 1 ? "work" : "works"}`;
  empty.hidden = shown > 0;
}

form.addEventListener("change", (event) => (event.target === sort ? order() : apply()));
form.addEventListener("submit", (event) => event.preventDefault());
document.querySelector("[data-filter-reset]").addEventListener("click", () => {
  form.reset();
  order();
  apply();
});

// Filters and sorting only show once there is something to choose between.
form.hidden = [...selects, sort].every((s) => s.closest(".field").hidden);
apply();
