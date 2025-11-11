export interface PiHoleStatus {
  status: 'enabled' | 'disabled';
  domains_being_blocked: number;
  dns_queries_today: number;
  ads_blocked_today: number;
  ads_percentage_today: number;
  unique_domains: number;
  queries_forwarded: number;
  queries_cached: number;
  clients_ever_seen: number;
  unique_clients: number;
  gravity_last_updated: {
    file_exists: boolean;
    absolute: number;
    relative: {
      days: number;
      hours: number;
      minutes: number;
    };
  };
}

// Types based on Pi-hole v6 API
export interface PiHoleSummary {
  queries: {
    total: number,
    blocked: number,
    percent_blocked: number,
    unique_domains: number,
    forwarded: number,
    cached: number,
    frequency: number,
    types: {
      A: number,
      AAAA: number,
      ANY: number,
      SRV: number,
      SOA: number,
      PTR: number,
      TXT: number,
      NAPTR: number,
      MX: number,
      DS: number,
      RRSIG: number,
      DNSKEY: number,
      NS: number,
      SVCB: number,
      HTTPS: number,
      OTHER: number
    },
    status: {
      UNKNOWN: number,
      GRAVITY: number,
      FORWARDED: number,
      CACHE: number,
      REGEX: number,
      DENYLIST: number,
      EXTERNAL_BLOCKED_IP: number,
      EXTERNAL_BLOCKED_NULL: number,
      EXTERNAL_BLOCKED_NXRA: number,
      GRAVITY_CNAME: number,
      REGEX_CNAME: number,
      DENYLIST_CNAME: number,
      RETRIED: number,
      RETRIED_DNSSEC: number,
      IN_PROGRESS: number,
      DBBUSY: number,
      SPECIAL_DOMAIN: number,
      CACHE_STALE: number,
      EXTERNAL_BLOCKED_EDE15: number
    },
    replies: {
      UNKNOWN: number,
      NODATA: number,
      NXDOMAIN: number,
      CNAME: number,
      IP: number,
      DOMAIN: number,
      RRNAME: number,
      SERVFAIL: number,
      REFUSED: number,
      NOTIMP: number,
      OTHER: number,
      DNSSEC: number,
      NONE: number,
      BLOB: number
    }
  },
  clients: {
    active: number,
    total: number
  },
  gravity: {
    domains_being_blocked: number,
    last_update: number
  },
  took: number
}

export interface SystemInfo {
  system: {
    uptime: number;
    memory: {
      ram: {
        total: number;
        free: number;
        used: number;
        available: number;
        "%used": number;
      };
      swap: {
        total: number,
        used: number,
        free: number,
        "%used": number;
      }
    },
    "procs": number,
    "cpu": {
      nprocs: number,
      "%cpu": number,
      load: {
        raw: [
          number,
          number,
          number
        ],
        percent: [
          number,
          number,
          number
        ]
      }
    },
    ftl: {
      "%mem": number,
      "%cpu": number
    }
  },
  took: number
}

export interface PiHoleConfig {
  baseUrl: string;
  apiToken?: string;
}

export interface PiHoleConfig {
  baseUrl: string;
  apiToken?: string;
}

export interface SettingsState {
  piHoleConfig: PiHoleConfig | null;
  isConnected: boolean;
  lastConnected?: string;
}

// Query log entries vary by Pi-hole version and configuration. Provide common
// fields and allow extra properties. Some API responses return arrays instead
// of objects; if that's the case you can map the array into this shape in a
// transformer before using it.
export interface QueryLog {
    timestamp?: number;      // unix timestamp
    date?: string;           // human readable date/time
    domain?: string;
    query_type?: string;     // e.g. "A", "AAAA"
    status?: string;         // e.g. "OK", "NXDOMAIN", "PIHOLE"
    client?: string;         // IP or client name
    reply?: string;          // reply from upstream
    forwarded?: string | null;
    forwarded_to?: string | null;

    // raw array if you prefer to keep the original shape
    raw?: any[];

    // Allow any other fields
    [key: string]: any;
}

export interface RecentBlocked {
    blocked: string[];
    took: number;
}
