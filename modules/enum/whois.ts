// @ts-nocheck
// ============================================================================
// SECTION 1: Imports
// ============================================================================

import { UI, COLOR_PALETTE } from "../../lib/ui";
import { MissionManifest, ModuleResult, NewAsset, DomainAsset } from "../../lib/types";

// ============================================================================
// SECTION 2: Constants
// ============================================================================

const TMP_FILE = "./tmp/whois_output.txt";

// ============================================================================
// SECTION 3: Module Metadata
// ============================================================================

export const meta = {
  name: "whois",
  command: "whois",
  description: "Domain WHOIS lookup - registrar, dates, contacts",
  requires: [],
  inputs: ["domain"],
  outputs: ["whois_info"],
};

// ============================================================================
// SECTION 4: Types
// ============================================================================

interface WhoisInfo {
  domain: string;
  status?: string;
  registrar?: string;
  creationDate?: string;
  expirationDate?: string;
  nameServers: string[];
  registrant?: string;
  registrantEmail?: string;
  adminContact?: string;
  adminEmail?: string;
  techContact?: string;
  techEmail?: string;
  raw: string;
}

// ============================================================================
// SECTION 5: Core Logic (run function)
// ============================================================================

export async function run(
  mission: MissionManifest,
  ui: UI,
  args?: string[]
): Promise<ModuleResult> {
  const targets = resolveTargets(mission, args);

  if (targets.length === 0) {
    ui.error("No target domain specified and no domains in mission");
    return { success: false, data: { error: "No target" } };
  }

  const results: WhoisInfo[] = [];
  const newAssets: NewAsset[] = [];

  for (const target of targets) {
    ui.section("WHOIS Lookup");
    ui.print("Target", target, { label: COLOR_PALETTE.white, value: COLOR_PALETTE.pink });

    try {
      const result = await performWhoisLookup(target, ui);

      if (!result) {
        ui.error(`WHOIS lookup failed for ${target}`);
        continue;
      }

      displayWhoisResult(ui, result);

      // Enrich existing domain asset or prepare new one
      const existingAsset = mission.assets.domains.find(d => d.value === target);
      if (existingAsset) {
        existingAsset.whois = result;
        existingAsset.source = "whois";
        ui.success(`Enriched domain: ${target}`);
      } else {
        newAssets.push({
          type: "domain",
          value: target,
          source: "whois",
          whois: result,
        });
        ui.success(`Discovered domain: ${target}`);
      }

      results.push(result);
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      ui.error(`WHOIS failed for ${target}: ${error}`);
    }
  }

  if (results.length > 0) {
    ui.divider();
    ui.info(`Summary: ${results.length} domain(s) queried`);
  }

  return {
    success: results.length > 0,
    data: {
      queried: results.length,
      domains: results.map(r => r.domain),
      timestamp: new Date().toISOString(),
    },
    newAssets,
  };
}

// ============================================================================
// SECTION 6: Helper Functions
// ============================================================================

function resolveTargets(mission: MissionManifest, args?: string[]): string[] {
  if (args && args.length > 0) {
    return args;
  }
  // Default: use mission domains
  return mission.assets.domains.map(d => d.value);
}

async function performWhoisLookup(domain: string, ui: UI): Promise<WhoisInfo | null> {
  // Ensure tmp directory exists
  try {
    await FileSystem.Mkdir("./tmp", { absolute: false });
  } catch {
    // Directory might already exist
  }

  try {
    ui.info(`Executing: whois ${domain}`);
    await Shell.Process.exec(`whois ${domain} > ${TMP_FILE}`);
    const output = await FileSystem.ReadFile(TMP_FILE, { absolute: false });

    // Cleanup temp file
    try {
      await FileSystem.Remove(TMP_FILE, { absolute: false });
    } catch {
      // Ignore cleanup errors
    }

    return parseWhoisOutput(output, domain);
  } catch {
    // Cleanup on error
    try {
      await FileSystem.Remove(TMP_FILE, { absolute: false });
    } catch {
      // Ignore cleanup errors
    }
    return null;
  }
}

function parseWhoisOutput(output: string, domain: string): WhoisInfo | null {
  const lines = output.split("\n");
  
  const result: WhoisInfo = {
    domain,
    nameServers: [],
    raw: output,
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("%") || trimmed.startsWith("#")) continue;

    // Split on first colon
    const colonIdx = trimmed.indexOf(":");
    if (colonIdx === -1) continue;

    const key = trimmed.substring(0, colonIdx).trim().toLowerCase();
    const value = trimmed.substring(colonIdx + 1).trim();

    if (!value) continue;

    // Map fields
    if (key === "domain name") {
      result.domain = value;
    } else if (key === "status") {
      result.status = value;
    } else if (key === "registrar" || key === "registrar name") {
      result.registrar = value;
    } else if (key === "contact name") {
      result.registrant = value;
    } else if (key === "contact mail" || key === "contact email") {
      result.registrantEmail = value;
    } else if (key === "name server" || key === "nameserver") {
      if (!result.nameServers.includes(value)) {
        result.nameServers.push(value);
      }
    } else if (key === "creation date" || key === "created") {
      result.creationDate = value;
    } else if (key === "expiration date" || key === "expires" || key === "registry expiry date") {
      result.expirationDate = value;
    }
  }

  return result;
}

function displayWhoisResult(ui: UI, result: WhoisInfo): void {
  ui.divider();

  if (result.status) {
    const statusColor = result.status.toLowerCase() === "active" ? COLOR_PALETTE.green : COLOR_PALETTE.orange;
    ui.print("Status", result.status, { 
      label: COLOR_PALETTE.gray, 
      value: statusColor 
    });
  }

  if (result.registrar) {
    ui.print("Registrar", result.registrar, { 
      label: COLOR_PALETTE.gray, 
      value: COLOR_PALETTE.cyan 
    });
  }

  if (result.creationDate) {
    ui.print("Created", result.creationDate, { 
      label: COLOR_PALETTE.gray, 
      value: COLOR_PALETTE.white 
    });
  }

  if (result.expirationDate) {
    ui.print("Expires", result.expirationDate, { 
      label: COLOR_PALETTE.gray, 
      value: COLOR_PALETTE.white 
    });
  }

  if (result.nameServers.length > 0) {
    ui.divider();
    ui.print("Name Servers", "", { label: COLOR_PALETTE.gray });
    const nsRows = result.nameServers.map(ns => ({ Server: ns }));
    ui.table(["Server"], nsRows, {
      rowColor: () => COLOR_PALETTE.purple,
    });
  }

  if (result.registrant || result.registrantEmail || result.adminContact || result.techContact) {
    ui.divider();
    ui.print("Contacts", "", { label: COLOR_PALETTE.gray });
    
    const contacts: Array<{ Type: string; Value: string }> = [];
    if (result.registrant) contacts.push({ Type: "Registrant", Value: result.registrant });
    if (result.registrantEmail) contacts.push({ Type: "Email", Value: result.registrantEmail });
    if (result.adminContact) contacts.push({ Type: "Admin", Value: result.adminContact });
    if (result.adminEmail) contacts.push({ Type: "Admin Email", Value: result.adminEmail });
    if (result.techContact) contacts.push({ Type: "Tech", Value: result.techContact });
    if (result.techEmail) contacts.push({ Type: "Tech Email", Value: result.techEmail });
    
    if (contacts.length > 0) {
      ui.table(["Type", "Value"], contacts, {
        rowColor: () => COLOR_PALETTE.white,
      });
    }
  }
}

// ============================================================================
// SECTION 7: Default Export
// ============================================================================

export default { meta, run };
