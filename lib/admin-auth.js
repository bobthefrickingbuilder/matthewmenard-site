// Login for Matthew's private tracker (/admin). One password, set in Vercel as ADMIN_PASSWORD.
// A signed cookie keeps him signed in for 12 hours; ADMIN_SESSION_SECRET signs it.
// Five wrong passwords from one connection lock it out for 15 minutes.

const crypto = require("node:crypto");
const store = require("./store");

const COOKIE = "mm_admin";
const SESSION_HOURS = 12;
const MAX_FAILS = 5;
const LOCK_SECONDS = 15 * 60;

const secret = () => process.env.ADMIN_SESSION_SECRET || "";
const sign = (value) => crypto.createHmac("sha256", secret()).update(value).digest("base64url");

function same(a, b) {
  const x = crypto.createHash("sha256").update(String(a)).digest();
  const y = crypto.createHash("sha256").update(String(b)).digest();
  return crypto.timingSafeEqual(x, y);
}

function configured() {
  return Boolean(process.env.ADMIN_PASSWORD && secret().length >= 32);
}

function cookies(req) {
  return Object.fromEntries(
    String(req.headers.cookie || "").split(";").map((c) => c.trim().split("=")).filter(([k]) => k).map(([k, ...v]) => [k, v.join("=")])
  );
}

function cookieHeader(value, maxAge) {
  const secure = process.env.VERCEL ? "; Secure" : "";
  return `${COOKIE}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure}`;
}

function signedIn(req) {
  if (!configured()) return false;
  const [expires, mac] = String(cookies(req)[COOKIE] || "").split(".");
  if (!expires || !mac || Number(expires) < Date.now()) return false;
  return same(sign(expires), mac);
}

const ip = (req) => String(req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown").split(",")[0].trim();

// Returns { ok } or { ok: false, status, message }.
async function login(req, res, password) {
  if (!configured()) return { ok: false, status: 500, message: "The tracker is not set up yet: ADMIN_PASSWORD and ADMIN_SESSION_SECRET are missing." };
  const failKey = `fail:${ip(req)}`;
  const fails = Number((await store.raw().get(failKey)) || 0);
  if (fails >= MAX_FAILS) return { ok: false, status: 429, message: "Too many wrong passwords. Try again in 15 minutes." };
  if (typeof password !== "string" || !same(password, process.env.ADMIN_PASSWORD)) {
    await store.raw().incr(failKey);
    await store.raw().expire(failKey, LOCK_SECONDS);
    return { ok: false, status: 401, message: "That password is not right." };
  }
  await store.raw().del(failKey);
  const expires = String(Date.now() + SESSION_HOURS * 3600 * 1000);
  res.setHeader("Set-Cookie", cookieHeader(`${expires}.${sign(expires)}`, SESSION_HOURS * 3600));
  return { ok: true };
}

function logout(res) {
  res.setHeader("Set-Cookie", cookieHeader("", 0));
}

// Requests that change data must be same-origin JSON. Browsers will not send that from
// another site without asking first, and the cookie is SameSite=Strict as well.
function sameOrigin(req) {
  const type = String(req.headers["content-type"] || "");
  if (!type.includes("application/json")) return false;
  const origin = req.headers.origin;
  if (!origin) return true;
  try {
    return new URL(origin).host === req.headers.host;
  } catch {
    return false;
  }
}

module.exports = { configured, signedIn, login, logout, sameOrigin };
