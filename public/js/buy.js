// "Buy the score" forms post straight to Stripe without JS. With JS, add to the cart instead
// so several scores can be bought together. Choral scores also have a copies picker
// (10, 20, or 40+); the browser checks the 40+ box against its min and max before submit.

import { addToCart, getCopies, setCopies } from "/js/cart.js";

const money = (cents, currency) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: currency.toUpperCase() }).format(cents / 100);

function setUpPicker(form) {
  const id = form.elements.items.value;
  const more = form.elements.copies_more;
  const moreField = more.closest(".field");
  const total = form.querySelector("[data-copies-total]");
  const choice = () => form.elements.copies.value;
  const copies = () => Number(choice() === "more" ? more.value : choice());
  let product;

  const update = () => {
    const isMore = choice() === "more";
    moreField.hidden = !isMore;
    more.disabled = !isMore;
    if (!product) return;
    total.textContent = !isMore || more.checkValidity()
      ? `Total: ${money(product.amount * copies(), product.currency)} ${product.currency.toUpperCase()} for ${copies()} copies`
      : "Enter a whole number from 40 to 1000.";
  };

  const saved = getCopies()[id];
  if (saved) {
    form.elements.copies.value = saved >= 40 ? "more" : String(saved);
    if (saved >= 40) more.value = saved;
  }
  form.addEventListener("input", update);
  update();
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
