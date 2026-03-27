// @ts-nocheck
// ============================================================================
// SECTION 1: Imports
// ============================================================================
import { UI, COLOR_PALETTE } from "../../lib/ui";
import { MissionManifest, ModuleResult, NewAsset } from "../../lib/types";

// ============================================================================
// SECTION 2: Module Metadata
// ============================================================================
export const meta = {
  name: "dig",
  command: "dig",
  description: "Device identification and network reconnaissance via IP probing",
  requires: [],
  inputs: ["ip"],
  outputs: ["ips", "device_info", "config"],
};

// ============================================================================
// SECTION 3: Types and Interfaces
// ============================================================================

interface DigResult {
  ip: string;
  lanIp?: string;
  deviceType?: "router" | "device" | "firewall" | string;
  essid?: string;
  config: Record<string, string | boolean | number>;
}

// ============================================================================
// SECTION 4: Helper Functions
// ============================================================================

/**
 * Resolves target IPs from args or mission assets
 */
function resolveTargets(mission: MissionManifest, args?: string[]): string[] {
  if (args && args.length > 0) {
    return args;
  }
  // Default: use mission assets with "discovered" status
  return mission.assets.ips
    .filter(ip => ip.status === "discovered")
    .map(ip => ip.value);
}

/**
 * Parses boolean-like string values
 */
function parseConfigValue(value: string): string | boolean | number {
  const trimmed = value.trim().toLowerCase();
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  if (/^\d+$/.test(trimmed)) return parseInt(trimmed, 10);
  if (/^\d+\.\d+$/.test(trimmed)) return parseFloat(trimmed);
  return value.trim();
}

/**
 * Parses dig command output into structured data
 */
function parseDigOutput(output: string, targetIp: string): DigResult | null {
  const lines = output.trim().split("\n").map(l => l.trim()).filter(l => l);
  
  const result: DigResult = {
    ip: targetIp,
    config: {},
  };

  let inConfig = false;

  for (const line of lines) {
    if (!line || line === "Dig results:") continue;

    if (line.startsWith("IP:")) {
      result.ip = line.replace("IP:", "").trim();
      inConfig = false;
    } else if (line.startsWith("LAN IP:")) {
      const lanIp = line.replace("LAN IP:", "").trim();
      if (lanIp && lanIp !== "undefined") {
        result.lanIp = lanIp;
      }
      inConfig = false;
    } else if (line.startsWith("Type:")) {
      const type = line.replace("Type:", "").trim();
      if (type && type !== "undefined") {
        result.deviceType = type.toLowerCase();
      }
      inConfig = false;
    } else if (line.startsWith("ESSID:")) {
      const essid = line.replace("ESSID:", "").trim();
      if (essid && essid !== "undefined") {
        result.essid = essid;
      }
      inConfig = false;
    } else if (line.startsWith("Config:")) {
      inConfig = true;
    } else if (inConfig && line.includes(":")) {
      const colonIndex = line.indexOf(":");
      const key = line.substring(0, colonIndex).trim();
      const value = line.substring(colonIndex + 1).trim();
      if (key) {
        result.config[key] = parseConfigValue(value);
      }
    }
  }

  return result.ip ? result : null;
}

/**
 * Executes dig command and parses output
 */
async function performDigLookup(target: string): Promise<DigResult | null> {
  const tempFile = ".dig_output.txt";

  try {
    await Shell.Process.exec(`dig ${target} > ${tempFile}`);
    const output = await FileSystem.ReadFile(tempFile, { absolute: false });

    try {
      await FileSystem.Remove(tempFile, { absolute: false });
    } catch {
      // Ignore cleanup errors
    }

    return parseDigOutput(output, target);
  } catch {
    try {
      await FileSystem.Remove(tempFile, { absolute: false });
    } catch {
      // Ignore cleanup errors
    }
    return null;
  }
}

/**
 * Determines color for device type display
 */
function getDeviceTypeColor(deviceType?: string): string {
  switch (deviceType?.toLowerCase()) {
    case "router":
      return COLOR_PALETTE.purple; // Internal IP/network device
    case "firewall":
      return COLOR_PALETTE.orange;
    case "device":
      return COLOR_PALETTE.cyan;
    default:
      return COLOR_PALETTE.gray;
  }
}

/**
 * Determines color for security level
 */
function getSecurityLevelColor(config: Record<string, unknown>): string {
  const level = config["security-level"];
  if (level === "low") return COLOR_PALETTE.red;
  if (level === "medium") return COLOR_PALETTE.orange;
  if (level === "high") return COLOR_PALETTE.green;
  return COLOR_PALETTE.gray;
}

// ============================================================================
// SECTION 5: Core Logic
// ============================================================================

export async function run(
  mission: MissionManifest,
  ui: UI,
  args?: string[]
): Promise<ModuleResult> {
  const targets = resolveTargets(mission, args);

  if (targets.length === 0) {
    ui.error("No target IP specified and no discovered IPs in mission");
    return { success: false, data: { error: "No target" } };
  }

  const allResults: DigResult[] = [];
  const newAssets: NewAsset[] = [];

  for (const target of targets) {
    if (!Networking.IsIp(target)) {
      ui.error(`Invalid IP address: ${target}`);
      continue;
    }

    ui.section("DIG");
    ui.print("Target", target, { label: COLOR_PALETTE.white, value: COLOR_PALETTE.pink });

    try {
      const result = await performDigLookup(target);

      if (!result) {
        ui.error(`Dig failed for ${target} - no response`);
        continue;
      }

      ui.divider();
      ui.print("IP", result.ip, { label: COLOR_PALETTE.gray, value: COLOR_PALETTE.pink });
      
      if (result.lanIp) {
        ui.print("LAN IP", result.lanIp, { label: COLOR_PALETTE.gray, value: COLOR_PALETTE.purple });
      }
      
      if (result.deviceType) {
        ui.print("Type", result.deviceType.toUpperCase(), { 
          label: COLOR_PALETTE.gray, 
          value: getDeviceTypeColor(result.deviceType)
        });
      }
      
      if (result.essid) {
        ui.print("ESSID", result.essid, { label: COLOR_PALETTE.gray, value: COLOR_PALETTE.cyan });
      }

      const configEntries = Object.entries(result.config);
      if (configEntries.length > 0) {
        ui.divider();
        ui.print("Configuration", "", { label: COLOR_PALETTE.gray });
        
        const configRows = configEntries.map(([key, value]) => ({
          Key: key,
          Value: String(value),
        }));
        
        ui.table(["Key", "Value"], configRows, {
          rowColor: (row) => row.Key === "security-level" 
            ? getSecurityLevelColor(result.config) 
            : COLOR_PALETTE.white,
        });
      }

      // Update existing asset or prepare new one
      const existingAsset = mission.assets.ips.find(ip => ip.value === target);
      if (existingAsset) {
        existingAsset.deviceType = (result.deviceType as IPAsset["deviceType"]) || "unknown";
        existingAsset.lanIp = result.lanIp;
        existingAsset.essid = result.essid;
        existingAsset.config = result.config;
        ui.success(`Enriched asset: ${target}`);
      } else {
        newAssets.push({
          type: "ip",
          value: target,
          deviceType: (result.deviceType as NewAsset["deviceType"]) || "unknown",
          lanIp: result.lanIp,
          essid: result.essid,
          config: result.config,
        });
        ui.success(`Discovered: ${target} (${result.deviceType || "unknown"})`);
      }

      // Add LAN IP as new internal target if different
      if (result.lanIp && result.lanIp !== target) {
        const lanExists = mission.assets.ips.some(ip => ip.value === result.lanIp);
        if (!lanExists) {
          newAssets.push({
            type: "ip",
            value: result.lanIp,
            parent: target,
            deviceType: "unknown",
          });
          ui.info(`Internal IP discovered: ${result.lanIp}`);
        }
      }

      allResults.push(result);
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      ui.error(`Dig failed for ${target}: ${error}`);
    }
  }

  if (allResults.length > 0) {
    ui.divider();
    const routers = allResults.filter(r => r.deviceType === "router").length;
    const devices = allResults.filter(r => r.deviceType === "device").length;
    const withConfig = allResults.filter(r => Object.keys(r.config).length > 0).length;
    
    ui.info(`Summary: ${allResults.length} probed, ${routers} routers, ${devices} devices, ${withConfig} with config`);
  }

  return {
    success: allResults.length > 0,
    data: {
      probed: allResults,
      discovered: newAssets.length,
      timestamp: new Date().toISOString(),
    },
    newAssets,
  };
}

// ============================================================================
// SECTION 6: Default Export
// ============================================================================
export default { meta, run };
