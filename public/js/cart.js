// Cart: an array of score IDs in localStorage (same key as the old site, so existing carts survive).
// Choral scores also keep their number of copies, under a second key.

const KEY = "mm_cart";
const COPIES_KEY = "mm_cart_copies";

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
export const removeFromCart = (id) => {
  setCart(getCart().filter((x) => x !== id));
  const { [id]: _, ...rest } = getCopies();
  saveCopies(rest);
};

export function getCopies() {
  try {
    return JSON.parse(localStorage.getItem(COPIES_KEY) || "{}") || {};
  } catch {
    return {};
  }
}

function saveCopies(copies) {
  try {
    localStorage.setItem(COPIES_KEY, JSON.stringify(copies));
  } catch {}
}

export const setCopies = (id, n) => saveCopies({ ...getCopies(), [id]: n });
