// Shared form handling for /api/contact and /api/commission:
// validation, sanitizing, spam checks, and the response style (JSON for fetch, redirect without JS).

const HONEYPOT = "website"; // Hidden field; people never fill it, bots often do.
const STARTED = "t"; // Set by JS to the time the form was shown.
const MIN_FILL_MS = 3000;
const RATE_LIMIT = { max: 5, windowMs: 10 * 60 * 1000 };
const SYSTEM_FIELDS = new Set([HONEYPOT, STARTED]);

const hits = new Map(); // ip → timestamps. Per function instance; a fallback, not a guarantee.

function clean(value, max) {
  return String(value ?? "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/\r\n?/g, "\n")
    .trim()
    .slice(0, max);
}

// schema: { field: { label, required, max, type: "text"|"email"|"select"|"checkbox"|"multi", options } }
function validate(body, schema) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return { errors: { form: "The form was empty." } };
  const unknown = Object.keys(body).filter((k) => !(k in schema) && !SYSTEM_FIELDS.has(k));
  if (unknown.length) return { errors: { form: "The form had unexpected fields." } };

  const data = {};
  const errors = {};
  for (const [name, rule] of Object.entries(schema)) {
    const raw = body[name];
    if (rule.type === "checkbox") {
      data[name] = raw === "on" || raw === "true" || raw === true;
      if (rule.required && !data[name]) errors[name] = `${rule.label} is required.`;
      continue;
    }
    if (rule.type === "multi") {
      const values = [].concat(raw ?? []).map((v) => clean(v, 60));
      data[name] = values.filter((v) => rule.options.includes(v));
      if (data[name].length !== values.length) errors[name] = `Choose ${rule.label.toLowerCase()} from the list.`;
      continue;
    }
    if (Array.isArray(raw)) {
      errors[name] = `${rule.label} has more than one value.`;
      continue;
    }
    const value = clean(raw, rule.max ?? 200);
    data[name] = value;
    if (String(raw ?? "").trim().length > (rule.max ?? 200)) errors[name] = `${rule.label} is too long (${rule.max} characters at most).`;
    else if (rule.required && !value) errors[name] = `${rule.label} is required.`;
    else if (value && rule.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) errors[name] = "Enter a full email address, like name@example.com.";
    else if (value && rule.type === "select" && !rule.options.includes(value)) errors[name] = `Choose ${rule.label.toLowerCase()} from the list.`;
  }
  return { data, errors };
}

// Returns a reason string when the submission looks automated, otherwise null.
function spamReason(req, body) {
  if (clean(body?.[HONEYPOT], 200)) return "honeypot";
  const started = Number(body?.[STARTED]);
  if (started && Date.now() - started < MIN_FILL_MS) return "too fast";

  const ip = String(req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown").split(",")[0].trim();
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < RATE_LIMIT.windowMs);
  recent.push(now);
  hits.set(ip, recent);
  if (recent.length > RATE_LIMIT.max) return "rate limit";
  return null;
}

const wantsJson = (req) => (req.headers.accept || "").includes("application/json");

function respond(req, res, { ok, status = ok ? 200 : 400, errors, message, redirect }) {
  if (wantsJson(req)) return res.status(status).json({ ok, errors, message });
  if (ok) return res.redirect(303, redirect);
  const list = Object.values(errors || { form: message }).map((e) => `- ${e}`).join("\n");
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  return res.status(status).send(`The form could not be sent:\n\n${list}\n\nGo back, fix the fields, and send it again.`);
}

module.exports = { validate, spamReason, respond, HONEYPOT, STARTED };
