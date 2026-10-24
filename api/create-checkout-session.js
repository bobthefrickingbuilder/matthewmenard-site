const PRODUCTS = require("../lib/products");
const { stripeClient } = require("../lib/stripe");

// Starts a Stripe Checkout session for one or more scores.
// JSON body { items: [ids] } → JSON { url } (cart page with JS).
// Form body items=id (repeatable) → 303 redirect to Stripe (works without JS).
module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const isForm = (req.headers["content-type"] || "").includes("application/x-www-form-urlencoded");
  const fail = (status, message) =>
    isForm ? res.status(status).send(`${message} Go back and try again, or email mmenardproduction@gmail.com.`) : res.status(status).json({ error: message });

  const stripe = stripeClient();
  if (!stripe) return fail(500, "Checkout is not configured yet.");

  const raw = req.body && req.body.items;
  const ids = [...new Set([].concat(raw || []).map(String))].filter((id) => PRODUCTS[id]).slice(0, 20);
  if (ids.length === 0) return fail(400, "No valid scores in the cart.");

  const origin = `${req.headers["x-forwarded-proto"] || "https"}://${req.headers.host}`;
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: ids.map((id) => ({
        quantity: 1,
        price_data: {
          currency: PRODUCTS[id].currency,
          unit_amount: PRODUCTS[id].amount,
          product_data: { name: PRODUCTS[id].title },
        },
      })),
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout`,
      metadata: { items: ids.join(",") },
    });
    return isForm ? res.redirect(303, session.url) : res.status(200).json({ url: session.url });
  } catch (error) {
    console.error("checkout", error.message);
    return fail(502, "Could not start checkout.");
  }
};
