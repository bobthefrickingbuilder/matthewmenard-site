const box = document.querySelector("[data-order]");
const heading = box.querySelector("h1");
const message = box.querySelector("[data-order-message]");
const list = box.querySelector("[data-order-items]");

function show(title, text) {
  heading.textContent = title;
  message.textContent = text;
}

const sessionId = new URLSearchParams(location.search).get("session_id");

if (!sessionId) {
  show("No order found", "This page needs an order reference from checkout. If you just paid, check your email for the Stripe receipt, then contact Matthew with it.");
} else {
  try {
    const res = await fetch(`/api/verify-session?session_id=${encodeURIComponent(sessionId)}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    if (data.status !== "paid") {
      show("Payment not confirmed yet", "If you completed checkout, wait a few seconds and refresh. If it still shows this, contact Matthew with your Stripe receipt.");
    } else {
      show("Thank you", `Your ${data.items.length > 1 ? "scores are" : "score is"} ready. A receipt is on its way to your email. Bookmark this page to download again later.`);
      list.replaceChildren(
        ...data.items.map((item) => {
          const li = document.createElement("li");
          const a = document.createElement("a");
          a.className = "button button--primary";
          a.href = item.download;
          a.textContent = `Download ${item.title} (PDF)`;
          li.append(a);
          return li;
        })
      );
      try {
        localStorage.removeItem("mm_cart");
      } catch {}
    }
  } catch {
    show("Could not check the order", "Contact Matthew with your Stripe receipt and he will send the score directly.");
  }
}
