// @ts-nocheck
// ============================================================================
// SECTION 1: Imports
// ============================================================================
import { UI, COLOR_PALETTE } from "../../lib/ui";
import { MissionManifest, ModuleResult } from "../../lib/types";
import { ensurePythonScript, runPythonScript } from "../../lib/python";

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
  return mission.assets.ips
    .filter(ip => ip.status === "discovered")
    .map(ip => ip.value);
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
    ui.section("NET TREE DISCOVERY");
    ui.print("Target", target, { label: COLOR_PALETTE.white, value: COLOR_PALETTE.pink });

    // Ensure script is available
    const scriptPath = await ensurePythonScript("net_tree.py", "./python", ui);
    if (!scriptPath) {
      ui.error("Failed to download net_tree.py from HackDB");
      continue;
    }

    // Run net_tree.py
    ui.info("Launching net_tree — visualizing network topology...");
    ui.divider();

    const result = await runPythonScript(scriptPath, [target], ui);
    if (!result.success) {
      ui.warn(`net_tree execution warning: ${result.error}`);
    }

    ui.divider();
    ui.info("Network tree displayed above.");
    ui.info("Enter discovered IPs (comma-separated), or 'skip' to continue.");
    println([{ text: "  Example: 198.218.200.65, 165.67.183.7", color: COLOR_PALETTE.gray }]);

    // Prompt for discovered IPs
    const input = await prompt("IPs: ");
    if (!input || input.toLowerCase() === "skip" || input.toLowerCase() === "q") {
      ui.warn("No IPs entered — skipping.");
      topologyResults.push({ target, output: "no manual input" });
      continue;
    }

    // Parse and validate IPs
    const rawIPs = input.split(",").map((s) => s.trim()).filter((s) => s.length > 0);
    const validIPs: string[] = [];

    for (const raw of rawIPs) {
      if (Networking.IsIp(raw)) {
        if (!validIPs.includes(raw)) validIPs.push(raw);
      } else {
        ui.warn(`Skipping invalid IP: ${raw}`);
      }
    }

    if (!validIPs.length) {
      ui.warn("No valid IPs entered.");
      topologyResults.push({ target, output: "no valid IPs" });
      continue;
    }

    // Enrich each IP with subnet data
    ui.info(`Enriching ${validIPs.length} IP(s) with subnet data...`);
    ui.divider();

    for (const nodeIP of validIPs) {
      try {
        const subnet = await Networking.GetSubnet(nodeIP);
        if (subnet) {
          allDiscovered.push({ type: "ip", value: subnet.ip, parent: target });
          const type = (subnet as any).type || "UNKNOWN";
          println([{ text: `  ${subnet.ip} (${subnet.lanIp}) — ${type}`, color: COLOR_PALETTE.cyan }]);
        } else {
          allDiscovered.push({ type: "ip", value: nodeIP, parent: target });
          ui.warn(`  ${nodeIP} — GetSubnet returned null`);
        }
      } catch {
        allDiscovered.push({ type: "ip", value: nodeIP, parent: target });
        ui.warn(`  ${nodeIP} — GetSubnet failed`);
      }
    }

    ui.divider();
    ui.success(`Discovered ${validIPs.length} network node(s).`);
    topologyResults.push({ target, output: `discovered: ${validIPs.join(", ")}` });
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
