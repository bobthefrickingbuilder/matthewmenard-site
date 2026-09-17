// Shared cart + nav logic for the static pages. Cart lives in localStorage so it
// survives navigation between pages (this is a plain multi-page static site, no
// client-side router).

// Keep in sync with /lib/products.js (server-side copy used by the API functions).
const PRODUCTS = {
  "when-i-am-dead": { id: "when-i-am-dead", title: "When I am dead, my dearest", price: 4.0 },
  "golden-sunset": { id: "golden-sunset", title: "The Golden Sunset", price: 4.0 },
};

const CART_KEY = "mm_cart";

function getCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function setCart(items) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  } catch (e) {
    /* ignore */
  }
  updateCartBadge();
}

function addToCart(id) {
  const cart = getCart();
  if (!cart.includes(id)) cart.push(id);
  setCart(cart);
}

function removeFromCart(id) {
  setCart(getCart().filter((x) => x !== id));
}

function updateCartBadge() {
  document.querySelectorAll("[data-cart-count]").forEach((el) => {
    el.textContent = "(" + getCart().length + ")";
  });
}

document.addEventListener("DOMContentLoaded", updateCartBadge);

// Wire any element with data-add-to-cart="<product-id>" to add + go to checkout.
document.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-add-to-cart]");
  if (!btn) return;
  e.preventDefault();
  addToCart(btn.getAttribute("data-add-to-cart"));
  window.location.href = "/checkout/";
});
