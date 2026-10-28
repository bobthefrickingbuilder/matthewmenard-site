// Sign-in for website clients on /alterations. A client types their email; if it belongs to an
// active client, a one-time link (/alterations#t=…) is emailed to them. Opening it starts a session
// kept in an HttpOnly cookie for 120 days. An old private link (#k=…) also starts a session.
//
// Keys (only hashes of tokens are stored):
//   login:{hash}      client id for an unused sign-in link (30 minutes)
//   session:{hash}    client id for a signed-in browser (120 days)
//   signin:{hash}     sign-in emails asked for one address this hour
//   signinip:{ip}     sign-in emails asked for from one connection this hour

const crypto = require("node:crypto");
const store = require("./store");
const alt = require("./alterations");

const COOKIE = "mm_client";
const LOGIN_SECONDS = 30 * 60;
const SESSION_SECONDS = 120 * 24 * 3600;
const PER_EMAIL_HOUR = 5;
const PER_IP_HOUR = 20;

const token = () => crypto.randomBytes(24).toString("base64url");
const ip = (req) => String(req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown").split(",")[0].trim();

function cookie(req) {
  const pair = String(req.headers.cookie || "").split(";").map((c) => c.trim()).find((c) => c.startsWith(`${COOKIE}=`));
  return pair ? pair.slice(COOKIE.length + 1) : "";
}

function setCookie(res, value, maxAge) {
  const secure = process.env.VERCEL ? "; Secure" : "";
  res.setHeader("Set-Cookie", `${COOKIE}=${value}; Path=/api/alterations; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`);
}

async function putFor(key, value, seconds) {
  await store.raw().set(key, value);
  await store.raw().expire(key, seconds);
}

// Active clients whose email matches (one person can have more than one site).
async function clientsByEmail(email) {
  const wanted = String(email || "").trim().toLowerCase();
  if (!wanted) return [];
  return (await alt.listClients()).filter((c) => c.active !== false && String(c.email || "").trim().toLowerCase() === wanted);
}

// True when this address and connection may be sent another sign-in email this hour.
async function allowSignin(req, email) {
  const byEmail = `signin:${alt.hash(String(email).trim().toLowerCase())}`;
  const byIp = `signinip:${ip(req)}`;
  const [a, b] = [await store.raw().incr(byEmail), await store.raw().incr(byIp)];
  if (a === 1) await store.raw().expire(byEmail, 3600);
  if (b === 1) await store.raw().expire(byIp, 3600);
  return a <= PER_EMAIL_HOUR && b <= PER_IP_HOUR;
}

// Returns a new one-time sign-in token for a client.
async function startLogin(clientId) {
  const t = token();
  await putFor(`login:${alt.hash(t)}`, clientId, LOGIN_SECONDS);
  return t;
}

// Uses up a sign-in token. Returns the client, or null if it is wrong, used, or expired.
async function useLogin(t) {
  if (typeof t !== "string" || t.length < 20 || t.length > 100) return null;
  const key = `login:${alt.hash(t)}`;
  const id = await store.raw().get(key);
  if (!id) return null;
  await store.raw().del(key);
  const client = await alt.getClient(id);
  return client && client.active !== false ? client : null;
}

async function startSession(res, clientId) {
  const t = token();
  await putFor(`session:${alt.hash(t)}`, clientId, SESSION_SECONDS);
  setCookie(res, t, SESSION_SECONDS);
}

// The signed-in client for this browser, or null. Paused clients are signed out.
async function sessionClient(req) {
  const t = cookie(req);
  if (!t || t.length > 100) return null;
  const id = await store.raw().get(`session:${alt.hash(t)}`);
  if (!id) return null;
  const client = await alt.getClient(id);
  return client && client.active !== false ? client : null;
}

async function endSession(req, res) {
  const t = cookie(req);
  if (t && t.length <= 100) await store.raw().del(`session:${alt.hash(t)}`);
  setCookie(res, "", 0);
}

module.exports = { clientsByEmail, allowSignin, startLogin, useLogin, startSession, sessionClient, endSession, LOGIN_SECONDS };
