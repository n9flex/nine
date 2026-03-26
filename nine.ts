// @ts-nocheck
// ============================================================================
// SECTION: Imports
// ============================================================================

import { UI, COLOR_PALETTE } from "./lib/ui";
import { MissionManifest, ModuleResult } from "./lib/types";
import { createManifest, loadManifest } from "./core/mission";
import { getCurrentMission, setCurrentMission, clearCurrentMission } from "./core/session";
import { executeModule } from "./core/runner";

// ============================================================================
// SECTION: Module Imports (Reconnaissance Modules - M2)
// ============================================================================

import * as scanner from "./modules/recon/scanner";
import * as nettree from "./modules/recon/nettree";
import * as geoip from "./modules/recon/geoip";
import * as dig from "./modules/recon/dig";

// ============================================================================
// SECTION: Module Registry
// ============================================================================

const MODULES: Record<string, { module: typeof scanner; aliases: string[] }> = {
  scan: { module: scanner, aliases: ["-s", "--scan"] },
  nettree: { module: nettree, aliases: ["-n", "--nettree"] },
  geoip: { module: geoip, aliases: ["-g", "--geoip"] },
  dig: { module: dig, aliases: ["-d", "--dig"] }
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
  println([{ text: "─".repeat(60), color: COLOR_PALETTE.gray }]);
  ui.print("Usage", "nine <command> [args...]");
  ui.divider();
  ui.print("Mission Commands", "");
  ui.print("  create", "Create new mission with optional seeds");
  ui.print("  attach", "Attach to existing or new mission");
  ui.print("  detach", "Detach from current mission");
  ui.print("  status", "Show current mission status");
  ui.divider();
  ui.print("Module Commands", "");
  ui.print("  scan", "Port scanning on targets");
  ui.print("  nettree", "Network discovery");
  ui.print("  geoip", "Geolocation lookup");
  ui.print("  dig", "DNS lookup");
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