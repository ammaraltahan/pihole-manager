export interface PiHoleConfig {
  baseUrl: string;
  password?: string;
  sid: string | null; // Session ID for authenticated requests
}

export interface SettingsState {
  piHoleConfig: PiHoleConfig | null;
  lastConnected?: string;
  authRequired: boolean | null;
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
    sid: string | null;
    csrf: string | null;
    validity: number;
    message: string | null;
  } | null;
  took: number | null;
}

export interface TestAuthResponse {
  requiresAuth: boolean;
  connected: boolean;
  message: string;
  session: AuthResponse['session'] | null;
}

export interface AuthRequest {
  password: string;
}

export interface BlockingStatus {
  blocking: 'enabled' | 'disabled' | 'failed' | 'unknown';
  timer: number|null;
  took: number;
}