const { validate, spamReason, respond } = require("../lib/forms");
const { sendMail, addresses } = require("../lib/mail");

const TOPICS = ["A score", "A music commission", "A performance or booking", "Lessons", "Something else"];

const SCHEMA = {
  name: { label: "Name", required: true, max: 100 },
  email: { label: "Email", type: "email", required: true, max: 200 },
  topic: { label: "Topic", type: "select", options: TOPICS, required: true },
  message: { label: "Message", required: true, max: 5000 },
  consent: { label: "Consent", type: "checkbox", required: true },
};

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { data, errors } = validate(req.body, SCHEMA);
  if (Object.keys(errors).length) return respond(req, res, { ok: false, errors });

  // Pretend success to bots so they do not retry.
  const spam = spamReason(req, req.body);
  if (spam === "rate limit") return respond(req, res, { ok: false, status: 429, message: "Too many messages from this connection. Try again in a few minutes, or email directly." });
  if (spam) return respond(req, res, { ok: true, redirect: "/message-sent" });

  const { to, from } = addresses();
  if (process.env.VERCEL_ENV === "production" && (!to || !from)) {
    console.error("contact: mail addresses not configured");
    return respond(req, res, { ok: false, status: 500, message: "The form is not set up yet. Email mmenardproduction@gmail.com instead." });
  }

  try {
    await sendMail({
      to,
      from,
      replyTo: data.email,
      subject: `Website message: ${data.topic} — ${data.name}`,
      text: `${data.message}\n\n—\nFrom: ${data.name} <${data.email}>\nTopic: ${data.topic}\nSent from the contact form on matthewmenardmusic.com`,
    });
  } catch (error) {
    console.error("contact", error.message);
    return respond(req, res, { ok: false, status: 502, message: "The message could not be sent. Try again, or email mmenardproduction@gmail.com." });
  }
  return respond(req, res, { ok: true, redirect: "/message-sent" });
};
