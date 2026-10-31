const PRODUCTS = require("../lib/products");
const { stripeClient } = require("../lib/stripe");
const { sendMail, addresses } = require("../lib/mail");
const { copiesLabel, unpackCopies } = require("../lib/copies");

// Stripe calls this when a checkout is paid. It emails the buyer their download links,
// so a closed thank-you page never loses a purchase. The links are the same ones the
// thank-you page shows (/api/download checks the order with Stripe every time).
//
// Setup (Stripe Dashboard → Developers → Webhooks → Add endpoint):
//   URL:    https://www.matthewmenardmusic.com/api/stripe-webhook
//   Events: checkout.session.completed, checkout.session.async_payment_succeeded
// Then put the endpoint's signing secret (whsec_…) in Vercel as STRIPE_WEBHOOK_SECRET.

// Stripe signs the exact bytes it sent, so the body is read raw (see config at the end).
async function rawBody(req) {
  if (Buffer.isBuffer(req.rawBody)) return req.rawBody; // local dev server
  const chunks = [];
  for await (const chunk of req) chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  return Buffer.concat(chunks);
}

function downloadEmail(origin, session, ids) {
  const sid = encodeURIComponent(session.id);
  const copies = unpackCopies(session.metadata?.copies);
  const list = ids.map((id) => `${PRODUCTS[id].title}${copies[id] ? `\nLicensed for ${copiesLabel(copies[id])} copies` : ""}\n${origin}/api/download?session_id=${sid}&id=${encodeURIComponent(id)}`);
  return [
    `Thank you for your order. Your ${ids.length === 1 ? "score is" : "scores are"} ready to download:`,
    "",
    list.join("\n\n"),
    "",
    "Keep this email: the links work again whenever you need to download another copy.",
    "If anything goes wrong, reply to this email.",
    "",
    "Matthew Menard",
    origin.replace(/^https?:\/\//, ""),
  ].join("\n");
}

async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Method not allowed");
  const stripe = stripeClient();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) return res.status(500).send("Webhook is not configured.");

  let event;
  try {
    event = stripe.webhooks.constructEvent(await rawBody(req), req.headers["stripe-signature"], secret);
  } catch (error) {
    return res.status(400).send("Invalid signature.");
  }

  // Card payments are paid on "completed"; slower methods arrive later as "async_payment_succeeded".
  const wanted = ["checkout.session.completed", "checkout.session.async_payment_succeeded"];
  const session = event.data.object;
  if (!wanted.includes(event.type) || session.payment_status !== "paid") return res.status(200).send("Ignored.");

  const ids = (session.metadata?.items || "").split(",").filter((id) => PRODUCTS[id]);
  const email = session.customer_details?.email;
  if (!ids.length || !email) return res.status(200).send("Nothing to send.");

  const { to: owner, from } = addresses();
  const origin = `${req.headers["x-forwarded-proto"] || "https"}://${req.headers.host}`;
  try {
    await sendMail({
      to: email,
      from,
      replyTo: owner || undefined,
      subject: ids.length === 1 ? `Your score: ${PRODUCTS[ids[0]].title}` : "Your scores from Matthew Menard",
      text: downloadEmail(origin, session, ids),
    });
  } catch (error) {
    // A non-2xx reply makes Stripe retry later, so a mail outage does not lose the email.
    console.error("stripe-webhook mail", error.message);
    return res.status(500).send("Could not send the email.");
  }
  return res.status(200).send("Sent.");
}

module.exports = handler;
// Tells Vercel not to parse the body before this function sees it.
module.exports.config = { api: { bodyParser: false } };
