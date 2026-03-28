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
  name: "dirhunter",
  command: "dirhunter",
  description: "Directory bruteforce for web servers",
  requires: [],
  inputs: ["domain"],
  outputs: ["directories", "paths"],
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

  ui.info(`Running directory bruteforce on ${target}...`);
  ui.info("This may take a while...");

  // Check/install dirhunter
  if (!checkLib("dirhunter")) {
    ui.info("Installing dirhunter...");
    await installLib("dirhunter");
  }

  // Execute dirhunter - use temp file to capture output
  const tempFile = ".dirhunter_output.txt";
  let directories: string[] = [];

  try {
    await Shell.Process.exec(`dirhunter ${target} > ${tempFile}`);
    const output = await FileSystem.ReadFile(tempFile, { absolute: false });
    
    // Cleanup
    try {
      await FileSystem.Remove(tempFile, { absolute: true });
    } catch {
      // Ignore cleanup errors
    }

    // Parse directories from output - match "Found: /path" pattern
    const dirMatches = output.match(/Found:\s*(\/[^\s]*)/g);
    if (dirMatches) {
      directories = dirMatches
        .map(m => m.replace(/Found:\s*/, ''))
        .filter((v, i, a) => a.indexOf(v) === i);
    }
  } catch {
    // Silent fallback
    try {
      await FileSystem.Remove(tempFile, { absolute: true });
    } catch {
      // Ignore cleanup errors
    }
  }

  if (directories.length === 0) {
    ui.warn(`No directories found on ${target}`);
  } else {
    ui.success(`Found ${directories.length} directorie(s) on ${target}`);
  }

  // Display first 5 directories
  for (const dir of directories.slice(0, 5)) {
    ui.print("  Path", dir, { label: COLOR_PALETTE.white, value: COLOR_PALETTE.green });
  }

  return {
    success: true,
    data: { target, directories, count: directories.length },
    newAssets: [],
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
