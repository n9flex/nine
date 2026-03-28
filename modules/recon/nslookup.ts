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
  name: "nslookup",
  command: "nslookup",
  description: "NS record lookup for domains",
  requires: [],
  inputs: ["domain"],
  outputs: ["ns_records", "nameservers"],
};

// ============================================================================
// SECTION 3: Core Logic
// ============================================================================
export async function run(
  mission: MissionManifest,
  ui: UI,
  args?: string[]
): Promise<ModuleResult> {
  // Resolve target from args or mission
  const target = resolveDomain(mission, args);

  // Validate target exists
  if (!target) {
    ui.error("No target domain specified and no domain assets in mission");
    return { success: false, data: { error: "No target" } };
  }

  // Validate target is NOT an IP
  if (Networking.IsIp(target)) {
    ui.error(`nslookup requires a domain, not an IP: ${target}`);
    return { success: false, data: { error: "Invalid target type" } };
  }

  ui.section("NSLOOKUP");
  ui.print("Target", target, { label: COLOR_PALETTE.white, value: COLOR_PALETTE.pink });

  // Try nslookup command - use temp file pattern like dig.ts
  const tempFile = ".nslookup_output.txt";
  let resolvedIp: string | null = null;

  try {
    // Execute nslookup and redirect to temp file
    await Shell.Process.exec(`nslookup ${target} > ${tempFile}`);
    
    // Read the output file
    const output = await FileSystem.ReadFile(tempFile, { absolute: false });
    
    // Cleanup
    try {
      await FileSystem.Remove(tempFile, { absolute: false });
    } catch {
      // Ignore cleanup errors
    }
    
    // Extract all IPs - the last one is the resolved IP
    const ipMatches = output.match(/\d+\.\d+\.\d+\.\d+/g);
    resolvedIp = ipMatches && ipMatches.length > 0 ? ipMatches[ipMatches.length - 1] : null;
  } catch (err) {
    ui.error(`nslookup error: ${err}`);
    // Cleanup on error
    try {
      await FileSystem.Remove(tempFile, { absolute: false });
    } catch {
      // Ignore cleanup errors
    }
  }

  if (!resolvedIp) {
    ui.warn(`Could not resolve ${target}`);
    return {
      success: false,
      data: { domain: target, error: "Resolution failed" },
    };
  }

  // Update domain asset with resolved IP
  const domainAsset = mission.assets.domains.find((d) => d.value === target);
  if (domainAsset) {
    domainAsset.resolvedIp = resolvedIp;
  }

  ui.divider();
  ui.print("IP", resolvedIp, { label: COLOR_PALETTE.gray, value: COLOR_PALETTE.pink });
  ui.success(`Resolved: ${target} -> ${resolvedIp}`);

  return {
    success: true,
    data: { domain: target, nameservers: [resolvedIp] },
    newAssets: [{ type: "ip" as const, value: resolvedIp, parent: target }],
  };
}

// ============================================================================
// SECTION 4: Helper Functions
// ============================================================================
function resolveDomain(mission: MissionManifest, args?: string[]): string | null {
  if (args && args.length > 0) return args[0];
  return (
    mission.assets.domains.find((d) => !d.resolvedIp)?.value ||
    mission.seeds.find((s) => s.type === "domain")?.value ||
    null
  );
}

// ============================================================================
// SECTION 5: Default Export
// ============================================================================
export default { meta, run };
