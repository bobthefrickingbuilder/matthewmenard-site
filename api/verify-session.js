const Stripe = require("stripe");
const PRODUCTS = require("../lib/products");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    res.status(500).json({ error: "Stripe is not configured yet (missing STRIPE_SECRET_KEY)." });
    return;
  }

  const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
  const sessionId = req.query.session_id;

  if (!sessionId) {
    res.status(400).json({ error: "Missing session_id." });
    return;
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const ids = (session.metadata && session.metadata.items ? session.metadata.items.split(",") : []).filter(
      (id) => PRODUCTS[id]
    );
    const items = ids.map((id) => ({
      id,
      title: PRODUCTS[id].title,
      fileUrl: PRODUCTS[id].fileUrl,
    }));

    res.status(200).json({ status: session.payment_status, items });
  } catch (err) {
    res.status(404).json({ error: "Order not found." });
  }
};
