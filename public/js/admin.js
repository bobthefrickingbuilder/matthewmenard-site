// Matthew's alterations tracker. Talks to /api/admin; everything is built with textContent,
// so nothing a client typed is ever treated as HTML.

const $ = (sel) => document.querySelector(sel);
const STATUSES = [
  ["open", "Open"],
  ["in-progress", "In progress"],
  ["done", "Done"],
  ["cancelled", "Cancelled (not counted)"],
];
let state = null;

async function call(action, body = {}) {
  const res = await fetch("/api/admin", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ action, ...body }),
  });
  const data = await res.json().catch(() => ({ ok: false, message: "Something went wrong." }));
  if (data.signedOut) showLogin();
  return data;
}

function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === "class") node.className = v;
    else if (k === "text") node.textContent = v;
    else if (k.startsWith("data-") || k.startsWith("aria-") || k === "for" || k === "role") node.setAttribute(k, v);
    else node[k] = v;
  }
  node.append(...children.filter((c) => c !== null && c !== undefined));
  return node;
}

const date = (iso) => new Date(iso).toLocaleString("en-CA", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

function showLogin() {
  $("[data-dashboard]").hidden = true;
  $("[data-signed-in]").hidden = true;
  $("[data-login]").hidden = false;
  $("[data-admin-month]").textContent = "Sign in to see requests.";
}

function renderRequests() {
  const show = $("[data-show]").value;
  const items = state.requests.filter((r) =>
    show === "all" ? true : show === "active" ? r.status === "open" || r.status === "in-progress" : r.status === show
  );
  const list = $("[data-requests]");
  list.replaceChildren(
    ...items.map((r) => {
      const select = el("select", { class: "select", id: `st-${r.num}` },
        ...STATUSES.map(([value, label]) => el("option", { value, text: label, selected: r.status === value })));
      select.addEventListener("change", () => setStatus(r, select));
      const links = r.links
        ? el("ul", { class: "admin-request__links", role: "list" },
            ...r.links.split("\n").filter(Boolean).map((line) => {
              const text = line.trim();
              const safe = /^https?:\/\//i.test(text);
              return el("li", {}, safe ? el("a", { href: text, rel: "noopener noreferrer", target: "_blank", text }) : el("span", { text }));
            }))
        : null;
      return el("li", { class: `admin-request card is-${r.status}` },
        el("div", { class: "admin-request__top" },
          el("p", { class: "admin-request__id", text: `${r.id} · ${r.client}` }),
          el("p", { class: "meta", text: date(r.created) })),
        el("h3", { class: "h4", text: r.title }),
        el("details", { class: "admin-request__details" },
          el("summary", { text: "Details" }),
          el("p", { class: "admin-request__body", text: r.details }),
          links),
        el("div", { class: "field admin-request__status" },
          el("label", { for: `st-${r.num}`, text: "Status" }), select));
    })
  );
  $("[data-requests-empty]").hidden = items.length > 0;
}

function renderClients() {
  const current = state.clients.filter((c) => !c.removed);
  const removed = state.clients.filter((c) => c.removed);
  const list = $("[data-clients]");
  list.replaceChildren(
    ...current.map((c) => {
      const plan = el("select", { class: "select", id: `pl-${c.id}` },
        ...Object.entries(state.plans).map(([value, p]) => el("option", { value, text: `${p.name} (${p.allowance} a month)`, selected: c.plan === value })));
      plan.addEventListener("change", () => updateClient(c, { plan: plan.value }));
      const linkButton = el("button", { class: "button button--secondary", type: "button", text: "New private link" });
      linkButton.addEventListener("click", () => newLink(c));
      const pause = el("button", { class: "button button--secondary", type: "button", text: c.active ? "Pause link" : "Resume link" });
      pause.addEventListener("click", () => updateClient(c, { active: !c.active }));
      const remove = el("button", { class: "button button--secondary", type: "button", text: "Remove" });
      remove.addEventListener("click", () => {
        if (confirm(`Remove ${c.name}? They move to the Removed list and can no longer sign in or send requests. You can restore them later.`)) updateClient(c, { removed: true }, "removed");
      });
      const pct = Math.min(100, c.allowance ? (c.used / c.allowance) * 100 : 100);
      const fill = el("span", { class: `meter__fill${c.used >= c.allowance ? " is-full" : ""}` });
      fill.style.width = `${pct}%`;
      return el("li", { class: `admin-client card${c.active ? "" : " is-paused"}` },
        el("div", { class: "admin-client__head" },
          el("h3", { class: "h4", text: c.name }),
          el("p", { class: "meta", text: [c.site, c.email].filter(Boolean).join(" · ") }),
          c.active ? null : el("p", { class: "badge badge--cancelled", text: "Link paused" })),
        el("p", { class: "admin-client__count", text: `${c.used} of ${c.allowance} used` }),
        el("div", { class: "meter", "aria-hidden": "true" }, fill),
        el("div", { class: "field" }, el("label", { for: `pl-${c.id}`, text: "Plan" }), plan),
        el("div", { class: "cluster" }, linkButton, pause, remove));
    })
  );
  $("[data-clients-empty]").hidden = current.length > 0;

  $("[data-removed-count]").textContent = removed.length;
  $("[data-removed]").hidden = removed.length === 0;
  $("[data-removed-clients]").replaceChildren(
    ...removed.map((c) => {
      const restore = el("button", { class: "button button--secondary", type: "button", text: "Restore" });
      restore.addEventListener("click", () => updateClient(c, { removed: false }, "restored"));
      const when = new Date(c.removed).toLocaleDateString("en-CA", { year: "numeric", month: "short", day: "numeric" });
      return el("li", { class: "admin-client card is-paused" },
        el("div", { class: "admin-client__head" },
          el("h3", { class: "h4", text: c.name }),
          el("p", { class: "meta", text: [c.site, c.email].filter(Boolean).join(" · ") }),
          el("p", { class: "meta", text: `Removed ${when}` })),
        el("div", { class: "cluster" }, restore));
    })
  );
}

async function refresh() {
  const data = await call("overview");
  if (!data.ok) {
    if (!data.signedOut) $("[data-login-status]").textContent = data.message;
    return;
  }
  state = data;
  $("[data-admin-month]").textContent = `${data.month}. Counts start again on the 1st.`;
  const plans = $("[data-plan-options]");
  if (!plans.options.length) for (const [value, p] of Object.entries(data.plans)) plans.append(el("option", { value, text: `${p.name} (${p.allowance} a month)` }));
  renderRequests();
  renderClients();
  $("[data-login]").hidden = true;
  $("[data-dashboard]").hidden = false;
  $("[data-signed-in]").hidden = false;
}

async function setStatus(request, select) {
  const notify = $("[data-notify]").checked;
  const data = await call("setStatus", { num: request.num, status: select.value, notify });
  $("[data-request-status]").textContent = data.ok
    ? data.message || `${request.id} is now ${select.selectedOptions[0].text.toLowerCase()}.`
    : data.message;
  await refresh();
}

async function updateClient(client, changes, done = "updated") {
  const data = await call("updateClient", { id: client.id, ...changes });
  $("[data-client-status]").textContent = data.ok ? `${client.name} ${done}.` : data.message || Object.values(data.errors || {}).join(" ");
  await refresh();
}

function showLink(name, link) {
  $("[data-link-for]").textContent = name;
  $("[data-link]").value = link;
  const panel = $("[data-link-panel]");
  panel.hidden = false;
  panel.focus();
}

async function newLink(client) {
  if (!confirm(`Make a new private link for ${client.name}? Their current link will stop working.`)) return;
  const data = await call("newLink", { id: client.id });
  if (data.ok) showLink(client.name, data.link);
  else $("[data-client-status]").textContent = data.message;
}

$("[data-copy]").addEventListener("click", async () => {
  const input = $("[data-link]");
  try {
    await navigator.clipboard.writeText(input.value);
    $("[data-copy]").textContent = "Copied";
  } catch {
    input.select();
  }
  setTimeout(() => ($("[data-copy]").textContent = "Copy"), 2000);
});

$("[data-login-form]").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  $("[data-login-status]").textContent = "Signing in…";
  const data = await call("login", { password: form.elements.password.value });
  form.reset();
  if (!data.ok) return ($("[data-login-status]").textContent = data.message);
  $("[data-login-status]").textContent = "";
  await refresh();
  $("#queue-title").setAttribute("tabindex", "-1");
  $("#queue-title").focus();
});

$("[data-add-form]").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const values = Object.fromEntries(["name", "email", "site", "plan"].map((k) => [k, form.elements[k].value.trim()]));
  const status = $("[data-add-status]");
  status.textContent = "Adding…";
  const data = await call("addClient", values);
  if (!data.ok) return (status.textContent = data.message || Object.values(data.errors || {}).join(" "));
  status.textContent = `${values.name} added.`;
  form.reset();
  await refresh();
  showLink(values.name, data.link);
});

$("[data-show]").addEventListener("change", renderRequests);
$("[data-logout]").addEventListener("click", async () => {
  await call("logout");
  state = null;
  showLogin();
});

refresh().then(() => {
  if (!state) showLogin();
});
