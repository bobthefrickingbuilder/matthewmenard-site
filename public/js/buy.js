// "Buy the score" forms post straight to Stripe without JS. With JS, add to the cart instead
// so several scores can be bought together.

import { addToCart } from "/js/cart.js";

for (const form of document.querySelectorAll("[data-buy]")) {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    addToCart(form.elements.items.value);
    location.href = "/checkout";
  });
}
