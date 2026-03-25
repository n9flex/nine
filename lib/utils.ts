// @ts-nocheck
// ============================================================================
// SECTION: Imports
// ============================================================================

import { NewAsset } from "./types";

// ============================================================================
// SECTION: Asset Deduplication
// ============================================================================

export function dedupeAssets<T extends { value: string }>(
  existing: T[],
  newAssets: NewAsset[]
): {
  unique: NewAsset[];
  duplicates: string[];
} {
  const seen = new Set(existing.map(a => a.value));
  const unique: NewAsset[] = [];
  const duplicates: string[] = [];

  for (const asset of newAssets) {
    const valueStr = String(asset.value);
    if (seen.has(valueStr)) {
      duplicates.push(valueStr);
    } else {
      unique.push(asset);
      seen.add(valueStr);
    }
  }

  return { unique, duplicates };
}

// ============================================================================
// SECTION: Validation Helpers
// ============================================================================

export function validateIp(ip: string): boolean {
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return ipv4Regex.test(ip);
}

export function sanitizeMissionName(name: string): string {
  return name.replace(/[^a-zA-Z0-9_-]/g, "_").toLowerCase();
}

// ============================================================================
// SECTION: Timestamp Helper
// ============================================================================

export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}
