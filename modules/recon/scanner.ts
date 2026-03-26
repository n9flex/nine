// @ts-nocheck
// ============================================================================
// SECTION 1: Imports
// ============================================================================
import { UI } from "../../lib/ui";
import { MissionManifest, ModuleResult, PortInfo } from "../../lib/types";

// ============================================================================
// SECTION 2: Module Metadata
// ============================================================================
export const meta = {
  name: "scanner",
  command: "scan",
  description: "Port scanning with native Networking API",
  requires: [],
  inputs: ["ip"],
  outputs: ["ports"],
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
    ui.error("No target IP specified and no discovered IPs in mission");
    return { success: false, data: { error: "No target" } };
  }

  const allResults: { target: string; ports: PortInfo[] }[] = [];
  const newAssets: Array<{ type: "ip"; value: string; status: string; ports: PortInfo[]; discoveredBy: string; discoveredAt: string }> = [];

  for (const target of targets) {
    if (!Networking.IsIp(target)) {
      ui.error(`Invalid IP address: ${target}`);
      continue;
    }

    ui.section("SCANNER");
    ui.info(`Target: ${target}`);

    try {
      const subnet = await Networking.GetSubnet(target);
      if (!subnet) {
        ui.error(`No subnet found for ${target}`);
        continue;
      }

      const portNumbers = await subnet.GetPorts();
      ui.info(`Found ${portNumbers.length} ports to check`);

      const ports: PortInfo[] = [];

      for (const port of portNumbers) {
        const [portData, isOpen] = await Promise.all([
          subnet.GetPortData(port),
          subnet.PingPort(port)
        ]);

        if (portData) {
          ports.push({
            port,
            state: isOpen ? "open" : "closed",
            service: portData.service,
            version: portData.version,
            forwarded: portData.external !== portData.internal ? {
              externalPort: portData.external,
              internalPort: portData.internal,
              targetIp: portData.target,
            } : undefined,
          });
        }
      }

      // Update asset in mission or create new one
      const asset = mission.assets.ips.find(ip => ip.value === target);
      if (asset) {
        asset.status = "scanned";
        asset.ports = ports;
      } else {
        // Create new asset for scanned target
        newAssets.push({
          type: "ip",
          value: target,
          status: "scanned",
          ports,
          discoveredBy: "scanner",
          discoveredAt: new Date().toISOString(),
        });
      }

      const openPorts = ports.filter(p => p.state === "open");
      ui.success(`Found ${openPorts.length} open ports on ${target}`);

      allResults.push({ target, ports });
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      ui.error(`Scan failed for ${target}: ${error}`);
    }
  }

  return {
    success: allResults.length > 0,
    data: {
      scanned: allResults,
      scannedAt: new Date().toISOString(),
    },
    newAssets,
  };
}

// ============================================================================
// SECTION 5: Default Export
// ============================================================================
export default { meta, run };
