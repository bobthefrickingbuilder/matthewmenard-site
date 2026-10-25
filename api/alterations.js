const alt = require("../lib/alterations");
const store = require("../lib/store");
const { validate } = require("../lib/forms");
const { sendMail, addresses } = require("../lib/mail");

// Website clients request alterations here, from their private link (/alterations#k=…).
// POST { action: "status", key }                     → plan, this month's count, recent requests
// POST { action: "submit", key, title, details, links } → saves the request and emails Matthew

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

  const body = req.body && typeof req.body === "object" ? req.body : {};
  const client = await alt.clientByKey(body.key);
  if (!client) return res.status(404).json({ ok: false, message: "This link is not valid. Use the latest link Matthew sent you, or email him for a new one." });

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
