// @ts-nocheck
// ============================================================================
// SECTION 1: Imports
// ============================================================================
import { UI, COLOR_PALETTE } from "../../lib/ui";
import { MissionManifest, ModuleResult } from "../../lib/types";
import { ensurePythonScript } from "../../lib/python";

// ============================================================================
// SECTION 2: Module Metadata
// ============================================================================
export const meta = {
  name: "pyUserEnum",
  command: "pyuserenum",
  description: "User enumeration using pyUserEnum.py",
  requires: [],
  inputs: ["ip"],
  outputs: ["users", "credentials"],
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
  const target = resolveIpTarget(mission, args);

  // Validate target exists
  if (!target) {
    ui.error("No target IP specified");
    return { success: false, data: { error: "No target" } };
  }

  // Validate target IS an IP
  const ipPattern = /^(?:\d{1,3}\.){3}\d{1,3}$/;
  if (!ipPattern.test(target)) {
    ui.error(`pyUserEnum requires an IP address: ${target}`);
    return { success: false, data: { error: "Invalid target type" } };
  }

  // Header
  ui.section("USER ENUMERATION");
  ui.print("Target", target, { label: COLOR_PALETTE.white, value: COLOR_PALETTE.pink });

  // Check/install python3
  if (!checkLib("python3")) {
    ui.info("Installing python3...");
    const installed = await installLib("python3");
    if (!installed) {
      ui.error("Failed to install python3");
      return { success: false, data: { error: "python3 not available" } };
    }
  }

  // Download pyUserEnum.py if needed
  const scriptPath = await ensurePythonScript("pyUserEnum.py", "./python", ui);
  if (!scriptPath) {
    ui.error("Failed to download pyUserEnum.py from HackDB");
    return { success: false, data: { error: "Script download failed" } };
  }

  // Execute pyUserEnum - output is displayed interactively
  try {
    await Shell.Process.exec(`python3 ${scriptPath} ${target}`);
  } catch (e) {
    ui.error(`Execution error: ${e}`);
  }

  ui.divider();

  // Interactive prompt for discovered users (output cannot be captured programmatically)
  ui.info("Enter discovered username(s), comma-separated, or 'skip':");
  println([{ text: "  Example: admin, root, building", color: COLOR_PALETTE.gray }]);

  const input = await prompt("Users: ");
  let users: string[] = [];

  if (input && input.toLowerCase() !== "skip") {
    users = input.split(",").map(u => u.trim()).filter(u => u.length > 0);
  }

  ui.divider();

  if (users.length === 0) {
    ui.warn("No users found on target");
  } else {
    // Results table
    ui.info(`Found ${users.length} user(s) on ${target}`);
    ui.divider();

    // Build table rows
    const userRows = users.map(u => ({ Username: u }));
    ui.table(["Username"], userRows);
    ui.divider();
  }

  ui.success(`Found ${users.length} user(s) on ${target}`);

  return {
    success: true,
    data: { target, users, count: users.length },
    newAssets: [],
  };
}

// ============================================================================
// SECTION 4: Helper Functions
// ============================================================================
function resolveIpTarget(mission: MissionManifest, args?: string[]): string | null {
  if (args && args.length > 0) return args[0];
  return mission.assets.ips.find((ip) => ip.status === "discovered")?.value || null;
}

// ============================================================================
// SECTION 5: Default Export
// ============================================================================
export default { meta, run };
