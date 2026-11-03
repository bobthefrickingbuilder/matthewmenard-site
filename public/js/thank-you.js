// Thank-you page after a coffee: asks /api/donate about the Stripe session, then shows the
// amount and, for monthly gifts, the link to update the card or cancel.

const box = document.querySelector("[data-thanks]");
const id = new URLSearchParams(location.search).get("session_id");

if (box && id) {
  try {
    const res = await fetch(`/api/donate?session_id=${encodeURIComponent(id)}`);
    const data = res.ok ? await res.json() : null;
    if (data?.paid) {
      const amount = new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(data.amount / 100);
      box.querySelector("[data-thanks-message]").textContent =
        `Your ${amount}${data.monthly ? " a month" : ""} helps keep Music Theory Fundamentals free for everyone.`;
      if (data.monthly && data.manage) {
        box.querySelector("[data-thanks-manage-link]").href = data.manage;
        box.querySelector("[data-thanks-manage]").hidden = false;
      }
    }
  } catch {
    // Keep the general thank-you text.
  }
}
