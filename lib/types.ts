// @ts-nocheck
// ============================================================================
// SECTION: Type Definitions
// ============================================================================

export interface PortInfo {
  port: number;
  state: "open" | "closed" | "filtered" | "forwarded";
  service: string;
  version?: string;
  target: string;  // Target IP (LAN IP or forwarded destination)
  forwarded?: {
    externalPort: number;
    internalPort: number;
    targetIp?: string;
  };
}

export interface Seed {
  value: string;
  type: "ip" | "domain" | "email" | "cidr";
  addedAt: string;
  resolvedIp?: string;
}

export interface IPAsset {
  value: string;
  status: "discovered" | "scanned" | "exploited" | "pwned";
  deviceType?: "router" | "firewall" | "printer" | "server" | "workstation" | "unknown";
  ports: PortInfo[];
  parent?: string;
  discoveredBy: string;
  discoveredAt: string;
  notes?: string;
  // Extended metadata from dig/probe
  lanIp?: string;
  essid?: string;
  config?: Record<string, string | boolean | number>;
}

export interface DomainAsset {
  value: string;
  source: "seed" | "subfinder" | "lynx" | "dns";
  parent?: string;
  resolvedIp?: string;
  vulnerable?: boolean;
  discoveredAt: string;
}

export interface HistoryEntry {
  timestamp: string;
  module: string;
  target?: string;
  action: string;
  result: "success" | "failure" | "partial";
  data?: unknown;
}

export interface MissionManifest {
  name: string;
  created: string;
  updated: string;
  seeds: Seed[];
  assets: {
    ips: IPAsset[];
    domains: DomainAsset[];
    emails: string[];
    credentials: Array<{ user: string; pass: string; source: string }>;
    hashes: string[];
    ntlmHashes: Array<{ ip: string; username: string; hash: string; cracked?: string; dumpedAt: string }>;
    sessions: Array<{
      type: "jwt" | "cookie" | "token" | "api_key";
      value: string;
      source: string;
      target: string;
      extractedAt: string;
      decoded?: unknown;
    }>;
    files: string[];
    directories: Array<{ path: string; target: string; discoveredAt: string; source: string }>;
  };
  history: HistoryEntry[];
}

export interface ModuleMeta {
  name: string;
  command: string;
  description: string;
  requires: string[];
  inputs: string[];
  outputs: string[];
}

export interface NewAsset {
  type: "ip" | "domain" | "email" | "credential" | "hash" | "session" | "directory";
  value: unknown;
  parent?: string;
  // Extended metadata for IP assets (from dig/probe)
  deviceType?: "router" | "firewall" | "printer" | "server" | "workstation" | "unknown";
  lanIp?: string;
  essid?: string;
  config?: Record<string, string | boolean | number>;
  // Port scan results
  ports?: PortInfo[];
}

export interface ModuleResult {
  success: boolean;
  data?: unknown;
  newAssets?: NewAsset[];
}

export interface UI {
  info(msg: string): void;
  success(msg: string): void;
  warn(msg: string): void;
  error(msg: string): void;
  section(title: string): void;
  divider(): void;
  print(label: string, value?: string, colors?: { label?: string; value?: string }): void;
  table(headers: string[], rows: Array<Record<string, unknown>>, options?: { rowColor?: (row: Record<string, unknown>) => string }): void;
}

export type ModuleFunction = (mission: MissionManifest, ui: UI, args?: string[]) => Promise<ModuleResult>;
