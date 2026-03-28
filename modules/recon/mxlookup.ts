// @ts-nocheck
// ============================================================================
// SECTION 1: Imports
// ============================================================================
import { UI, COLOR_PALETTE } from "../../lib/ui";
import { MissionManifest, ModuleResult } from "../../lib/types";

// ============================================================================
// SECTION 2: Module Metadata
// ============================================================================
export const meta = {
  name: "mxlookup",
  command: "mxlookup",
  description: "MX record lookup for mail servers",
  requires: [],
  inputs: ["domain"],
  outputs: ["mx_records", "mail_servers"],
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
    ui.error("No target domain specified");
    return { success: false, data: { error: "No target" } };
  }

  // Validate target is NOT an IP
  if (Networking.IsIp(target)) {
    ui.error(`mxlookup requires a domain, not an IP: ${target}`);
    return { success: false, data: { error: "Invalid target type" } };
  }

  ui.section("MXLOOKUP");
  ui.print("Target", target, { label: COLOR_PALETTE.white, value: COLOR_PALETTE.pink });

  // Check/install mxlookup
  if (!checkLib("mxlookup")) {
    ui.info("Installing mxlookup...");
    await installLib("mxlookup");
  }

  // Execute mxlookup with temp file (like dirhunter)
  const tempFile = "./tmp/mxlookup_output.txt";
  let output = "";
  
  // Ensure temp directory exists
  try {
    await FileSystem.Mkdir("./tmp", { absolute: false });
  } catch {
    // Directory might already exist
  }
  
  try {
    await Shell.Process.exec(`mxlookup ${target} > ${tempFile}`);
    output = await FileSystem.ReadFile(tempFile, { absolute: false });
    
    // Cleanup
    try {
      await FileSystem.Remove(tempFile, { absolute: false });
    } catch {
      // Ignore cleanup errors
    }
  } catch (err) {
    ui.error(`mxlookup error: ${err}`);
    // Cleanup on error
    try {
      await FileSystem.Remove(tempFile, { absolute: false });
    } catch {
      // Ignore cleanup errors
    }
  }

  // Parse MX records from output
  let mxRecords: Array<{ priority: number; server: string; host?: string }> = [];
  
  if (output) {
    // Check for "No MX" message
    if (output.includes("No MX") || output.includes("no MX") || output.includes("Not found")) {
      ui.warn(`No MX records found for ${target}`);
      return {
        success: false,
        data: { domain: target, mailServers: [], error: "No MX records found" },
        newAssets: [],
      };
    }
    
    // Parse format: "Mail Server:\tserver\nHost:\tip" (with tabs)
    // OR multi-line format
    const lines = output.split("\n");
    
    for (const line of lines) {
      // Tab-separated: "Mail Server:\tnovaenergy.com"
      const tabMatch = line.match(/^Mail Server[:\s\t]+(\S+)/i);
      if (tabMatch) {
        const server = tabMatch[1];
        let host: string | undefined;
        
        // Look for Host on same or next line
        const hostLine = lines.find(l => l.match(/^Host[:\s\t]+(\S+)/i));
        if (hostLine) {
          const hostMatch = hostLine.match(/^Host[:\s\t]+(\S+)/i);
          if (hostMatch) host = hostMatch[1];
        }
        
        // Default priority to 10 when not specified by mxlookup command
        // In MX records, priority determines preference (lower = preferred)
        // Standard fallback when command doesn't provide real priority values
        mxRecords.push({
          priority: 10,
          server: server,
          host: host
        });
      }
    }
    
    // Also try standard MX format as fallback: "Priority X: server" or "X server"
    if (mxRecords.length === 0) {
      for (const line of lines) {
        const match = line.match(/(?:Priority\s+)?(\d+)[:\s]+(\S+)/);
        if (match && !mxRecords.find(r => r.server === match[2])) {
          mxRecords.push({
            priority: parseInt(match[1], 10),
            server: match[2]
          });
        }
      }
    }
  }
  
  // If still no records found, return empty
  if (mxRecords.length === 0) {
    ui.divider();
    ui.warn(`No MX records found for ${target}`);
    return {
      success: false,
      data: { domain: target, mailServers: [], error: "No MX records found" },
      newAssets: [],
    };
  }

  ui.divider();
  ui.success(`Found ${mxRecords.length} MX record(s) for ${target}`);

  for (const mx of mxRecords) {
    ui.print(`  Mail Server`, mx.server, {
      label: COLOR_PALETTE.white,
      value: COLOR_PALETTE.cyan,
    });
    if (mx.host) {
      ui.print(`    Host`, mx.host, {
        label: COLOR_PALETTE.gray,
        value: COLOR_PALETTE.purple,
      });
    }
  }

  // Build newAssets for mail servers (as domain assets)
  const newAssets = mxRecords.map(mx => ({
    type: "domain" as const,
    value: mx.server,
    parent: target,
  }));

  return {
    success: true,
    data: { domain: target, mailServers: mxRecords },
    newAssets,
  };
}

// ============================================================================
// SECTION 4: Helper Functions
// ============================================================================
function resolveDomain(mission: MissionManifest, args?: string[]): string | null {
  if (args && args.length > 0) return args[0];
  return mission.assets.domains[0]?.value || null;
}

// ============================================================================
// SECTION 5: Default Export
// ============================================================================
export default { meta, run };
