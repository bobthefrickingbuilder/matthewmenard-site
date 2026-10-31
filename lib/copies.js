// Choral scores (licensed: true in lib/products.js) sell as a licence for a number of copies,
// charged per copy: 10, 20, or 40 or more. Everything else sells as one copy.

const MAX_COPIES = 1000;

const validCopies = (n) => Number.isInteger(n) && (n === 10 || n === 20 || (n >= 40 && n <= MAX_COPIES));

// "id:20,id:40" in Stripe metadata ↔ { id: 20 }.
const packCopies = (copies) => Object.entries(copies).map(([id, n]) => `${id}:${n}`).join(",");
const unpackCopies = (text) =>
  Object.fromEntries((text || "").split(",").filter(Boolean).map((pair) => {
    const [id, n] = pair.split(":");
    return [id, Number(n)];
  }));

module.exports = { MAX_COPIES, validCopies, packCopies, unpackCopies };
