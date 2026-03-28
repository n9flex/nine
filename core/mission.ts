// @ts-nocheck
// ============================================================================
// SECTION: Imports
// ============================================================================

import { MissionManifest, Seed, IPAsset } from "../lib/types";
import { readJson, writeJson, ensureDir } from "../lib/storage";
import { sanitizeMissionName, getCurrentTimestamp, validateIp } from "../lib/utils";

// ============================================================================
// SECTION: Manifest Operations
// ============================================================================

export async function createManifest(
  missionName: string,
  seeds: string[],
  cwdAbsolute: string
): Promise<MissionManifest> {
  const sanitizedName = sanitizeMissionName(missionName);
  const timestamp = getCurrentTimestamp();

  // Process seeds into proper Seed objects and IP assets
  const seedObjects: Seed[] = [];
  const ipAssets: IPAsset[] = [];

  for (const seedValue of seeds) {
    const isIp = validateIp(seedValue);
    const seedType = isIp ? "ip" : "domain";

    seedObjects.push({
      value: seedValue,
      type: seedType as "ip" | "domain" | "email" | "cidr",
      addedAt: timestamp
    });

    // Auto-add IP seeds to assets.ips with "discovered" status
    if (isIp) {
      ipAssets.push({
        value: seedValue,
        status: "discovered",
        deviceType: "unknown",
        ports: [],
        discoveredBy: "seed",
        discoveredAt: timestamp
      });
    }
  }

  const manifest: MissionManifest = {
    name: missionName,
    created: timestamp,
    updated: timestamp,
    seeds: seedObjects,
    assets: {
      ips: ipAssets,
      domains: [],
      emails: [],
      credentials: [],
      hashes: [],
      ntlmHashes: [],
      sessions: [],
      files: [],
      directories: []
    },
    history: []
  };

  // Ensure loot directory exists and save manifest
  await ensureDir(`${cwdAbsolute}/loot/${sanitizedName}`);
  await writeJson(`${cwdAbsolute}/loot/${sanitizedName}/manifest.json`, manifest);

  return manifest;
}

export async function loadManifest(
  missionName: string,
  cwdAbsolute: string
): Promise<MissionManifest | null> {
  const sanitizedName = sanitizeMissionName(missionName);
  const path = `${cwdAbsolute}/loot/${sanitizedName}/manifest.json`;
  const manifest = await readJson<MissionManifest>(path);
  
  if (manifest) {
    // Ensure all asset arrays exist (for backward compatibility with old manifests)
    manifest.assets = {
      ips: manifest.assets.ips || [],
      domains: manifest.assets.domains || [],
      emails: manifest.assets.emails || [],
      credentials: manifest.assets.credentials || [],
      hashes: manifest.assets.hashes || [],
      ntlmHashes: manifest.assets.ntlmHashes || [],
      sessions: manifest.assets.sessions || [],
      files: manifest.assets.files || [],
      directories: manifest.assets.directories || []
    };
  }
  
  return manifest;
}

export async function saveManifest(
  manifest: MissionManifest,
  cwdAbsolute: string
): Promise<void> {
  const sanitizedName = sanitizeMissionName(manifest.name);
  manifest.updated = getCurrentTimestamp();
  const path = `${cwdAbsolute}/loot/${sanitizedName}/manifest.json`;
  await writeJson(path, manifest);
}
