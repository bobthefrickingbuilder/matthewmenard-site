import { copiesLabel, getCart, getCopies, removeFromCart } from "/js/cart.js";

const list = document.querySelector("[data-cart]");
const empty = document.querySelector("[data-cart-empty]");
const summary = document.querySelector("[data-cart-summary]");
const total = document.querySelector("[data-cart-total]");
const payButton = document.querySelector("[data-pay]");
const status = document.querySelector("[data-checkout-status]");

const money = (cents, currency) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: currency.toUpperCase() }).format(cents / 100);

let products = [];

// Choral scores are charged per copy; a cart entry with no saved number means the smallest licence.
const copiesOf = (p) => (p.licensed ? getCopies()[p.id] || 10 : 1);

function render() {
  const items = getCart().map((id) => products.find((p) => p.id === id)).filter(Boolean);
  empty.hidden = items.length > 0;
  summary.hidden = items.length === 0;
  list.replaceChildren(
    ...items.map((p) => {
      const li = document.createElement("li");
      const link = document.createElement("a");
      link.href = p.page;
      link.innerHTML = "<em></em>";
      link.firstChild.textContent = p.title;
      if (p.licensed) link.append(`, licence for ${copiesLabel(copiesOf(p))} copies`);
      const price = document.createElement("span");
      price.textContent = money(p.amount * copiesOf(p), p.currency);
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "cart__remove";
      remove.textContent = "Remove";
      remove.setAttribute("aria-label", `Remove ${p.title}`);
      remove.addEventListener("click", () => {
        removeFromCart(p.id);
        render();
        status.textContent = `${p.title} removed.`;
      });
      li.append(link, price, remove);
      return li;
    })
  );
  if (items.length) total.textContent = money(items.reduce((sum, p) => sum + p.amount * copiesOf(p), 0), items[0].currency);
}

payButton.addEventListener("click", async () => {
  payButton.disabled = true;
  status.textContent = "Opening secure checkout…";
  try {
    const res = await fetch("/api/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: getCart(), copies: Object.fromEntries(products.filter((p) => p.licensed).map((p) => [p.id, copiesOf(p)])) }),
    });
    const data = await res.json();
    if (!res.ok || !data.url) throw new Error(data.error);
    location.href = data.url;
  } catch (error) {
    status.textContent = `${error.message || "Could not start checkout."} Try again, or email mmenardproduction@gmail.com.`;
    payButton.disabled = false;
  }
});

try {
  products = await (await fetch("/api/products")).json();
} catch {
  status.textContent = "Could not load the cart. Refresh the page to try again.";
}
render();
