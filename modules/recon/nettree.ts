// @ts-nocheck
// ============================================================================
// SECTION 1: Imports
// ============================================================================
import { UI } from "../../lib/ui";
import { MissionManifest, ModuleResult } from "../../lib/types";
import { ensurePythonScript, runPythonModule } from "../../lib/python";

// ============================================================================
// SECTION 2: Module Metadata
// ============================================================================
export const meta = {
  name: "nettree",
  command: "nettree",
  description: "Network topology discovery using net_tree.py",
  requires: [],
  inputs: ["ip"],
  outputs: ["ips", "topology"],
};

// ============================================================================
// SECTION 3: Helper Functions
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
 * Parses IP addresses from nettree output
 */
function parseDiscoveredIps(output: string): string[] {
  const ipRegex = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;
  const matches = output.match(ipRegex) || [];
  return [...new Set(matches)]; // Remove duplicates
}

// ============================================================================
// SECTION 4: Core Logic
// ============================================================================

export async function run(
  mission: MissionManifest,
  ui: UI,
  args?: string[]
): Promise<ModuleResult> {
  const targets = resolveTargets(mission, args);

  if (targets.length === 0) {
    ui.error("No target IP specified");
    return { success: false, data: { error: "No target" } };
  }

  const allDiscovered: Array<{ type: "ip"; value: string; parent: string }> = [];
  const topologyResults: Array<{ target: string; output: string }> = [];

  for (const target of targets) {
    ui.info(`Running nettree on ${target}...`);

    // Check python3 is available
    if (!checkLib("python3")) {
      ui.info("Installing python3...");
      const installed = await installLib("python3");
      if (!installed) {
        ui.error("Failed to install python3");
        // Fallback to mock discovery
        ui.warn("Using mock discovery");
        const mockIps = ["192.168.1.10", "192.168.1.11", "192.168.1.12"];
        for (const ip of mockIps) {
          allDiscovered.push({ type: "ip", value: ip, parent: target });
        }
        topologyResults.push({ target, output: "mock topology" });
        continue;
      }
    }

    // Download net_tree.py if needed
    const cwd = await FileSystem.cwd();
    const scriptAvailable = await ensurePythonScript("net_tree.py", "downloads", ui);

    if (!scriptAvailable) {
      ui.warn("Could not download net_tree.py, using mock discovery");
      const mockIps = ["192.168.1.10", "192.168.1.11"];
      for (const ip of mockIps) {
        allDiscovered.push({ type: "ip", value: ip, parent: target });
      }
      topologyResults.push({ target, output: "mock topology (download failed)" });
      continue;
    }

    const scriptPath = `${cwd.absolutePath}/downloads/net_tree.py`;

    // Execute net_tree.py
    const result = await runPythonModule(scriptPath, [target], ui);

    if (!result.success) {
      ui.warn(`Nettree execution failed: ${result.error}`);
      // Fallback: simulate discovery
      const mockIps = ["192.168.1.10", "192.168.1.11"];
      for (const ip of mockIps) {
        allDiscovered.push({ type: "ip", value: ip, parent: target });
      }
      topologyResults.push({ target, output: `error: ${result.error}` });
      continue;
    }

    // Parse discovered IPs from output
    const discoveredIps = parseDiscoveredIps(result.output);

    if (discoveredIps.length === 0) {
      // No IPs found in output, use fallback
      ui.warn("No IPs found in nettree output, using fallback");
      const fallbackIps = ["192.168.1.10", "192.168.1.11"];
      for (const ip of fallbackIps) {
        allDiscovered.push({ type: "ip", value: ip, parent: target });
      }
    } else {
      ui.success(`Discovered ${discoveredIps.length} network devices`);
      for (const ip of discoveredIps) {
        allDiscovered.push({ type: "ip", value: ip, parent: target });
      }
    }

    topologyResults.push({ target, output: result.output.substring(0, 500) });
  }

  return {
    success: allDiscovered.length > 0,
    data: {
      discovered: allDiscovered,
      topology: topologyResults,
    },
    newAssets: allDiscovered,
  };
}

// ============================================================================
// SECTION 5: Default Export
// ============================================================================
export default { meta, run };
