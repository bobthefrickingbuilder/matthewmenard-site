const PRODUCTS = require("../lib/products");
const { stripeClient, paidItems } = require("../lib/stripe");
const { copiesLabel } = require("../lib/copies");

// Confirms a checkout session. Returns download links only when it is paid.
module.exports = async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  const stripe = stripeClient();
  if (!stripe) return res.status(500).json({ error: "Checkout is not configured yet." });

  res.setHeader("Cache-Control", "private, no-store");
  try {
    const result = await paidItems(stripe, req.query.session_id);
    if (!result) return res.status(400).json({ error: "Missing or invalid order reference." });
    const sid = encodeURIComponent(req.query.session_id);
    const items = result.ids.map((id) => ({
      id,
      title: PRODUCTS[id].title,
      copies: result.copies[id] ? copiesLabel(result.copies[id]) : null,
      download: `/api/download?session_id=${sid}&id=${encodeURIComponent(id)}`,
    }));
    return res.status(200).json({ status: result.paid ? "paid" : "unpaid", items });
  } catch (error) {
    return res.status(404).json({ error: "Order not found." });
  }
};
