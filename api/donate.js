const { stripeClient } = require("../lib/stripe");
const { readFile } = require("node:fs/promises");
const path = require("node:path");
const d = require("../lib/donations");
const book = require("../lib/book");

// Donations for the free textbook (/teaching). See lib/donations.js.
// POST kind=monthly                → Stripe Checkout for $5 a month
// POST kind=once, amount=5|10|20|more, custom=dollars → Stripe Checkout for a one-time gift
//   (form posts get a 303 to Stripe; JSON posts get { url })
// GET  ?session_id=cs_…            → { paid, monthly, amount, manage, chapters } for the thank-you page
// GET  ?book=cs_…&file=ch08|…|zip  → that file from private-book/, for a paid coffee of $5 or more
// GET  ?manage=cus_…&sig=…         → 303 to the Stripe portal (update card or cancel)

function origin(req) {
  return process.env.VERCEL_ENV === "production" ? "https://www.matthewmenardmusic.com" : `${req.headers["x-forwarded-proto"] || "http"}://${req.headers.host}`;
}

async function start(req, res, stripe) {
  const isForm = (req.headers["content-type"] || "").includes("application/x-www-form-urlencoded");
  const fail = (message) =>
    isForm ? res.status(400).send(`${message} Go back and try again, or email mmenardproduction@gmail.com.`) : res.status(400).json({ error: message });
  const body = req.body && typeof req.body === "object" ? req.body : {};
  const base = origin(req);
  const common = {
    success_url: `${base}/thank-you?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${base}/teaching#support`,
    metadata: { kind: d.KIND },
  };

  let session;
  if (body.kind === "monthly") {
    session = await stripe.checkout.sessions.create({
      ...common,
      mode: "subscription",
      line_items: [{
        quantity: 1,
        price_data: { currency: d.CURRENCY, unit_amount: d.MONTHLY, recurring: { interval: "month" }, product_data: { name: "Monthly coffee for Music Theory Fundamentals" } },
      }],
      subscription_data: { metadata: { kind: d.KIND } },
    });
  } else if (body.kind === "once") {
    const dollars = body.amount === "more" ? String(body.custom || "").trim() : String(body.amount || "");
    const cents = /^\d+(\.\d{1,2})?$/.test(dollars) ? Math.round(Number(dollars) * 100) : NaN;
    if (!(cents >= d.ONCE_MIN && cents <= d.ONCE_MAX)) return fail("Enter an amount from $5 to $1,000.");
    session = await stripe.checkout.sessions.create({
      ...common,
      mode: "payment",
      submit_type: "donate",
      line_items: [{ quantity: 1, price_data: { currency: d.CURRENCY, unit_amount: cents, product_data: { name: "Coffee for Music Theory Fundamentals" } } }],
    });
  } else {
    return fail("Choose monthly or one time.");
  }
  return isForm ? res.redirect(303, session.url) : res.status(200).json({ url: session.url });
}

// A paid coffee of $5 or more (once or monthly) unlocks the book for good, new chapters included.
const unlocks = (s) => s.metadata?.kind === d.KIND && s.payment_status === "paid" && (s.amount_total || 0) >= book.UNLOCK;
const validId = (id) => typeof id === "string" && /^cs_[A-Za-z0-9_]{10,200}$/.test(id);

async function thanks(req, res, stripe) {
  const id = req.query.session_id;
  if (!validId(id)) return res.status(400).json({ error: "Missing or invalid reference." });
  const session = await stripe.checkout.sessions.retrieve(id);
  if (session.metadata?.kind !== d.KIND) return res.status(404).json({ error: "Not found." });
  const monthly = session.mode === "subscription";
  const paid = session.payment_status === "paid";
  return res.status(200).json({
    paid,
    monthly,
    amount: session.amount_total,
    manage: monthly && paid && session.customer ? d.manageUrl(origin(req), session.customer) : null,
    chapters: unlocks(session) ? [...book.CHAPTERS, book.ZIP].map(({ id, n, part, title, pages }) => ({ id, n, part, title, pages, url: `/api/donate?book=${encodeURIComponent(session.id)}&file=${id}` })) : [],
  });
}

async function download(req, res, stripe) {
  const file = book.FILES[req.query.file];
  if (!file || !validId(req.query.book)) return res.status(404).send("File not found.");
  let session;
  try {
    session = await stripe.checkout.sessions.retrieve(req.query.book);
  } catch (error) {
    return res.status(404).send("Order not found.");
  }
  if (!unlocks(session)) return res.status(403).send("This chapter unlocks with a coffee of $5 or more. Email mmenardproduction@gmail.com if something looks wrong.");
  const data = await readFile(path.join(process.cwd(), "private-book", file.file));
  res.setHeader("Content-Type", file.id === "zip" ? "application/zip" : "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${file.file}"`);
  res.setHeader("X-Robots-Tag", "noindex");
  return res.status(200).send(data);
}

async function manage(req, res, stripe) {
  const customer = String(req.query.manage);
  if (!/^cus_[A-Za-z0-9]{6,60}$/.test(customer) || !d.validSignature(customer, req.query.sig)) {
    return res.status(404).send("This link is not valid. Email mmenardproduction@gmail.com and Matthew will cancel or change it for you.");
  }
  const portal = await stripe.billingPortal.sessions.create({
    customer,
    configuration: await d.portalConfigId(stripe),
    return_url: `${origin(req)}/teaching`,
  });
  return res.redirect(303, portal.url);
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "private, no-store");
  const stripe = stripeClient();
  if (!stripe) return res.status(500).send("Donations are not set up yet.");
  try {
    if (req.method === "POST") return await start(req, res, stripe);
    if (req.method === "GET" && req.query.book) return await download(req, res, stripe);
    if (req.method === "GET" && req.query.manage) return await manage(req, res, stripe);
    if (req.method === "GET") return await thanks(req, res, stripe);
    return res.status(405).send("Method not allowed");
  } catch (error) {
    console.error("donate", error.message);
    return res.status(502).send("Something went wrong with the payment page. Try again, or email mmenardproduction@gmail.com.");
  }
};
