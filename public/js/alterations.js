// Client alteration page. The private key comes from the link (#k=…), is remembered in this
// browser (so the "Request a change" button on the client's own site, public/js/request-button.js,
// can open this page without it), and is sent with each call to /api/alterations.

const $ = (sel) => document.querySelector(sel);
const STATUS_LABEL = { open: "Received", "in-progress": "In progress", done: "Done", cancelled: "Cancelled" };

function readKey() {
  const fromHash = new URLSearchParams(location.hash.slice(1)).get("k");
  try {
    if (fromHash) localStorage.setItem("alt-key", fromHash);
    return fromHash || localStorage.getItem("alt-key");
  } catch {
    return fromHash;
  }
}

const key = readKey();
const form = $("[data-alt-form]");
const status = $("[data-alt-status]");

async function call(body) {
  const res = await fetch("/api/alterations", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ key, ...body }),
  });
  const data = await res.json().catch(() => ({ ok: false, message: "Something went wrong." }));
  return { status: res.status, ...data };
}

function missing(message) {
  $("[data-intro]").textContent = "Use the private link Matthew sent you to request changes to your website.";
  if (message) $("[data-missing-text]").textContent = message;
  $("[data-missing]").hidden = false;
}

function showCount(used, allowance) {
  $("[data-used]").textContent = used;
  $("[data-allowance]").textContent = allowance;
  $("[data-meter]").style.width = `${Math.min(100, allowance ? (used / allowance) * 100 : 100)}%`;
  $("[data-meter]").classList.toggle("is-full", used >= allowance);
  $("[data-over]").hidden = used < allowance;
}

function showRecent(items) {
  const list = $("[data-recent]");
  list.replaceChildren(
    ...items.map((item) => {
      const li = document.createElement("li");
      const title = document.createElement("span");
      const meta = document.createElement("span");
      title.className = "alt-recent__title";
      title.textContent = item.title;
      meta.className = `badge badge--${item.status}`;
      meta.textContent = STATUS_LABEL[item.status] || item.status;
      const when = document.createElement("span");
      when.className = "meta";
      when.textContent = `${item.id} · ${new Date(item.created).toLocaleDateString("en-CA", { month: "short", day: "numeric" })}`;
      li.append(title, when, meta);
      return li;
    })
  );
  $("[data-recent-empty]").hidden = items.length > 0;
}

async function load() {
  const data = await call({ action: "status" });
  if (!data.ok) {
    // A stopped or replaced link: forget it so the next visit asks for the new one.
    if (data.status === 404) try { localStorage.removeItem("alt-key"); } catch {}
    return missing(data.message);
  }
  $("[data-intro]").textContent = `Hello ${data.client.name}. Tell Matthew what to change on your website and he will take care of it.`;
  $("[data-plan-name]").textContent = `${data.client.plan} plan`;
  $("[data-site]").textContent = data.client.site || "";
  $("[data-month]").textContent = data.month;
  showCount(data.used, data.allowance);
  showRecent(data.recent);
  try {
    const site = new URL(/^https?:\/\//.test(data.client.site) ? data.client.site : `https://${data.client.site}`);
    site.searchParams.set("requests", "on");
    $("[data-button-link]").href = site.href;
    $("[data-button-tip]").hidden = false;
  } catch {
    // No website on file, or not a usable address: leave the tip hidden.
  }
  $("[data-app]").hidden = false;
}

function fieldError(name, message) {
  const input = form.elements[name];
  const id = `${input.id}-error`;
  document.getElementById(id)?.remove();
  input.removeAttribute("aria-invalid");
  input.setAttribute("aria-describedby", (input.getAttribute("aria-describedby") || "").replace(id, "").trim());
  if (!message) return;
  const p = document.createElement("p");
  p.className = "error-message";
  p.id = id;
  p.textContent = message;
  input.closest(".field").append(p);
  input.setAttribute("aria-invalid", "true");
  input.setAttribute("aria-describedby", `${input.getAttribute("aria-describedby")} ${id}`.trim());
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const values = { title: form.elements.title.value.trim(), details: form.elements.details.value.trim(), links: form.elements.links.value.trim() };
  fieldError("title", values.title ? "" : "Say briefly what to change.");
  fieldError("details", values.details ? "" : "Add the details.");
  if (!values.title || !values.details) {
    status.textContent = "Fill in the highlighted fields.";
    form.querySelector("[aria-invalid='true']").focus();
    return;
  }

  const button = form.querySelector("button[type=submit]");
  button.disabled = true;
  status.textContent = "Sending…";
  try {
    const data = await call({ action: "submit", ...values });
    if (!data.ok) {
      for (const [name, message] of Object.entries(data.errors || {})) if (form.elements[name]) fieldError(name, message);
      throw new Error(data.message || "Check the highlighted fields.");
    }
    form.reset();
    status.textContent = `Sent. Your request number is ${data.id}. A confirmation is on its way to your email.`;
    await load();
  } catch (error) {
    status.textContent = `${error.message} You can also email mmenardproduction@gmail.com.`;
  } finally {
    button.disabled = false;
  }
});

if (key) load().catch(() => missing("The page could not load. Refresh, or email mmenardproduction@gmail.com."));
else missing();
