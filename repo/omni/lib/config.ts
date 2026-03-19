/**
 * config
 * @app-description OMNI shared configuration, regex patterns, and interfaces.
 */

// ── Mutable Config (set once by omni.ts at startup) ──
export const config = {
  autoMode: false,
  harvestDepth: 3,
  desktopPath: "/home/user/desktop",
  logging: true,
};

export const MAX_DEPTH = 3;

// ── Regex Patterns ──
export const IP_RE = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;
export const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
export const NAME_RE = /\b([A-Z][a-z-]+[ ]+[A-Z][a-z-]+)\b/g;
export const URL_RE = /(https?:\/\/[^\s$.?#].[^\s]*)|(www\.[^\s$.?#].[^\s]*)/gi;
export const PHONE_RE = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/g;
export const HANDLE_RE = /@\S+/g;
export const DOMAIN_RE = /^(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;

// ── Interfaces ──
export interface ScanResult {
  query: string;
  social: string[];
  contact: string[];
  ip: string[];
  address: string[];
  additional: string[];
}

export interface HarvestReport {
  results: ScanResult[];
  allIPs: string[];
  allEmails: string[];
  allSocial: string[];
}

export interface PortInfo {
  port: number;
  service: string;
  version: string;
  isOpen: boolean;
  filtered: boolean;
}
