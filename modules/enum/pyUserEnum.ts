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
  // Resolve targets from args or mission
  const targets = resolveIpTargets(mission, args);

  // Validate targets exist
  if (targets.length === 0) {
    ui.error("No target IP specified and no discovered IPs in mission");
    return { success: false, data: { error: "No targets" } };
  }

  // Header
  ui.section("USER ENUMERATION");
  ui.info(`Targets: ${targets.length} IP(s)`);

  const allResults: { target: string; users: string[] }[] = [];
  let totalUsers = 0;

  for (const target of targets) {
    // Validate target IS an IP
    const ipPattern = /^(?:\d{1,3}\.){3}\d{1,3}$/;
    if (!ipPattern.test(target)) {
      ui.error(`pyUserEnum requires an IP address: ${target}`);
      continue;
    }

    ui.divider();
    ui.print("Target", target, { label: COLOR_PALETTE.white, value: COLOR_PALETTE.pink });

    // Check/install python3
    if (!checkLib("python3")) {
      ui.info("Installing python3...");
      const installed = await installLib("python3");
      if (!installed) {
        ui.error("Failed to install python3");
        continue;
      }
    }

    // Download pyUserEnum.py if needed
    const scriptPath = await ensurePythonScript("pyUserEnum.py", "./python", ui);
    if (!scriptPath) {
      ui.error("Failed to download pyUserEnum.py from HackDB");
      continue;
    }

    // Execute pyUserEnum - output is displayed interactively
    try {
      await Shell.Process.exec(`python3 ${scriptPath} ${target}`);
    } catch (e) {
      ui.error(`Execution error on ${target}: ${e}`);
    }

    ui.divider();

    // Interactive prompt for discovered users (output cannot be captured programmatically)
    ui.info(`Enter discovered username(s) for ${target}, comma-separated, or 'skip':`);
    println([{ text: "  Example: admin, root, building", color: COLOR_PALETTE.gray }]);

    const input = await prompt("Users: ");
    let users: string[] = [];

    if (input && input.toLowerCase() !== "skip") {
      users = input.split(",").map(u => u.trim()).filter(u => u.length > 0);
    }

    allResults.push({ target, users });
    totalUsers += users.length;

    if (users.length === 0) {
      ui.warn(`No users found on ${target}`);
    } else {
      ui.success(`Found ${users.length} user(s) on ${target}`);
    }
  }

  ui.divider();
  ui.divider();

  if (allResults.length === 0) {
    ui.error("No targets processed successfully");
    return { success: false, data: { error: "No results" } };
  }

  // Summary table
  if (totalUsers > 0) {
    ui.info(`Found ${totalUsers} user(s) across ${allResults.length} target(s)`);
    ui.divider();

    for (const result of allResults) {
      if (result.users.length > 0) {
        ui.print(`Target: ${result.target}`, "", { label: COLOR_PALETTE.white });
        const userRows = result.users.map(u => ({ Username: u }));
        ui.table(["Username"], userRows);
        ui.divider();
      }
    }
  } else {
    ui.warn("No users found on any target");
  }

  ui.success(`Processed ${allResults.length} target(s), ${totalUsers} user(s) found`);

  // Build newAssets for discovered users
  const newAssets: NewAsset[] = [];
  for (const result of allResults) {
    for (const user of result.users) {
      newAssets.push({
        type: "credential",
        value: { user, pass: "", source: `pyUserEnum on ${result.target}` },
        parent: result.target,
      });
    }
  }

  return {
    success: true,
    data: {
      results: allResults,
      totalTargets: allResults.length,
      totalUsers,
    },
    newAssets,
  };
}

// ============================================================================
// SECTION 4: Helper Functions
// ============================================================================
function resolveIpTargets(mission: MissionManifest, args?: string[]): string[] {
  if (args && args.length > 0) return args;
  return mission.assets.ips
    .filter((ip) => ip.status === "discovered")
    .map((ip) => ip.value);
}

// ============================================================================
// SECTION 5: Default Export
// ============================================================================
export default { meta, run };
