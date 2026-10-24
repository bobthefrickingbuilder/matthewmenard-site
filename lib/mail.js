// Sends plain-text email through Resend's HTTP API (no SDK).
// Without RESEND_API_KEY outside production, the email is printed to the log instead,
// so forms can be tested locally and on previews before the account exists.

async function sendMail({ to, from, replyTo, subject, text }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    if (process.env.VERCEL_ENV === "production") throw new Error("RESEND_API_KEY is not set");
    console.log(`[mail not sent: no RESEND_API_KEY]\nTo: ${to}\nFrom: ${from}\nReply-To: ${replyTo || "-"}\nSubject: ${subject}\n\n${text}\n`);
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
function addresses() {
  return {
    to: process.env.COMMISSION_TO_EMAIL || "",
    from: process.env.COMMISSION_FROM_EMAIL || "",
  };
}

module.exports = { sendMail, addresses };
