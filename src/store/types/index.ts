export interface PiHoleConfig {
  baseUrl: string;
  password?: string;
  sid?: string; // Session ID for authenticated requests
}

export interface SettingsState {
  piHoleConfig: PiHoleConfig | null;
  isConnected: boolean;
  isAuthenticated: boolean;
  lastConnected?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  sid: string | null | undefined;
  requiresAuth: boolean;
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
  enabled: boolean;
}