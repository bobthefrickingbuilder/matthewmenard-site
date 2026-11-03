const crypto = require("node:crypto");

// "Buy me a coffee" for the free textbook on /teaching: $5 a month, or a one-time amount.
// Amounts are in cents, Canadian dollars.

const CURRENCY = "cad";
const MONTHLY = 500;
const ONCE_MIN = 100; // $1
const ONCE_MAX = 100000; // $1,000; larger gifts can be arranged by email.
const KIND = "coffee"; // metadata.kind on every donation, so the webhook can tell them from score orders.
const PORTAL_TAG = "mm-coffee"; // Marks the Stripe portal setup this site made for donors.

// Donor "manage or cancel" links carry a signature so nobody can open another donor's portal.
function sign(customerId) {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) return null;
  return crypto.createHmac("sha256", secret).update(`donor:${customerId}`).digest("base64url").slice(0, 32);
}

function validSignature(customerId, sig) {
  const want = sign(customerId);
  if (!want || typeof sig !== "string" || sig.length !== want.length) return false;
  return crypto.timingSafeEqual(Buffer.from(want), Buffer.from(sig));
}

const manageUrl = (origin, customerId) => {
  const sig = sign(customerId);
  return sig ? `${origin}/api/donate?manage=${encodeURIComponent(customerId)}&sig=${sig}` : null;
};

// Portal where monthly donors update their card or cancel (at the end of the month they paid for).
let portalId;
async function portalConfigId(stripe) {
  if (portalId) return portalId;
  for await (const c of stripe.billingPortal.configurations.list({ limit: 100, active: true })) {
    if (c.metadata?.app === PORTAL_TAG) return (portalId = c.id);
  }
  const c = await stripe.billingPortal.configurations.create({
    business_profile: { headline: "Matthew Menard: your monthly coffee" },
    features: {
      payment_method_update: { enabled: true },
      invoice_history: { enabled: true },
      subscription_cancel: { enabled: true, mode: "at_period_end" },
    },
    metadata: { app: PORTAL_TAG },
  });
  return (portalId = c.id);
}

module.exports = { CURRENCY, MONTHLY, ONCE_MIN, ONCE_MAX, KIND, manageUrl, validSignature, portalConfigId };
