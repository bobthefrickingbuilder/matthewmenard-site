const PRODUCTS = require("../lib/products");
const { stripeClient } = require("../lib/stripe");
const { sendMail, addresses } = require("../lib/mail");
const { copiesLabel, unpackCopies } = require("../lib/copies");
const donations = require("../lib/donations");

// Stripe calls this when a checkout is paid. For a score it emails the buyer their download links,
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

// A donation (lib/donations.js): thank the donor, and tell Matthew.
async function thankDonor(session, origin) {
  const email = session.customer_details?.email;
  const amount = new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format((session.amount_total || 0) / 100);
  const monthly = session.mode === "subscription";
  const manage = monthly && session.customer ? donations.manageUrl(origin, session.customer) : null;
  const { to: owner, from } = addresses();
  if (email) {
    await sendMail({
      to: email,
      from,
      replyTo: owner || undefined,
      subject: "Thank you for the coffee",
      text: [
        `Thank you for supporting Music Theory Fundamentals. ${monthly ? `Your ${amount} a month` : `Your ${amount}`} helps keep the book free for everyone.`,
        "",
        ...(monthly ? ["It renews once a month. To update your card or cancel, use this link (cancelling stops it at the end of the month you have paid for):", manage || "Reply to this email and I'll cancel it for you.", ""] : []),
        "Stripe sends your receipt separately.",
        "",
        "Matthew Menard",
        origin.replace(/^https?:\/\//, ""),
      ].join("\n"),
    });
  }
  // Matthew's note is a courtesy: if it fails, Stripe must not retry and thank the donor twice.
  if (owner) {
    await sendMail({
      to: owner,
      from,
      replyTo: email || undefined,
      subject: `New coffee: ${amount}${monthly ? " a month" : ""}`,
      text: `${email || "Someone"} gave ${amount}${monthly ? " a month" : " once"} for Music Theory Fundamentals.`,
    }).catch((error) => console.error("stripe-webhook owner note", error.message));
  }
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

  if (session.metadata?.kind === donations.KIND) {
    const origin = process.env.VERCEL_ENV === "production" ? "https://www.matthewmenardmusic.com" : `${req.headers["x-forwarded-proto"] || "https"}://${req.headers.host}`;
    try {
      await thankDonor(session, origin);
    } catch (error) {
      console.error("stripe-webhook donation mail", error.message);
      return res.status(500).send("Could not send the email.");
    }
    return res.status(200).send("Thanked.");
  }

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
