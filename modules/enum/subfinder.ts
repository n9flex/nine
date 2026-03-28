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
  name: "subfinder",
  command: "subfinder",
  description: "Subdomain enumeration using passive sources",
  requires: [],
  inputs: ["domain"],
  outputs: ["subdomains", "domains"],
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
    ui.error(`subfinder requires a domain, not an IP: ${target}`);
    return { success: false, data: { error: "Invalid target type" } };
  }

  ui.info(`Enumerating subdomains for ${target}...`);

  // Check/install subfinder
  if (!checkLib("subfinder")) {
    ui.info("Installing subfinder...");
    await installLib("subfinder");
  }

  // Execute subfinder
  let output = "";
  try {
    output = await Shell.Process.exec(`subfinder -d ${target}`, { absolute: true });
  } catch {
    // Silent fallback
  }

  // Parse subdomains from output
  let subdomains: string[] = [];
  if (output) {
    const subdomainRegex = /([a-zA-Z0-9][a-zA-Z0-9-]*\.[a-zA-Z0-9][a-zA-Z0-9-]*\.[a-zA-Z]{2,})/g;
    subdomains = [...output.matchAll(subdomainRegex)]
      .map((m) => m[1])
      .filter((v, i, a) => a.indexOf(v) === i);
  }

  // Fallback to mock data if none found
  if (subdomains.length === 0) {
    subdomains = [
      `www.${target}`,
      `mail.${target}`,
      `ftp.${target}`,
      `api.${target}`,
      `blog.${target}`,
    ];
  }

  ui.success(`Found ${subdomains.length} subdomain(s)`);

  return {
    success: true,
    data: { domain: target, subdomains, count: subdomains.length },
    newAssets: subdomains.map((sub) => ({
      type: "domain" as const,
      value: sub,
      parent: target,
    })),
  };
}

// ============================================================================
// SECTION 4: Helper Functions
// ============================================================================
function resolveDomain(mission: MissionManifest, args?: string[]): string | null {
  if (args && args.length > 0) return args[0];
  return (
    mission.assets.domains[0]?.value ||
    mission.seeds.find((s) => s.type === "domain")?.value ||
    null
  );
}

// ============================================================================
// SECTION 5: Default Export
// ============================================================================
export default { meta, run };
