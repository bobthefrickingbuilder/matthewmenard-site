// "Buy the score" forms post straight to Stripe without JS. With JS, add to the cart instead
// so several scores can be bought together. Choral scores also have a copies picker
// (10, 20, or 40+), with the total shown as it changes.

import { addToCart, copiesLabel, getCopies, setCopies } from "/js/cart.js";

const money = (cents, currency) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: currency.toUpperCase() }).format(cents / 100);

function setUpPicker(form) {
  const id = form.elements.items.value;
  const total = form.querySelector("[data-copies-total]");
  const copies = () => Number(form.elements.copies.value);
  let product;

  const update = () => {
    if (product) total.textContent = `Total: ${money(product.amount * copies(), product.currency)} ${product.currency.toUpperCase()} for ${copiesLabel(copies())} copies`;
  };

  const saved = getCopies()[id];
  if (saved) form.elements.copies.value = String(saved);
  form.addEventListener("input", update);
  fetch("/api/products")
    .then((res) => res.json())
    .then((list) => {
      product = list.find((p) => p.id === id);
      update();
    })
    .catch(() => {});
  return copies;
}

for (const form of document.querySelectorAll("[data-buy]")) {
  const copies = form.querySelector("[data-copies]") ? setUpPicker(form) : null;
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const id = form.elements.items.value;
    addToCart(id);
    if (copies) setCopies(id, copies());
    location.href = "/checkout";
  });
}
