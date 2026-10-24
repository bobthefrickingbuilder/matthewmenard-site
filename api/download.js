const { readFile } = require("node:fs/promises");
const path = require("node:path");
const PRODUCTS = require("../lib/products");
const { stripeClient, paidItems } = require("../lib/stripe");

// Sends a purchased PDF after checking the Stripe session is paid and includes it.
module.exports = async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).send("Method not allowed");
  const stripe = stripeClient();
  if (!stripe) return res.status(500).send("Downloads are not configured yet.");

  const product = PRODUCTS[req.query.id];
  if (!product) return res.status(404).send("Score not found.");

  let result;
  try {
    result = await paidItems(stripe, req.query.session_id);
  } catch (error) {
    return res.status(404).send("Order not found.");
  }
  if (!result || !result.paid || !result.ids.includes(product.id)) {
    return res.status(403).send("This download needs a completed purchase. Email mmenardproduction@gmail.com if something looks wrong.");
  }

  const pdf = await readFile(path.join(process.cwd(), "private-scores", product.file));
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${product.file}"`);
  res.setHeader("Cache-Control", "private, no-store");
  res.setHeader("X-Robots-Tag", "noindex");
  res.status(200).send(pdf);
};
