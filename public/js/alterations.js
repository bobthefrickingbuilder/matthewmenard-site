// Client alteration page. Clients sign in with their email (a one-time link, #t=…, is emailed to
// them) or an old private link (#k=…). Either starts a session cookie, so later visits, such as from the
// "Request a change" link on their own site, open straight to the form. Server: api/alterations.js.

const $ = (sel) => document.querySelector(sel);
const STATUS_LABEL = { open: "Received", "in-progress": "In progress", done: "Done", cancelled: "Cancelled" };
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Read the one-time token or key, then take it out of the address bar and history.
const params = new URLSearchParams(location.hash.slice(1));
const loginToken = params.get("t");
const linkKey = params.get("k");
if (location.hash) history.replaceState(null, "", location.pathname);
// A sign-in link opened in a tab already showing this page only changes the hash; start over with it.
addEventListener("hashchange", () => location.reload());
try {
  localStorage.removeItem("alt-key"); // Left by an earlier version of this page.
} catch {}

const form = $("[data-alt-form]");
const status = $("[data-alt-status]");
const signinForm = $("[data-signin-form]");
const signinStatus = $("[data-signin-status]");

async function call(body) {
  const res = await fetch("/api/alterations", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({ ok: false, message: "Something went wrong." }));
  return { status: res.status, ...data };
}

function showSignin(message) {
  $("[data-app]").hidden = true;
  $("[data-intro]").textContent = "Sign in with your email to send Matthew a change for your website.";
  signinStatus.textContent = message || "";
  $("[data-signin]").hidden = false;
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

async function load(key) {
  const data = await call({ action: "status", ...(key ? { key } : {}) });
  if (!data.ok) return showSignin(data.message);
  $("[data-signin]").hidden = true;
  $("[data-intro]").textContent = `Hello ${data.client.name}. Tell Matthew what to change on your website and he will take care of it.`;
  $("[data-plan-name]").textContent = `${data.client.plan} plan`;
  $("[data-site]").textContent = data.client.site || "";
  $("[data-month]").textContent = data.month;
  showCount(data.used, data.allowance);
  showRecent(data.recent);
  $("[data-app]").hidden = false;
}

function fieldError(owner, name, message) {
  const input = owner.elements[name];
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
  fieldError(form, "title", values.title ? "" : "Say briefly what to change.");
  fieldError(form, "details", values.details ? "" : "Add the details.");
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
    if (data.signin) return showSignin("You were signed out. Sign in again; your request was not sent.");
    if (!data.ok) {
      for (const [name, message] of Object.entries(data.errors || {})) if (form.elements[name]) fieldError(form, name, message);
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

signinForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const email = signinForm.elements.email.value.trim();
  fieldError(signinForm, "email", EMAIL.test(email) ? "" : "Enter your email address.");
  if (!EMAIL.test(email)) return signinForm.elements.email.focus();
  const button = signinForm.querySelector("button[type=submit]");
  button.disabled = true;
  signinStatus.textContent = "Sending…";
  try {
    const data = await call({ action: "signin", email });
    if (!data.ok) throw new Error(data.errors?.email || data.message || "Something went wrong.");
    signinStatus.textContent = `${data.message} Check your spam folder if it does not arrive.`;
  } catch (error) {
    signinStatus.textContent = error.message;
  } finally {
    button.disabled = false;
  }
});

$("[data-signout]").addEventListener("click", async () => {
  await call({ action: "signout" });
  showSignin("You are signed out on this device.");
});

async function start() {
  if (loginToken) {
    const data = await call({ action: "verify", token: loginToken });
    if (!data.ok) return showSignin(data.message);
  }
  await load(linkKey);
}

start().catch(() => showSignin("The page could not load. Refresh, or email mmenardproduction@gmail.com."));
