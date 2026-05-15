// Server profile — persisted
export interface Server {
  id: string;
  name: string;       // auto-derived from baseUrl hostname
  baseUrl: string;
  password?: string;
}

// Per-server runtime connection state — NOT persisted
export interface ServerSession {
  isConnected: boolean;
  isAuthenticated: boolean;
  sid?: string;
  requiresAuth: boolean;
}

export interface ServersState {
  servers: Server[];
  activeServerId: string | null;
  sessions: Record<string, ServerSession>;
}

export interface QueryLogItem {
  timestamp: number;
  type: number;
  domain: string;
  client: string;
  status: string;
  reply: string;
}

export interface QueryLogResponse {
  data: QueryLogItem[];
  total: number;
}

export interface AuthResponse {
  session: {
    valid: boolean;
    totp: boolean;
    sid: string | null | undefined;
    csrf: string | null;
    validity: number;
    message: string | null;
  };
  took: number;
}

export interface AuthRequest {
  password: string;
}

export interface BlockingStatus {
  blocking: 'enabled' | 'disabled' | 'failed' | 'unknown';
  timer: number | null;
  took: number;
}
