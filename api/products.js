const PRODUCTS = require("../lib/products");

// Public product list for the checkout page. Never includes file paths.
module.exports = function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  const list = Object.values(PRODUCTS).map(({ id, title, amount, currency, page }) => ({ id, title, amount, currency, page }));
  res.setHeader("Cache-Control", "public, max-age=300");
  res.status(200).json(list);
};
