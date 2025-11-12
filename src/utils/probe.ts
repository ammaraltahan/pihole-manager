import dns from 'react-native-dns-lookup';

// src/utils/probe.ts
export type ProbeInput = {
  baseUrl: string;       // e.g., "http://192.168.1.50" or "http://pi.hole"
  host?: string;         // optional hostname (if user provided separately)
  ip?: string;           // optional IP (if user provided separately)
  timeoutMs?: number;
};

export type ProbeResult = {
  piholeApi: {
    blockingEndpoint: { reachable: boolean; status?: number; error?: string };
    versionEndpoint:  { reachable: boolean; status?: number; error?: string; version?: unknown };
  };
  hostnameReachability?: { reachable: boolean; status?: number; error?: string };
  ipReachability?:       { reachable: boolean; status?: number; error?: string };
  dnsLookup?:            { ok: boolean; addresses?: string[]; error?: string }; // optional
};

const withTimeout = async <T>(p: Promise<T>, ms: number) => {
  let t: any;
  return Promise.race([
    p,
    new Promise<T>((_, rej) => (t = setTimeout(() => rej(new Error('timeout')), ms))),
  ]).finally(() => clearTimeout(t));
};

const ok = (status: number) => status === 200 || status === 401; // Pi-hole returns 401 for /auth when auth is required

export async function probeEnvironment({
  baseUrl,
  host,
  ip,
  timeoutMs = 6000,
}: ProbeInput): Promise<ProbeResult> {
  const trim = (s: string) => s.replace(/\/+$/, '');
  const base = trim(baseUrl || '');
  const isAbs = /^https?:\/\//i.test(base);

  const makeUrl = (root: string, path: string) =>
    `${trim(root)}${path.startsWith('/') ? '' : '/'}${path}`;

  const endpoints = {
    blocking: makeUrl(base, '/api/dns/blocking'),
    version:  makeUrl(base, '/api/info/version'),
    auth:     makeUrl(base, '/api/auth'),
  };

  const res: ProbeResult = {
    piholeApi: {
      blockingEndpoint: { reachable: false },
      versionEndpoint:  { reachable: false },
    },
  };

  // 1) Pi-hole API: dns/blocking
  try {
    const r = await withTimeout(fetch(endpoints.blocking), timeoutMs);
    res.piholeApi.blockingEndpoint.reachable = r.ok;
    res.piholeApi.blockingEndpoint.status = r.status;
  } catch (e: any) {
    res.piholeApi.blockingEndpoint.error = e?.message ?? String(e);
  }

  // 2) Pi-hole API: info/version
  try {
    const r = await withTimeout(fetch(endpoints.version), timeoutMs);
    res.piholeApi.versionEndpoint.reachable = r.ok;
    res.piholeApi.versionEndpoint.status = r.status;
    if (r.ok) {
      try { res.piholeApi.versionEndpoint.version = await r.json(); } catch {}
    }
  } catch (e: any) {
    res.piholeApi.versionEndpoint.error = e?.message ?? String(e);
  }

  // 3) Hostname reachability (if provided)
  if (host) {
    try {
      const r = await withTimeout(fetch(makeUrl(`http://${host}`, '/api/auth')), timeoutMs);
      res.hostnameReachability = { reachable: ok(r.status), status: r.status };
    } catch (e: any) {
      res.hostnameReachability = { reachable: false, error: e?.message ?? String(e) };
    }
  }

  // 4) IP reachability (if provided)
  if (ip) {
    try {
      const r = await withTimeout(fetch(makeUrl(`http://${ip}`, '/api/auth')), timeoutMs);
      res.ipReachability = { reachable: ok(r.status), status: r.status };
    } catch (e: any) {
      res.ipReachability = { reachable: false, error: e?.message ?? String(e) };
    }
  }

  // 5) Optional: DNS lookup via native module for hostname visibility (non-blocking)
  if (host) {
    try {
      if (dns?.getIpAddressesForHostname) {
        const [...addrs] = await withTimeout(dns.getIpAddressesForHostname(host), timeoutMs);
        res.dnsLookup = { ok: Array.isArray(addrs) && addrs.length > 0, addresses: addrs || [] };
      }
    } catch (e: any) {
      res.dnsLookup = { ok: false, error: e?.message ?? String(e) };
    }
  }

  return res;
}