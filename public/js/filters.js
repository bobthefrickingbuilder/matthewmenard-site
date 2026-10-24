// Compositions filters. Options come from the cards' data-type, data-voicing, and data-year,
// so adding a card is all it takes. A filter with fewer than two values stays hidden.

const form = document.querySelector("[data-filters]");
const cards = [...document.querySelectorAll("[data-works] > li")];
const count = document.querySelector("[data-filter-count]");
const empty = document.querySelector("[data-filter-empty]");
const selects = [...form.querySelectorAll("[data-filter]")];

for (const select of selects) {
  const key = select.dataset.filter;
  const values = [...new Set(cards.map((card) => card.dataset[key]).filter(Boolean))].sort((a, b) =>
    key === "year" ? b.localeCompare(a) : a.localeCompare(b)
  );
  values.forEach((value) => select.append(new Option(value, value)));
  if (values.length < 2) select.closest(".field").hidden = true;
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

form.addEventListener("change", apply);
form.addEventListener("submit", (event) => event.preventDefault());
document.querySelector("[data-filter-reset]").addEventListener("click", () => {
  form.reset();
  apply();
});

// Filters only show once there is something to choose between.
form.hidden = selects.every((s) => s.closest(".field").hidden);
apply();
