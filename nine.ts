// @ts-nocheck
// ============================================================================
// SECTION: Imports
// ============================================================================

import { UI, COLOR_PALETTE } from "./lib/ui";
import { MissionManifest, ModuleResult } from "./lib/types";
import { createManifest, loadManifest } from "./core/mission";
import { getCurrentMission, setCurrentMission, clearCurrentMission } from "./core/session";
import { executeModule } from "./core/runner";
import { listDir } from "./lib/storage";

// ============================================================================
// SECTION: Constants
// ============================================================================

const VERSION = "0.3.1";

// ============================================================================
// SECTION: Module Imports (Reconnaissance Modules - M2)
// ============================================================================

import * as scanner from "./modules/recon/scanner";
import * as nettree from "./modules/recon/nettree";
import * as geoip from "./modules/recon/geoip";
import * as dig from "./modules/recon/dig";
import * as nslookup from "./modules/recon/nslookup";
import * as mxlookup from "./modules/recon/mxlookup";
import * as lynx from "./modules/recon/lynx";

// ============================================================================
// SECTION: Module Imports (Enumeration Modules - M3)
// ============================================================================

import * as subfinder from "./modules/enum/subfinder";
import * as pyUserEnum from "./modules/enum/pyUserEnum";
import * as dirhunter from "./modules/enum/dirhunter";

// ============================================================================
// SECTION: Module Registry
// ============================================================================

const MODULES: Record<string, { module: typeof scanner; aliases: string[] }> = {
  scan: { module: scanner, aliases: ["-s", "--scan"] },
  nettree: { module: nettree, aliases: ["-n", "--nettree"] },
  geoip: { module: geoip, aliases: ["-g", "--geoip"] },
  dig: { module: dig, aliases: ["-d", "--dig"] },
  nslookup: { module: nslookup, aliases: ["--nslookup"] },
  mxlookup: { module: mxlookup, aliases: ["--mxlookup"] },
  subfinder: { module: subfinder, aliases: ["--subfinder"] },
  lynx: { module: lynx, aliases: ["--lynx"] },
  pyuserenum: { module: pyUserEnum, aliases: ["--pyuserenum"] },
  dirhunter: { module: dirhunter, aliases: ["--dirhunter"] }
};

// ============================================================================
// SECTION: CLI Dispatcher
// ============================================================================

export async function main(args?: string[], scriptLocation?: string): Promise<void> {
  const ui = UI.ctx();
  
  // Set working directory if called from wrapper
  if (scriptLocation) {
    await FileSystem.SetPath(scriptLocation, { absolute: true });
  }
  
  const effectiveArgs = args || Shell.GetArgs();
  const command = effectiveArgs[0];

  // Get cwd for absolute paths
  const cwd = await FileSystem.cwd();
  const cwdAbsolute = cwd.absolutePath;

  if (!command) {
    showHelp(ui);
    return;
  }

  switch (command) {
    case "create":
      await handleCreate(effectiveArgs.slice(1), cwdAbsolute, ui);
      break;
    case "attach":
      await handleAttach(effectiveArgs.slice(1), cwdAbsolute, ui);
      break;
    case "detach":
      await handleDetach(cwdAbsolute, ui);
      break;
    case "status":
      await handleStatus(cwdAbsolute, ui);
      break;
    case "assets":
      await handleAssets(cwdAbsolute, ui);
      break;
    case "history":
      await handleHistory(cwdAbsolute, ui);
      break;
    case "show":
      await handleShow(cwdAbsolute, ui);
      break;
    case "list":
      await handleList(cwdAbsolute, ui);
      break;
    case "scan":
    case "-s":
    case "--scan":
      await handleModule("scan", effectiveArgs.slice(1), cwdAbsolute, ui);
      break;
    case "nettree":
    case "-n":
    case "--nettree":
      await handleModule("nettree", effectiveArgs.slice(1), cwdAbsolute, ui);
      break;
    case "geoip":
    case "-g":
    case "--geoip":
      await handleModule("geoip", effectiveArgs.slice(1), cwdAbsolute, ui);
      break;
    case "dig":
    case "-d":
    case "--dig":
      await handleModule("dig", effectiveArgs.slice(1), cwdAbsolute, ui);
      break;
    case "nslookup":
    case "--nslookup":
      await handleModule("nslookup", effectiveArgs.slice(1), cwdAbsolute, ui);
      break;
    case "mxlookup":
    case "--mxlookup":
      await handleModule("mxlookup", effectiveArgs.slice(1), cwdAbsolute, ui);
      break;
    case "subfinder":
    case "--subfinder":
      await handleModule("subfinder", effectiveArgs.slice(1), cwdAbsolute, ui);
      break;
    case "lynx":
    case "--lynx":
      await handleModule("lynx", effectiveArgs.slice(1), cwdAbsolute, ui);
      break;
    case "pyuserenum":
    case "--pyuserenum":
      await handleModule("pyuserenum", effectiveArgs.slice(1), cwdAbsolute, ui);
      break;
    case "dirhunter":
    case "--dirhunter":
      await handleModule("dirhunter", effectiveArgs.slice(1), cwdAbsolute, ui);
      break;
    case "help":
    case "-h":
    case "--help":
      showHelp(ui);
      break;
    default:
      ui.error(`Unknown command: ${command}`);
      showHelp(ui);
  }
}

// ============================================================================
// SECTION: Command Handlers
// ============================================================================

async function handleCreate(args: string[], cwdAbsolute: string, ui: UI): Promise<void> {
  if (args.length === 0) {
    ui.error("Usage: nine create <mission> [seeds...]");
    return;
  }

  const missionName = args[0];
  const seeds = args.slice(1);

  try {
    const manifest = await createManifest(missionName, seeds, cwdAbsolute);
    ui.success(`Created mission: ${manifest.name}`);
    ui.info(`Seeds: ${seeds.length > 0 ? seeds.join(", ") : "none"}`);

    // Auto-attach to new mission
    await setCurrentMission(missionName, cwdAbsolute);
    ui.success(`Attached to mission: ${missionName}`);
  } catch (err) {
    ui.error(`Failed to create mission: ${err}`);
  }
}

async function handleAttach(args: string[], cwdAbsolute: string, ui: UI): Promise<void> {
  if (args.length === 0) {
    ui.error("Usage: nine attach <mission>");
    return;
  }

  const missionName = args[0];

  try {
    // Check if mission exists
    const manifest = await loadManifest(missionName, cwdAbsolute);
    if (!manifest) {
      // Create if doesn't exist
      await createManifest(missionName, [], cwdAbsolute);
      ui.info(`Created new mission: ${missionName}`);
    }

    await setCurrentMission(missionName, cwdAbsolute);
    ui.success(`Attached to mission: ${missionName}`);
  } catch (err) {
    ui.error(`Failed to attach: ${err}`);
  }
}

async function handleDetach(cwdAbsolute: string, ui: UI): Promise<void> {
  try {
    const session = await getCurrentMission(cwdAbsolute);
    if (session) {
      await clearCurrentMission(cwdAbsolute);
      ui.success(`Detached from mission: ${session.mission}`);
    } else {
      ui.warn("No mission currently attached");
    }
  } catch (err) {
    ui.error(`Failed to detach: ${err}`);
  }
}

async function handleStatus(cwdAbsolute: string, ui: UI): Promise<void> {
  try {
    const session = await getCurrentMission(cwdAbsolute);
    if (!session) {
      ui.warn("No mission attached");
      ui.info("Run: nine attach <mission>");
      return;
    }

    const manifest = await loadManifest(session.mission, cwdAbsolute);
    if (!manifest) {
      ui.error(`Mission not found: ${session.mission}`);
      return;
    }

    ui.section("Mission Status");
    ui.print("Mission", manifest.name);
    ui.print("Attached", new Date(session.attachedAt).toLocaleString());
    ui.print("Created", new Date(manifest.created).toLocaleString());
    ui.divider();
    ui.print("Seeds", String(manifest.seeds.length));
    ui.print("IPs", String(manifest.assets.ips.length));
    ui.print("Domains", String(manifest.assets.domains.length));
    ui.print("Credentials", String(manifest.assets.credentials.length));
    ui.print("History entries", String(manifest.history.length));
  } catch (err) {
    ui.error(`Failed to get status: ${err}`);
  }
}

async function handleAssets(cwdAbsolute: string, ui: UI): Promise<void> {
  try {
    const session = await getCurrentMission(cwdAbsolute);
    if (!session) {
      ui.warn("No mission attached");
      ui.info("Run: nine attach <mission>");
      return;
    }

    const manifest = await loadManifest(session.mission, cwdAbsolute);
    if (!manifest) {
      ui.error(`Mission not found: ${session.mission}`);
      return;
    }

    if (manifest.seeds.length > 0) {
      ui.section("Seeds");
      ui.table(["Type", "Value", "Added"], manifest.seeds.map(s => ({
        Type: s.type,
        Value: s.value,
        Added: new Date(s.addedAt).toLocaleDateString()
      })));
    }

    if (manifest.assets.ips.length > 0) {
      ui.section("IP Addresses");
      ui.table(["IP", "Status", "Discovered By"], manifest.assets.ips.map(ip => ({
        IP: ip.value,
        Status: ip.status,
        "Discovered By": ip.discoveredBy
      })));

      // Show detailed port information for scanned IPs
      const scannedIps = manifest.assets.ips.filter(ip => ip.ports.length > 0);
      if (scannedIps.length > 0) {
        ui.section("PORTS DETAILS");
        for (const ip of scannedIps) {
          const openPorts = ip.ports.filter(p => p.state === "open");
          if (openPorts.length > 0) {
            ui.print(`${ip.value}`, "", { label: COLOR_PALETTE.white });
            const portRows = openPorts.map(p => ({
              Port: p.port,
              State: p.state.toUpperCase(),
              Service: p.service || "unknown",
              Version: p.version || "unknown",
              Target: p.target || "N/A"
            }));
            ui.table(["Port", "State", "Service", "Version", "Target"], portRows);
          }
        }
      }
    }

    if (manifest.assets.domains.length > 0) {
      ui.section("Domains");
      ui.table(["Domain", "Source", "Parent"], manifest.assets.domains.map(d => ({
        Domain: d.value,
        Source: d.source,
        Parent: d.parent || "-"
      })));
    }

    if (manifest.assets.credentials.length > 0) {
      ui.section("Credentials");
      ui.table(["User", "Password", "Source"], manifest.assets.credentials.map(c => ({
        User: c.user,
        Password: "***",
        Source: c.source
      })));
    }

    if (manifest.assets.ips.length === 0 && manifest.assets.domains.length === 0 && 
        manifest.assets.credentials.length === 0 && manifest.seeds.length === 0) {
      ui.info("No assets discovered yet");
    }
  } catch (err) {
    ui.error(`Failed to get assets: ${err}`);
  }
}

async function handleHistory(cwdAbsolute: string, ui: UI): Promise<void> {
  try {
    const session = await getCurrentMission(cwdAbsolute);
    if (!session) {
      ui.warn("No mission attached");
      ui.info("Run: nine attach <mission>");
      return;
    }

    const manifest = await loadManifest(session.mission, cwdAbsolute);
    if (!manifest) {
      ui.error(`Mission not found: ${session.mission}`);
      return;
    }

    if (manifest.history.length === 0) {
      ui.info("No history entries");
      return;
    }

    ui.section("Execution History");
    ui.table(["Time", "Module", "Target", "Result", "Action"], 
      manifest.history.slice(-20).map(h => ({
        Time: new Date(h.timestamp).toLocaleTimeString(),
        Module: h.module,
        Target: h.target || "-",
        Result: h.result,
        Action: h.action
      }))
    );

    if (manifest.history.length > 20) {
      ui.info(`... and ${manifest.history.length - 20} more entries`);
    }
  } catch (err) {
    ui.error(`Failed to get history: ${err}`);
  }
}

async function handleShow(cwdAbsolute: string, ui: UI): Promise<void> {
  try {
    const session = await getCurrentMission(cwdAbsolute);
    if (!session) {
      ui.warn("No mission attached");
      ui.info("Run: nine attach <mission>");
      return;
    }

    const manifest = await loadManifest(session.mission, cwdAbsolute);
    if (!manifest) {
      ui.error(`Mission not found: ${session.mission}`);
      return;
    }

    ui.section("Mission Overview");
    ui.print("Mission", manifest.name);
    ui.print("Created", new Date(manifest.created).toLocaleString());
    ui.print("Updated", new Date(manifest.updated).toLocaleString());

    ui.section("Summary");
    ui.print("Seeds", String(manifest.seeds.length));
    ui.print("IPs", String(manifest.assets.ips.length));
    ui.print("Domains", String(manifest.assets.domains.length));
    ui.print("Credentials", String(manifest.assets.credentials.length));
    ui.print("History", String(manifest.history.length));

    await handleAssets(cwdAbsolute, ui);
    await handleHistory(cwdAbsolute, ui);
  } catch (err) {
    ui.error(`Failed to show mission: ${err}`);
  }
}

async function handleList(cwdAbsolute: string, ui: UI): Promise<void> {
  try {
    const missionsDir = `${cwdAbsolute}/loot`;
    const entries = await listDir(missionsDir);

    const missions: Array<{ Name: string; Created: string; Assets: number }> = [];

    for (const entry of entries) {
      // Skip hidden files (like .current_mission)
      if (entry.startsWith(".")) {
        continue;
      }

      const manifest = await loadManifest(entry, cwdAbsolute);
      if (manifest) {
        const totalAssets = manifest.assets.ips.length +
                          manifest.assets.domains.length +
                          manifest.assets.credentials.length;
        missions.push({
          Name: manifest.name,
          Created: new Date(manifest.created).toLocaleDateString(),
          Assets: totalAssets
        });
      }
    }

    if (missions.length === 0) {
      ui.info("No missions found");
      ui.info("Run: nine create <mission> to create your first mission");
      return;
    }

    ui.section("Missions");
    ui.table(["Name", "Created", "Assets"], missions);

    // Show current attachment status
    const session = await getCurrentMission(cwdAbsolute);
    ui.divider();
    if (session) {
      ui.print("Currently attached to", session.mission);
    } else {
      ui.info("No mission currently attached");
    }
    ui.divider();
  } catch (err) {
    ui.error(`Failed to list missions: ${err}`);
  }
}

async function handleModule(moduleName: string, args: string[], cwdAbsolute: string, ui: UI): Promise<void> {
  // Check if attached to a mission
  const session = await getCurrentMission(cwdAbsolute);
  if (!session) {
    ui.error("No mission attached. Run: nine attach <mission>");
    return;
  }

  // Load mission manifest
  const mission = await loadManifest(session.mission, cwdAbsolute);
  if (!mission) {
    ui.error(`Mission not found: ${session.mission}`);
    return;
  }

  // Execute module
  const moduleEntry = MODULES[moduleName];
  if (!moduleEntry) {
    ui.error(`Unknown module: ${moduleName}`);
    return;
  }

  try {
    const result = await executeModule(moduleEntry.module, mission, cwdAbsolute, args, ui);
    if (result.success) {
      ui.success(`${moduleName} completed successfully`);
    } else {
      ui.warn(`${moduleName} completed with issues`);
    }
  } catch (err) {
    ui.error(`${moduleName} failed: ${err}`);
  }
}

// ============================================================================
// SECTION: Help Display
// ============================================================================

// ============================================================================
// SECTION: UI Helper for Centering
// ============================================================================

function centerText(text: string, width: number = 60): string {
  const padding = Math.max(0, Math.floor((width - text.length) / 2));
  return " ".repeat(padding) + text;
}

function showHelp(ui: UI): void {
  println([{ text: "─".repeat(60), color: COLOR_PALETTE.gray }]);
  println([{ text: centerText("Nine CLI Toolkit"), color: COLOR_PALETTE.purple }]);
  println([{ text: centerText(`v${VERSION}`), color: COLOR_PALETTE.pink }]);
  println([{ text: "─".repeat(60), color: COLOR_PALETTE.gray }]);
  ui.print("Usage", "nine <command> [args...]");
  ui.divider();
  ui.print("Mission Commands", "");
  ui.print("  list", "List all missions");
  ui.print("  create", "Create new mission with optional seeds");
  ui.print("  attach", "Attach to existing or new mission");
  ui.print("  detach", "Detach from current mission");
  ui.print("  status", "Show current mission status");
  ui.print("  assets", "List all discovered assets");
  ui.print("  history", "Show execution history");
  ui.print("  show", "Full mission details");
  ui.divider();
  ui.print("Module Commands", "");
  ui.print("  scan", "Port scanning on targets");
  ui.print("  nettree", "Network discovery");
  ui.print("  geoip", "Geolocation lookup");
  ui.print("  dig", "DNS lookup");
  ui.print("  nslookup", "NS record lookup");
  ui.print("  mxlookup", "MX record lookup");
  ui.print("  subfinder", "Subdomain enumeration");
  ui.print("  lynx", "OSINT harvest");
  ui.print("  pyuserenum", "User enumeration");
  ui.print("  dirhunter", "Directory bruteforce");
  ui.divider();
  ui.print("Examples", "");
  ui.print("  nine create MyMission 192.168.1.1", "");
  ui.print("  nine attach MyMission", "");
  ui.print("  nine scan", "");
  println([{ text: "─".repeat(60), color: COLOR_PALETTE.gray }]);
}

// ============================================================================
// SECTION: Entry Point
// ============================================================================
// main() is called by the wrapper at /lib/nine.ts