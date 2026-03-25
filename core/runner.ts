// @ts-nocheck
// ============================================================================
// SECTION: Imports
// ============================================================================

import { MissionManifest, ModuleMeta, ModuleResult, NewAsset, IPAsset, DomainAsset, HistoryEntry } from "../lib/types";
import { UI } from "../lib/ui";
import { saveManifest } from "./mission";
import { dedupeAssets, getCurrentTimestamp, validateIp } from "../lib/utils";

// ============================================================================
// SECTION: Module Execution
// ============================================================================

export async function executeModule(
  module: { meta: ModuleMeta; run: (mission: MissionManifest, ui: UI, args?: string[]) => Promise<ModuleResult> },
  mission: MissionManifest,
  cwdAbsolute: string,
  args?: string[],
  ui?: UI
): Promise<ModuleResult> {
  const moduleUI = ui || UI.ctx();

  // Execute the module
  const result = await module.run(mission, moduleUI, args);

  // Process newAssets if any
  if (result.newAssets && result.newAssets.length > 0) {
    // Deduplicate against existing assets
    const allExisting = [
      ...mission.assets.ips,
      ...mission.assets.domains
    ];

    const { unique, duplicates } = dedupeAssets(allExisting, result.newAssets);

    // Log duplicates if any
    if (duplicates.length > 0 && ui) {
      ui.warn(`Skipped ${duplicates.length} duplicate assets`);
    }

    // Add unique assets to appropriate arrays
    for (const asset of unique) {
      const timestamp = getCurrentTimestamp();

      switch (asset.type) {
        case "ip": {
          const ipAsset: IPAsset = {
            value: String(asset.value),
            status: "discovered",
            deviceType: "unknown",
            ports: [],
            parent: asset.parent,
            discoveredBy: module.meta.name,
            discoveredAt: timestamp
          };
          mission.assets.ips.push(ipAsset);
          break;
        }
        case "domain": {
          const domainAsset: DomainAsset = {
            value: String(asset.value),
            source: module.meta.name as "seed" | "subfinder" | "lynx" | "dns",
            parent: asset.parent,
            discoveredAt: timestamp
          };
          mission.assets.domains.push(domainAsset);
          break;
        }
        case "email":
          mission.assets.emails.push(String(asset.value));
          break;
        case "credential":
          if (typeof asset.value === "object" && asset.value !== null) {
            const cred = asset.value as { user: string; pass: string };
            mission.assets.credentials.push({
              user: cred.user,
              pass: cred.pass,
              source: module.meta.name
            });
          }
          break;
        case "hash":
          mission.assets.hashes.push(String(asset.value));
          break;
        case "session":
          if (typeof asset.value === "object" && asset.value !== null) {
            const sess = asset.value as { type: "jwt" | "cookie" | "token" | "api_key"; value: string; target: string; decoded?: unknown };
            mission.assets.sessions.push({
              type: sess.type,
              value: sess.value,
              source: module.meta.name,
              target: sess.target,
              extractedAt: timestamp,
              decoded: sess.decoded
            });
          }
          break;
      }
    }
  }

  // Log history entry
  const historyEntry: HistoryEntry = {
    timestamp: getCurrentTimestamp(),
    module: module.meta.name,
    target: args && args.length > 0 ? args[0] : undefined,
    action: "execute",
    result: result.success ? "success" : (result.newAssets && result.newAssets.length > 0 ? "partial" : "failure"),
    data: result.data
  };
  mission.history.push(historyEntry);

  // Save manifest (only runner writes to manifest)
  await saveManifest(mission, cwdAbsolute);

  return result;
}
