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
  name: "lynx",
  command: "lynx",
  description: "OSINT harvest with recursive search",
  requires: [],
  inputs: ["term"],
  outputs: ["emails", "ips", "social", "domains"],
};

// ============================================================================
// SECTION 3: Types
// ============================================================================
type Section = "social" | "contact" | "ip" | "address" | "additional";

interface ScanResult {
  query: string;
  social: string[];
  contact: string[];
  ip: string[];
  address: string[];
  additional: string[];
}

// ============================================================================
// SECTION 4: Parser Constants
// ============================================================================
const SECTION_HEADERS: Array<{ re: RegExp; section: Section }> = [
  { re: /Scanning social media platforms\.\.\./i, section: "social" },
  { re: /Searching for contact information\.\.\./i, section: "contact" },
  { re: /Checking for IP address activity\.\.\./i, section: "ip" },
  { re: /Locating physical address\.\.\./i, section: "address" },
  { re: /Searching web for additional information\.\.\./i, section: "additional" },
];

const NO_DATA_RE = /^No data found\.\s*$/i;
const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const IP_RE = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;
const HANDLE_RE = /@\S+/g;

// ============================================================================
// SECTION 5: Parser Functions
// ============================================================================
function matchSectionHeader(line: string): Section | null {
  for (const h of SECTION_HEADERS) {
    if (h.re.test(line)) return h.section;
  }
  return null;
}

function normalizeBlock(lines: string[]): string[] {
  const output: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.includes("...")) continue;
    output.push(trimmed);
  }
  return output;
}

function pushUnique(target: string[], items: string[]) {
  for (const it of items) {
    const v = it.trim();
    if (!v) continue;
    if (target.indexOf(v) === -1) target.push(v);
  }
}

function parseSocial(lines: string[]): string[] {
  const handles: string[] = [];

  for (const line of lines) {
    if (NO_DATA_RE.test(line)) continue;

    // Extract @handles - lynx outputs lines like:
    // "Twotter account was found with the registered username @popstargames"
    const matches = line.match(HANDLE_RE);
    if (matches) {
      for (const m of matches) {
        // Clean trailing punctuation
        const cleaned = m.replace(/[),.;:]+$/g, "");
        handles.push(cleaned);
      }
    }
  }

  return handles;
}

function parseContact(lines: string[]): string[] {
  const contacts: string[] = [];

  for (const line of lines) {
    if (NO_DATA_RE.test(line)) continue;

    // Extract emails
    const emails = line.match(EMAIL_RE);
    if (emails) {
      pushUnique(contacts, emails);
      continue;
    }

    // Extract phone numbers (basic pattern)
    const phoneMatches = line.match(/\+?[\d\s\-\(\)]{7,20}/g);
    if (phoneMatches) {
      for (const p of phoneMatches) {
        const cleaned = p.replace(/[),.;:]+$/g, "").trim();
        if (cleaned) contacts.push(cleaned);
      }
    }
  }

  return contacts;
}

function parseIPs(lines: string[]): string[] {
  const ips: string[] = [];

  for (const line of lines) {
    if (NO_DATA_RE.test(line)) continue;

    const matches = line.match(IP_RE);
    if (matches) {
      pushUnique(ips, matches);
    }
  }

  return ips;
}

function parseLynxOutput(raw: string, query: string): ScanResult {
  const lines = raw.split("\n").map(l => l.replace(/\r/g, ""));

  const result: ScanResult = {
    query,
    social: [],
    contact: [],
    ip: [],
    address: [],
    additional: []
  };

  let currentSection: Section | null = null;
  let buffer: string[] = [];

  const flush = () => {
    if (!currentSection) {
      buffer = [];
      return;
    }

    const cleaned = normalizeBlock(buffer);
    buffer = [];

    if (cleaned.length === 0) return;
    if (NO_DATA_RE.test(cleaned.join("\n").trim())) return;

    switch (currentSection) {
      case "social":
        pushUnique(result.social, parseSocial(cleaned));
        break;
      case "contact":
        pushUnique(result.contact, parseContact(cleaned));
        break;
      case "ip":
        pushUnique(result.ip, parseIPs(cleaned));
        break;
      case "address":
        pushUnique(result.address, cleaned);
        break;
      case "additional":
        pushUnique(result.additional, cleaned);
        break;
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    // Detect section header
    const headerMatch = matchSectionHeader(line);
    if (headerMatch) {
      flush();
      currentSection = headerMatch;
      continue;
    }

    // Skip lines before first section
    if (!currentSection) continue;

    // Blank line may indicate section end
    if (line.length === 0) {
      flush();
      continue;
    }

    buffer.push(rawLine);
  }

  // Flush last section
  flush();

  return result;
}

// ============================================================================
// SECTION 6: Core Logic
// ============================================================================
export async function run(
  mission: MissionManifest,
  ui: UI,
  args?: string[]
): Promise<ModuleResult> {
  // Resolve target from args or mission
  const target = resolveTarget(mission, args);

  // Validate target exists
  if (!target) {
    ui.error("No search term specified");
    return { success: false, data: { error: "No target" } };
  }

  ui.info(`Running OSINT harvest for ${target}...`);
  ui.info("This may take a while...");

  // Check/install lynx
  if (!checkLib("lynx")) {
    ui.info("Installing lynx...");
    await installLib("lynx");
  }

  // Execute lynx with temp file
  let output = "";
  try {
    const tmpFile = "./tmp/lynx_output.txt";
    await FileSystem.Mkdir("./tmp", { recursive: true });
    await Shell.Process.exec(`lynx ${target} > ${tmpFile}`);
    output = await FileSystem.ReadFile(tmpFile, { absolute: false });
    await FileSystem.Remove(tmpFile, { absolute: false });
  } catch (err) {
    ui.error(`Lynx command failed: ${err}`);
    return { success: false, data: { error: String(err) } };
  }

  // Parse results using section-based parser
  const result = parseLynxOutput(output, target);

  const totalFound = result.contact.length + result.ip.length + result.social.length +
                     result.address.length + result.additional.length;

  ui.success(`OSINT harvest complete — ${totalFound} items found`);

  ui.print("Emails found", String(result.contact.length), {
    label: COLOR_PALETTE.white,
    value: COLOR_PALETTE.purple,
  });
  ui.print("IPs found", String(result.ip.length), {
    label: COLOR_PALETTE.white,
    value: COLOR_PALETTE.purple,
  });
  ui.print("Social handles found", String(result.social.length), {
    label: COLOR_PALETTE.white,
    value: COLOR_PALETTE.purple,
  });

  if (result.social.length > 0) {
    ui.divider();
    ui.print("Social handles:", "", { label: COLOR_PALETTE.white, value: COLOR_PALETTE.white });
    for (const handle of result.social) {
      ui.print(`  ${handle}`, "", { label: COLOR_PALETTE.cyan, value: COLOR_PALETTE.white });
    }
  }

  // Build new assets
  const newAssets: Array<{ type: "ip" | "domain" | "email"; value: string; parent?: string }> = [];

  for (const email of result.contact) {
    newAssets.push({ type: "email", value: email, parent: target });
  }
  for (const ip of result.ip) {
    newAssets.push({ type: "ip", value: ip, parent: target });
  }

  return {
    success: totalFound > 0,
    data: result,
    newAssets,
  };
}

// ============================================================================
// SECTION 7: Helper Functions
// ============================================================================
function resolveTarget(mission: MissionManifest, args?: string[]): string | null {
  if (args && args.length > 0) return args.join(" ");
  return (
    mission.assets.domains[0]?.value ||
    mission.seeds.find((s) => s.type === "domain")?.value ||
    null
  );
}

// ============================================================================
// SECTION 8: Default Export
// ============================================================================
export default { meta, run };
