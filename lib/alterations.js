// Website clients and their monthly alteration requests. Used by /api/alterations (clients)
// and /api/admin (Matthew's tracker). Storage is lib/store.js.
//
// Keys:
//   clients                set of client ids
//   client:{id}            client record (JSON)
//   clientkey:{hash}       client id for a private link (only the hash of the link key is stored)
//   alt:seq                last request number
//   alt:{num}              request record (JSON)
//   alts                   all request numbers, newest first (sorted by time)
//   alts:{clientId}        one client's request numbers, newest first
//   used:{clientId}:{YYYY-MM}  alterations counted for that client in that month

const crypto = require("node:crypto");
const store = require("./store");

// Keep in sync with the package cards on public/commissions.html.
const PLANS = {
  bio: { name: "Artist Bio", allowance: 4 },
  portfolio: { name: "Portfolio", allowance: 8 },
  studio: { name: "Studio", allowance: 20 },
};

const STATUSES = ["open", "in-progress", "done", "cancelled"];
const TZ = "America/Toronto";

// Months run on Ottawa time, so the count resets at midnight on the 1st there.
function monthKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit" }).formatToParts(date);
  return `${parts.find((p) => p.type === "year").value}-${parts.find((p) => p.type === "month").value}`;
}

function monthLabel(key = monthKey()) {
  const [y, m] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 15)).toLocaleString("en-CA", { month: "long", year: "numeric", timeZone: "UTC" });
}

const hash = (value) => crypto.createHash("sha256").update(String(value)).digest("hex");
const newKey = () => crypto.randomBytes(24).toString("base64url");
const formatNum = (n) => `A-${String(n).padStart(4, "0")}`;

async function getClient(id) {
  return store.getJson(`client:${id}`);
}

async function clientByKey(key) {
  if (typeof key !== "string" || key.length < 20 || key.length > 100) return null;
  const id = await store.raw().get(`clientkey:${hash(key)}`);
  if (!id) return null;
  const client = await getClient(id);
  return client && client.active !== false ? client : null;
}

async function used(clientId, month = monthKey()) {
  return Number((await store.raw().get(`used:${clientId}:${month}`)) || 0);
}

// Returns the client record and a new private-link key (shown once, never stored).
async function createClient({ name, email, site, plan }) {
  const id = crypto.randomBytes(6).toString("hex");
  const key = newKey();
  const client = { id, name, email, site, plan, keyHash: hash(key), created: new Date().toISOString(), active: true };
  await store.setJson(`client:${id}`, client);
  await store.raw().sadd("clients", id);
  await store.raw().set(`clientkey:${client.keyHash}`, id);
  return { client, key };
}

// Replaces a client's private link. The old link stops working at once.
async function newLink(id) {
  const client = await getClient(id);
  if (!client) return null;
  const key = newKey();
  await store.raw().del(`clientkey:${client.keyHash}`);
  client.keyHash = hash(key);
  await store.setJson(`client:${id}`, client);
  await store.raw().set(`clientkey:${client.keyHash}`, id);
  return { client, key };
}

async function updateClient(id, changes) {
  const client = await getClient(id);
  if (!client) return null;
  Object.assign(client, changes);
  await store.setJson(`client:${id}`, client);
  return client;
}

async function listClients() {
  const ids = await store.raw().smembers("clients");
  const clients = (await store.getManyJson(ids.map((id) => `client:${id}`))).filter(Boolean);
  return clients.sort((a, b) => a.name.localeCompare(b.name));
}

async function createRequest(client, { title, details, links }) {
  const num = await store.raw().incr("alt:seq");
  const now = new Date();
  const month = monthKey(now);
  const request = {
    num, id: formatNum(num), clientId: client.id, title, details, links,
    status: "open", month, created: now.toISOString(), updated: now.toISOString(),
  };
  await store.setJson(`alt:${num}`, request);
  await store.raw().zadd("alts", now.getTime(), String(num));
  await store.raw().zadd(`alts:${client.id}`, now.getTime(), String(num));
  const count = await store.raw().incr(`used:${client.id}:${month}`);
  await store.raw().expire(`used:${client.id}:${month}`, 60 * 60 * 24 * 400);
  return { request, used: count };
}

async function listRequests(key = "alts", limit = 200) {
  const nums = await store.raw().zrevrange(key, 0, limit - 1);
  return (await store.getManyJson(nums.map((n) => `alt:${n}`))).filter(Boolean);
}

// Cancelled requests stop counting toward the month they were made in; un-cancelling counts them again.
async function setStatus(num, status) {
  const request = await store.getJson(`alt:${num}`);
  if (!request) return null;
  const was = request.status;
  if (was === status) return request;
  if (status === "cancelled") await store.raw().incr(`used:${request.clientId}:${request.month}`, -1);
  if (was === "cancelled") await store.raw().incr(`used:${request.clientId}:${request.month}`, 1);
  request.status = status;
  request.updated = new Date().toISOString();
  if (status === "done") request.done = request.updated;
  await store.setJson(`alt:${num}`, request);
  return { request, was };
}

module.exports = {
  PLANS, STATUSES, monthKey, monthLabel, hash, formatNum,
  getClient, clientByKey, used, createClient, newLink, updateClient, listClients,
  createRequest, listRequests, setStatus,
};
