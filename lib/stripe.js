const Stripe = require("stripe");
const PRODUCTS = require("./products");
const { unpackCopies } = require("./copies");

function stripeClient() {
  return process.env.STRIPE_SECRET_KEY ? Stripe(process.env.STRIPE_SECRET_KEY) : null;
}

// A checkout session's purchased product IDs and licensed copies, only if it is paid.
async function paidItems(stripe, sessionId) {
  if (typeof sessionId !== "string" || !/^cs_[A-Za-z0-9_]{10,200}$/.test(sessionId)) return null;
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (session.payment_status !== "paid") return { paid: false, ids: [], copies: {} };
  const ids = (session.metadata?.items || "").split(",").filter((id) => PRODUCTS[id]);
  return { paid: true, ids, copies: unpackCopies(session.metadata?.copies) };
}

module.exports = { stripeClient, paidItems };
