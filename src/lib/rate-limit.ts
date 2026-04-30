// Tiny in-memory rate limiter with a hard size cap.
// Sufficient for per-instance throttling on Vercel; for stricter,
// platform-wide limits, swap to Upstash Redis or Vercel KV.

interface Entry {
    count: number;
    resetAt: number;
}

const MAX_ENTRIES = 5_000;

const stores = new Map<string, Map<string, Entry>>();

function getStore(name: string): Map<string, Entry> {
    let store = stores.get(name);
    if (!store) {
        store = new Map();
        stores.set(name, store);
    }
    return store;
}

function evictIfFull(store: Map<string, Entry>): void {
    if (store.size <= MAX_ENTRIES) return;
    // Drop the oldest 10% by insertion order (Map iteration is insertion-ordered).
    const drop = Math.max(1, Math.floor(MAX_ENTRIES * 0.1));
    let i = 0;
    for (const key of store.keys()) {
        store.delete(key);
        if (++i >= drop) break;
    }
}

interface CheckResult {
    limited: boolean;
    retryAfterSeconds: number;
}

/**
 * Returns whether the given key has exceeded `max` requests in `windowMs`.
 * Caller is responsible for choosing a sensible key (IP, IP+route, etc).
 */
export function checkRateLimit(
    namespace: string,
    key: string,
    max: number,
    windowMs: number,
): CheckResult {
    const store = getStore(namespace);
    const now = Date.now();
    let entry = store.get(key);

    if (!entry || now > entry.resetAt) {
        evictIfFull(store);
        entry = { count: 1, resetAt: now + windowMs };
        store.set(key, entry);
        return { limited: false, retryAfterSeconds: 0 };
    }

    entry.count += 1;
    if (entry.count > max) {
        return {
            limited: true,
            retryAfterSeconds: Math.ceil((entry.resetAt - now) / 1000),
        };
    }
    return { limited: false, retryAfterSeconds: 0 };
}

export function clientIp(request: Request): string {
    // Prefer Vercel's verified header; fall back to xff first entry.
    const real = request.headers.get("x-real-ip");
    if (real) return real;
    const fwd = request.headers.get("x-forwarded-for");
    if (fwd) return fwd.split(",")[0]?.trim() ?? "unknown";
    return "unknown";
}
