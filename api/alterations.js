const alt = require("../lib/alterations");
const store = require("../lib/store");
const { validate } = require("../lib/forms");
const { sendMail, addresses } = require("../lib/mail");
const clientAuth = require("../lib/client-auth");
const { sameOrigin } = require("../lib/admin-auth");

// Website clients request alterations here (/alterations). They sign in by email (lib/client-auth.js);
// an old private link (#k=…) also signs them in. After that a cookie identifies them.
// POST { action: "signin", email }                → emails a one-time sign-in link if the email is a client's
// POST { action: "verify", token }                → uses that link and signs this browser in
// POST { action: "signout" }
// POST { action: "status", key? }                 → plan, this month's count, recent requests
// POST { action: "submit", title, details, links } → saves the request and emails Matthew

const SCHEMA = {
  title: { label: "What to change", required: true, max: 140 },
  details: { label: "Details", required: true, max: 5000 },
  links: { label: "Links", max: 2000 },
};
const DAILY_LIMIT = 15; // Per client, to stop a leaked link from flooding the inbox.

function summary(client, month) {
  return alt.used(client.id, month).then((used) => ({
    client: { name: client.name, site: client.site, plan: alt.PLANS[client.plan]?.name || client.plan },
    month: alt.monthLabel(month),
    used,
    allowance: alt.PLANS[client.plan]?.allowance ?? 0,
  }));
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Robots-Tag", "noindex");
  if (req.method !== "POST") return res.status(405).json({ ok: false, message: "Method not allowed" });
  if (!store.configured()) return res.status(500).json({ ok: false, message: "Requests are not set up yet. Email Matthew instead." });

  if (!sameOrigin(req)) return res.status(403).json({ ok: false, message: "Not allowed." });

  const body = req.body && typeof req.body === "object" ? req.body : {};

  if (body.action === "signin") {
    const email = String(body.email || "").trim().slice(0, 200);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ ok: false, errors: { email: "Enter your email address." } });
    // Same answer whether or not the email is a client's, so the page does not reveal who is.
    const answer = { ok: true, message: `If ${email} is on Matthew's client list, a sign-in link is on its way. It works once, within 30 minutes.` };
    if (!(await clientAuth.allowSignin(req, email))) return res.status(200).json(answer);
    const clients = await clientAuth.clientsByEmail(email);
    if (!clients.length) return res.status(200).json(answer);
    const base = process.env.VERCEL_ENV === "production" ? "https://www.matthewmenardmusic.com" : `${process.env.VERCEL ? "https" : "http"}://${req.headers.host}`;
    const links = [];
    for (const c of clients) links.push(`${clients.length > 1 ? `${c.site || c.name}:\n` : ""}${base}/alterations#t=${await clientAuth.startLogin(c.id)}`);
    try {
      await sendMail({
        to: clients[0].email,
        from: addresses().from,
        replyTo: addresses().to,
        subject: "Your sign-in link for website changes",
        text: `Hello ${clients[0].name},\n\nOpen this link to sign in and send Matthew a change for your website:\n\n${links.join("\n\n")}\n\nIt works once, within 30 minutes. After that you stay signed in on this device.\nIf you did not ask for this, ignore this email.\n\n—\nMatthew Menard`,
      });
    } catch (error) {
      console.error("alterations signin mail", error.message);
      return res.status(500).json({ ok: false, message: "The sign-in email could not be sent. Email mmenardproduction@gmail.com instead." });
    }
    return res.status(200).json(answer);
  }

  if (body.action === "verify") {
    const signedIn = await clientAuth.useLogin(body.token);
    if (!signedIn) return res.status(401).json({ ok: false, signin: true, message: "That sign-in link has expired or was already used. Enter your email for a new one." });
    await clientAuth.startSession(res, signedIn.id);
    return res.status(200).json({ ok: true });
  }

  if (body.action === "signout") {
    await clientAuth.endSession(req, res);
    return res.status(200).json({ ok: true });
  }

  let client;
  if (body.key) {
    client = await alt.clientByKey(body.key);
    if (!client) return res.status(401).json({ ok: false, signin: true, message: "That link no longer works. Enter your email to sign in instead." });
    await clientAuth.startSession(res, client.id);
  } else {
    client = await clientAuth.sessionClient(req);
    if (!client) return res.status(401).json({ ok: false, signin: true, message: "" });
  }

  const month = alt.monthKey();

  if (body.action === "status") {
    const recent = (await alt.listRequests(`alts:${client.id}`, 10)).map((r) => ({
      id: r.id, title: r.title, status: r.status, created: r.created,
    }));
    return res.status(200).json({ ok: true, ...(await summary(client, month)), recent });
  }

  if (body.action !== "submit") return res.status(400).json({ ok: false, message: "Unknown action." });

  const { data, errors } = validate({ title: body.title, details: body.details, links: body.links }, SCHEMA);
  if (Object.keys(errors).length) return res.status(400).json({ ok: false, errors });

  const today = new Date().toISOString().slice(0, 10);
  const daily = await store.raw().incr(`daily:${client.id}:${today}`);
  await store.raw().expire(`daily:${client.id}:${today}`, 60 * 60 * 26);
  if (daily > DAILY_LIMIT) return res.status(429).json({ ok: false, message: "That is a lot of requests for one day. Email Matthew directly instead." });

  const { request, used } = await alt.createRequest(client, data);
  const plan = alt.PLANS[client.plan] || { name: client.plan, allowance: 0 };
  const over = used > plan.allowance;
  const { to, from } = addresses();

  try {
    await sendMail({
      to,
      from,
      replyTo: client.email,
      subject: `Alteration ${request.id} · ${client.name}: ${data.title}`,
      text: [
        `Client: ${client.name} (${client.site || "no site listed"})`,
        `Plan: ${plan.name}, ${used} of ${plan.allowance} used in ${alt.monthLabel(month)}${over ? " (over the plan)" : ""}`,
        "",
        `What to change: ${data.title}`,
        "",
        data.details,
        "",
        `Links:\n${data.links || "-"}`,
        "",
        "Track it at /admin on matthewmenardmusic.com.",
      ].join("\n"),
    });
  } catch (error) {
    // The request is saved and shows in the tracker even if this email fails.
    console.error("alterations owner mail", error.message);
  }

  if (client.email) {
    try {
      await sendMail({
        to: client.email,
        from,
        replyTo: to,
        subject: `Alteration ${request.id} received: ${data.title}`,
        text: `Hello ${client.name},\n\nMatthew received your alteration request ${request.id}: "${data.title}".\nYou will get another email when it is done.\n\nThis month: ${over ? `${used} alterations requested; your plan includes ${plan.allowance}. Matthew will let you know before doing extra work.` : `${used} of ${plan.allowance} alterations used.`}\n\n—\nMatthew Menard`,
      });
    } catch (error) {
      console.error("alterations client mail", error.message);
    }
  }

  return res.status(200).json({ ok: true, id: request.id, used, allowance: plan.allowance, over });
};
