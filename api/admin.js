const alt = require("../lib/alterations");
const store = require("../lib/store");
const auth = require("../lib/admin-auth");
const { validate } = require("../lib/forms");
const { sendMail, addresses } = require("../lib/mail");

// Matthew's private tracker (/admin). Every call is POST JSON with an "action".
//   login { password } · logout · overview
//   addClient { name, email, site, plan } · updateClient { id, …fields } · newLink { id }
//   setStatus { num, status, notify }
// Private links are returned only when a client is added or given a new link.

const CLIENT_SCHEMA = {
  name: { label: "Name", required: true, max: 120 },
  email: { label: "Email", type: "email", required: true, max: 200 },
  site: { label: "Website", max: 200 },
  plan: { label: "Plan", type: "select", options: Object.keys(alt.PLANS), required: true },
};

const linkFor = (req, key) => `${req.headers["x-forwarded-proto"] || (process.env.VERCEL ? "https" : "http")}://${req.headers.host}/alterations#k=${key}`;

async function overview() {
  const month = alt.monthKey();
  const clients = await alt.listClients();
  const counts = await Promise.all(clients.map((c) => alt.used(c.id, month)));
  const names = Object.fromEntries(clients.map((c) => [c.id, c.name]));
  const requests = (await alt.listRequests()).map((r) => ({ ...r, client: names[r.clientId] || "Removed client" }));
  return {
    month: alt.monthLabel(month),
    plans: alt.PLANS,
    clients: clients.map((c, i) => ({
      id: c.id, name: c.name, email: c.email, site: c.site, plan: c.plan, active: c.active !== false, removed: c.removed || null,
      used: counts[i], allowance: alt.PLANS[c.plan]?.allowance ?? 0,
    })),
    requests,
  };
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Robots-Tag", "noindex");
  if (req.method !== "POST") return res.status(405).json({ ok: false, message: "Method not allowed" });
  if (!auth.sameOrigin(req)) return res.status(403).json({ ok: false, message: "Not allowed." });
  if (!store.configured()) return res.status(500).json({ ok: false, message: "Storage is not set up yet (KV_REST_API_URL and KV_REST_API_TOKEN)." });

  const body = req.body && typeof req.body === "object" ? req.body : {};

  if (body.action === "login") {
    const result = await auth.login(req, res, body.password);
    return res.status(result.ok ? 200 : result.status).json(result);
  }
  if (body.action === "logout") {
    auth.logout(res);
    return res.status(200).json({ ok: true });
  }
  if (!auth.signedIn(req)) return res.status(401).json({ ok: false, signedOut: true, message: "Sign in again." });

  switch (body.action) {
    case "overview":
      return res.status(200).json({ ok: true, ...(await overview()) });

    case "addClient": {
      const { data, errors } = validate({ name: body.name, email: body.email, site: body.site, plan: body.plan }, CLIENT_SCHEMA);
      if (Object.keys(errors).length) return res.status(400).json({ ok: false, errors });
      const { client, key } = await alt.createClient(data);
      return res.status(200).json({ ok: true, id: client.id, link: linkFor(req, key) });
    }

    case "updateClient": {
      const current = await alt.getClient(body.id);
      if (!current) return res.status(404).json({ ok: false, message: "No such client." });
      const merged = { name: current.name, email: current.email, site: current.site, plan: current.plan };
      for (const k of Object.keys(merged)) if (typeof body[k] === "string") merged[k] = body[k];
      const { data, errors } = validate(merged, CLIENT_SCHEMA);
      if (Object.keys(errors).length) return res.status(400).json({ ok: false, errors });
      const changes = { ...data };
      if (typeof body.active === "boolean") changes.active = body.active;
      // Removing moves a client to the Removed list and stops their link and sign-in; restoring undoes both.
      if (typeof body.removed === "boolean") {
        changes.removed = body.removed ? new Date().toISOString() : null;
        changes.active = !body.removed;
      }
      await alt.updateClient(body.id, changes);
      return res.status(200).json({ ok: true });
    }

    case "newLink": {
      const result = await alt.newLink(body.id);
      if (!result) return res.status(404).json({ ok: false, message: "No such client." });
      return res.status(200).json({ ok: true, link: linkFor(req, result.key) });
    }

    case "setStatus": {
      if (!alt.STATUSES.includes(body.status)) return res.status(400).json({ ok: false, message: "Unknown status." });
      const result = await alt.setStatus(Number(body.num), body.status);
      if (!result) return res.status(404).json({ ok: false, message: "No such request." });
      const { request } = result;
      if (body.notify && request.status === "done" && result.was !== "done") {
        const client = await alt.getClient(request.clientId);
        const { to, from } = addresses();
        if (client?.email) {
          try {
            await sendMail({
              to: client.email,
              from,
              replyTo: to,
              subject: `Alteration ${request.id} is done: ${request.title}`,
              text: `Hello ${client.name},\n\nYour alteration ${request.id}, "${request.title}", is done and live on your site.\nIf anything looks wrong, reply to this email.\n\n—\nMatthew Menard`,
            });
          } catch (error) {
            console.error("admin done mail", error.message);
            return res.status(200).json({ ok: true, request, message: "Marked done, but the email to the client failed." });
          }
        }
      }
      return res.status(200).json({ ok: true, request });
    }

    default:
      return res.status(400).json({ ok: false, message: "Unknown action." });
  }
};
