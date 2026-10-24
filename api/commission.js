const { validate, spamReason, respond } = require("../lib/forms");
const { sendMail, addresses } = require("../lib/mail");

// Options must match public/commissions.html exactly.
const PROJECT_TYPES = ["Musician", "Ensemble or choir", "Artist", "Small business", "Other"];
const PAGES = ["Home", "About or bio", "Music, works, or portfolio", "Events or calendar", "Listen and watch",
  "Shop or store", "Booking or lessons", "Blog or news", "Contact form", "Other"];
// [TODO: owner to set budget ranges; keep in sync with the select on /commissions]
const BUDGETS = ["Not sure yet"];

const SCHEMA = {
  name: { label: "Name", required: true, max: 100 },
  email: { label: "Email", type: "email", required: true, max: 200 },
  organization: { label: "Organization", max: 200 },
  projectType: { label: "Project type", type: "select", options: PROJECT_TYPES, required: true },
  needs: { label: "What the site needs to do", required: true, max: 5000 },
  pages: { label: "Pages", type: "multi", options: PAGES },
  budget: { label: "Budget range", type: "select", options: BUDGETS },
  launch: { label: "Desired launch date", max: 40 },
  inspiration: { label: "Links", max: 2000 },
  referral: { label: "How you heard", max: 300 },
  consent: { label: "Consent", type: "checkbox", required: true },
};

const FALLBACK = "Email mmenardproduction@gmail.com instead.";

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { data, errors } = validate(req.body, SCHEMA);
  if (Object.keys(errors).length) return respond(req, res, { ok: false, errors });

  // Pretend success to bots so they do not retry.
  const spam = spamReason(req, req.body);
  if (spam === "rate limit") return respond(req, res, { ok: false, status: 429, message: `Too many requests from this connection. Try again in a few minutes, or ${FALLBACK.toLowerCase()}` });
  if (spam) return respond(req, res, { ok: true, redirect: "/request-sent" });

  const { to, from } = addresses();
  if (process.env.VERCEL_ENV === "production" && (!to || !from)) {
    console.error("commission: mail addresses not configured");
    return respond(req, res, { ok: false, status: 500, message: `The form is not set up yet. ${FALLBACK}` });
  }

  const summary = [
    `Name: ${data.name}`,
    `Email: ${data.email}`,
    `Organization: ${data.organization || "-"}`,
    `Project type: ${data.projectType}`,
    `Pages: ${data.pages.join(", ") || "-"}`,
    `Budget: ${data.budget || "-"}`,
    `Desired launch: ${data.launch || "-"}`,
    `Heard about Matthew: ${data.referral || "-"}`,
  ].join("\n");

  try {
    await sendMail({
      to,
      from,
      replyTo: data.email,
      subject: `Website request: ${data.projectType} — ${data.name}`,
      text: `${summary}\n\nWhat the site needs to do:\n${data.needs}\n\nLinks:\n${data.inspiration || "-"}\n\n—\nSent from the commissions form on matthewmenardmusic.com`,
    });
  } catch (error) {
    console.error("commission", error.message);
    return respond(req, res, { ok: false, status: 502, message: `The request could not be sent. Try again, or ${FALLBACK.toLowerCase()}` });
  }

  // Confirmation to the requester. Fixed wording only: nothing they typed is echoed back,
  // so the form cannot be used to send someone else arbitrary text.
  try {
    await sendMail({
      to: data.email,
      from,
      replyTo: to,
      subject: "Your website request was received",
      text: "Hello,\n\nThank you for your website request. Matthew Menard received it and will reply by email.\n\nIf you did not send this request, you can ignore this message.\n\n—\nmatthewmenardmusic.com/commissions",
    });
  } catch (error) {
    // The owner already has the request; a failed confirmation should not show as a failure.
    console.error("commission confirmation", error.message);
  }

  return respond(req, res, { ok: true, redirect: "/request-sent" });
};
