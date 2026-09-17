const Stripe = require("stripe");
const PRODUCTS = require("../lib/products");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    res.status(500).json({ error: "Stripe is not configured yet (missing STRIPE_SECRET_KEY)." });
    return;
  }

  const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

  let items;
  try {
    items = req.body && req.body.items;
    if (!Array.isArray(items) || items.length === 0) throw new Error("empty");
  } catch (e) {
    res.status(400).json({ error: "No items in cart." });
    return;
  }

  const ids = [...new Set(items)].filter((id) => PRODUCTS[id]);
  if (ids.length === 0) {
    res.status(400).json({ error: "No valid items in cart." });
    return;
  }

  const line_items = ids.map((id) => {
    const p = PRODUCTS[id];
    return {
      quantity: 1,
      price_data: {
        currency: p.currency,
        unit_amount: p.amount,
        product_data: { name: p.title },
      },
    };
  });

  const proto = req.headers["x-forwarded-proto"] || "https";
  const origin = `${proto}://${req.headers.host}`;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items,
      success_url: `${origin}/success/?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout/`,
      metadata: { items: ids.join(",") },
    });
    res.status(200).json({ url: session.url });
  } catch (err) {
    res.status(500).json({ error: "Could not start checkout. Please try again." });
  }
};
