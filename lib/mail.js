// Sends plain-text email through Gmail (SMTP_USER + SMTP_PASS, an app password) or, if those are
// not set, Resend's HTTP API (no SDK). With neither outside production, the email is printed to the
// log instead, so forms can be tested locally and on previews.

const nodemailer = require("nodemailer");

let transport;
function smtp() {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return null;
  const port = Number(process.env.SMTP_PORT) || 465;
  transport ||= nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port,
    secure: port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  return transport;
}

async function sendMail({ to, from, replyTo, subject, text }) {
  const gmail = smtp();
  if (gmail) {
    const info = await gmail.sendMail({ from, to, replyTo: replyTo || undefined, subject, text });
    return { id: info.messageId };
  }
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    if (process.env.VERCEL_ENV === "production") throw new Error("No email set up: add SMTP_USER and SMTP_PASS, or RESEND_API_KEY");
    console.log(`[mail not sent: no SMTP_USER/SMTP_PASS or RESEND_API_KEY]\nTo: ${to}\nFrom: ${from}\nReply-To: ${replyTo || "-"}\nSubject: ${subject}\n\n${text}\n`);
    return { id: "dry-run" };
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [to], reply_to: replyTo, subject, text }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
  return res.json();
}

// Sender and recipient for site mail. One address each covers every form.
// With Gmail, both default to the Gmail address (Gmail only sends as that address anyway).
function addresses() {
  const gmail = process.env.SMTP_USER || "";
  return {
    to: process.env.COMMISSION_TO_EMAIL || gmail,
    from: process.env.COMMISSION_FROM_EMAIL || (gmail ? `Matthew Menard <${gmail}>` : ""),
  };
}

module.exports = { sendMail, addresses };
