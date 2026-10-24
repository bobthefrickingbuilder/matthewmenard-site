// Cart: an array of score IDs in localStorage (same key as the old site, so existing carts survive).

const KEY = "mm_cart";

export function getCart() {
  try {
    const items = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(items) ? items.filter((id) => typeof id === "string") : [];
  } catch {
    return [];
  }
}

export function setCart(items) {
  try {
    localStorage.setItem(KEY, JSON.stringify([...new Set(items)]));
  } catch {}
}

export const addToCart = (id) => setCart([...getCart(), id]);
export const removeFromCart = (id) => setCart(getCart().filter((x) => x !== id));
