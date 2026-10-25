// Small key-value store for website clients and their alteration requests.
// Production uses Upstash Redis over its REST API (no SDK). Add it in Vercel → Storage →
// Upstash for Redis, connected to this project; that sets KV_REST_API_URL and KV_REST_API_TOKEN.
// Without those outside Vercel, data lives in memory, so the pages can be tried locally.
// It is lost when the local server stops.

const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

function configured() {
  return Boolean(URL_ && TOKEN) || !process.env.VERCEL;
}

// Sends one Redis command, e.g. redis("SET", "key", "value").
async function redis(...command) {
  const res = await fetch(URL_, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(command),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.error) throw new Error(`Store ${res.status}: ${body.error || "request failed"}`);
  return body.result;
}

// In-memory stand-in with the same operations, for local use only.
const memory = { values: new Map(), sets: new Map(), sorted: new Map() };
const local = {
  async get(key) { return memory.values.get(key) ?? null; },
  async mget(keys) { return keys.map((k) => memory.values.get(k) ?? null); },
  async set(key, value) { memory.values.set(key, value); },
  async del(key) { memory.values.delete(key); },
  async incr(key, by = 1) {
    const next = Number(memory.values.get(key) || 0) + by;
    memory.values.set(key, String(next));
    return next;
  },
  async expire() {},
  async sadd(key, member) { (memory.sets.get(key) || memory.sets.set(key, new Set()).get(key)).add(member); },
  async smembers(key) { return [...(memory.sets.get(key) || [])]; },
  async zadd(key, score, member) { (memory.sorted.get(key) || memory.sorted.set(key, new Map()).get(key)).set(member, score); },
  async zrevrange(key, start, stop) {
    const entries = [...(memory.sorted.get(key) || new Map())].sort((a, b) => b[1] - a[1]);
    return entries.slice(start, stop + 1).map(([member]) => member);
  },
};

const remote = {
  get: (key) => redis("GET", key),
  mget: (keys) => (keys.length ? redis("MGET", ...keys) : []),
  set: (key, value) => redis("SET", key, value),
  del: (key) => redis("DEL", key),
  incr: (key, by = 1) => redis("INCRBY", key, by),
  expire: (key, seconds) => redis("EXPIRE", key, seconds),
  sadd: (key, member) => redis("SADD", key, member),
  smembers: (key) => redis("SMEMBERS", key),
  zadd: (key, score, member) => redis("ZADD", key, score, member),
  zrevrange: (key, start, stop) => redis("ZRANGE", key, start, stop, "REV"),
};

const raw = () => (URL_ && TOKEN ? remote : local);

// JSON helpers on top of the raw operations.
const store = {
  configured,
  raw,
  async getJson(key) {
    const value = await raw().get(key);
    return value ? JSON.parse(value) : null;
  },
  async getManyJson(keys) {
    return (await raw().mget(keys)).map((v) => (v ? JSON.parse(v) : null));
  },
  setJson: (key, value) => raw().set(key, JSON.stringify(value)),
};

module.exports = store;
