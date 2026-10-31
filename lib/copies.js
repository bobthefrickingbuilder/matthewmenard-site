// Choral scores (licensed: true in lib/products.js) sell as a licence, priced by the copy:
// 10 copies, 20 copies, or 40+ (one fixed price, the same as 40 copies, for any number from 40 up).
// Everything else sells as one copy.

const validCopies = (n) => n === 10 || n === 20 || n === 40;
const copiesLabel = (n) => (n === 40 ? "40+" : String(n));

// "id:20,id:40" in Stripe metadata ↔ { id: 20 }.
const packCopies = (copies) => Object.entries(copies).map(([id, n]) => `${id}:${n}`).join(",");
const unpackCopies = (text) =>
  Object.fromEntries((text || "").split(",").filter(Boolean).map((pair) => {
    const [id, n] = pair.split(":");
    return [id, Number(n)];
  }));

module.exports = { validCopies, copiesLabel, packCopies, unpackCopies };
