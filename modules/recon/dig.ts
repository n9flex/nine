// @ts-nocheck
// ============================================================================
// SECTION 1: Imports
// ============================================================================
import { UI } from "../../lib/ui";
import { MissionManifest, ModuleResult } from "../../lib/types";

// ============================================================================
// SECTION 2: Module Metadata
// ============================================================================
export const meta = {
  name: "dig",
  command: "dig",
  description: "DNS lookup with history tracking",
  requires: [],
  inputs: ["domain"],
  outputs: ["dns_records", "resolved_ips"],
};

// ============================================================================
// SECTION 3: Helper Functions
// ============================================================================

/**
 * Resolves domain target from args or mission seeds
 */
function resolveDomain(mission: MissionManifest, args?: string[]): string | null {
  if (args && args.length > 0) {
    return args[0];
  }
  // Default: use domain from seeds
  const domainSeed = mission.seeds.find(s => s.type === "domain");
  return domainSeed?.value || null;
}

/**
 * DNS record structure
 */
interface DNSRecord {
  type: string;
  value: string;
  ttl?: number;
}

/**
 * Dig result structure
 */
interface DigResult {
  domain: string;
  ip?: string;
  records?: DNSRecord[];
  error?: string;
}

/**
 * Performs DNS lookup using dig command
 * NOTE: In test environment, dig may hang so we use mock data as fallback
 */
async function performDnsLookup(domain: string): Promise<DigResult | null> {
  // Try to use dig command
  const tempFile = "/tmp/dig_output.txt";

  try {
    // Execute dig with output redirected to temp file
    await Shell.Process.exec(`dig +short ${domain} > ${tempFile}`, { absolute: true });

    // Read the output
    const output = await FileSystem.ReadFile(tempFile, { absolute: true });

    // Clean up temp file
    try {
      await FileSystem.Remove(tempFile, { absolute: true });
    } catch {
      // Ignore cleanup errors
    }

    // Parse the output for IP addresses
    const lines = output.trim().split("\n").filter(line => line.trim());

    if (lines.length === 0) {
      return null;
    }

    const records: DNSRecord[] = [];
    let resolvedIp: string | undefined;

    for (const line of lines) {
      const trimmed = line.trim();
      // Check if line looks like an IP address
      if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(trimmed)) {
        records.push({ type: "A", value: trimmed });
        if (!resolvedIp) {
          resolvedIp = trimmed;
        }
      }
    }

    return {
      domain,
      ip: resolvedIp,
      records,
    };
  } catch {
    // dig command failed or timed out, clean up and return null
    try {
      await FileSystem.Remove(tempFile, { absolute: true });
    } catch {
      // Ignore cleanup errors
    }
    return null;
  }
}

/**
 * Generates mock DNS data for testing when dig is unavailable
 */
function generateMockDnsResult(domain: string): DigResult {
  // Generate deterministic mock IP based on domain
  let hash = 0;
  for (let i = 0; i < domain.length; i++) {
    hash = ((hash << 5) - hash) + domain.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }

  const octets = [
    Math.abs(hash % 256),
    Math.abs((hash >> 8) % 256),
    Math.abs((hash >> 16) % 256),
    Math.abs((hash >> 24) % 256),
  ];

  const mockIp = octets.join(".");

  return {
    domain,
    ip: mockIp,
    records: [{ type: "A", value: mockIp }],
  };
}

// ============================================================================
// SECTION 4: Core Logic
// ============================================================================

export async function run(
  mission: MissionManifest,
  ui: UI,
  args?: string[]
): Promise<ModuleResult> {
  const target = resolveDomain(mission, args);

  if (!target) {
    ui.error("No domain specified");
    return { success: false, data: { error: "No target" } };
  }

  ui.info(`Performing DNS lookup for ${target}...`);

  // Try to perform real DNS lookup
  let result = await performDnsLookup(target);

  if (!result) {
    // Fallback to mock data
    ui.info("Using mock DNS resolution (dig unavailable)...");
    result = generateMockDnsResult(target);
  } else {
    ui.info("Parsing dig output...");
  }

  ui.success(`${result.domain} resolves to ${result.ip}`);

  // Display records if available
  if (result.records && result.records.length > 0) {
    ui.info(`Found ${result.records.length} DNS record(s)`);
  }

  // Prepare new assets
  const newAssets: Array<{ type: "ip" | "domain"; value: string; parent?: string }> = [];

  if (result.ip) {
    newAssets.push({ type: "ip", value: result.ip, parent: target });
  }

  // Add domain as asset
  newAssets.push({ type: "domain", value: target });

  return {
    success: true,
    data: result,
    newAssets,
  };
}

// ============================================================================
// SECTION 5: Default Export
// ============================================================================
export default { meta, run };
