// @ts-nocheck
// ============================================================================
// SECTION: Imports
// ============================================================================

import { UI, COLOR_PALETTE } from "./lib/ui";

// ============================================================================
// SECTION: Constants
// ============================================================================

const VERSION = "0.2.2";
const ui = UI.ctx();
const LIB_DIR = "/lib";
const NINE_WRAPPER = `${LIB_DIR}/nine.ts`;
const DAT_FILE = "nine.dat";

// Color palette for Mimikyu
const COLORS = {
  ears: "#58585898",
  body: "#dfdad6",
  tail: "#a77c5e"
} as const;

const NINE_ART = [
  [{ text: "                 ⠀⠀⣠⡶⠂⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀", color: COLORS.ears }],
  [{ text: "                ⠀⣰⣿⠃⠀⠀⠀⠀⠀⠀⠀⢀⣀⡀⠀⠀⠀⠀⠀⠀⠀", color: COLORS.ears }],
  [{ text: "               ⢸⣿⣯⠀⠀⠀⠀⠀⠀⢠⣴⣿⣿⣿⣿⣦⠀⠀⠀⠀⠀", color: COLORS.ears }],
  [{ text: "               ⢼⣿⣿⣆⠀⢀⣀⣀⣴⣿⣿⣿⠋⠀⠀⠀⠀⠀⠀⠀⠀", color: COLORS.body }],
  [{ text: "               ⢸⣿⣿⣿⣿⣿⣿⣿⠿⠿⣿⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀", color: COLORS.body }],
  [{ text: "               ⠀⢻⣿⠋⠙⢿⣿⣿⡀⠀⣿⣷⣄⠀⠀⠀⠀⠀⠀⠀", color: COLORS.body }],
  [{ text: "               ⠀⢸⠿⢆⣀⣼⣿⣿⣿⣿⡏⠀⢹⠀⠀⠀⠀⠀⠀⠀⠀", color: COLORS.body }],
  [{ text: "              ⠀⠀⡀⣨⡙⠟⣩⣙⣡⣬⣴⣤⠏⠀⠀⠀⠀⠀⠀", color: COLORS.body }, { text: "⣀", color: COLORS.tail }, { text: "⡀", color: COLORS.tail }],
  [{ text: "              ⠀⠀⠙⠿⣿⣿⣿⣿⣿⣿⣿⣧⠀⠀⠀", color: COLORS.body }, { text: "⣀⣤⣾⣿⣿⡇", color: COLORS.tail }],
  [{ text: "              ⠀⠀⠀⠀⠀⢀⣿⣿⣿⣿⣿⣿⣇⠀", color: COLORS.body }, { text: "⢸⣿⣿⠿⠿⠛⠃", color: COLORS.tail }],
  [{ text: "               ⠀⠀⠀⠀⢠⣿⣿⢹⣿⢹⣿⣿⣿", color: COLORS.body }, { text: "⢰⣿⠿⠃", color: COLORS.tail }, { text: "⠀⠀⠀⠀", color: COLORS.body }],
  [{ text: "              ⠀⢀⣀⣤⣿⣿⣿⣿⣿⣿⣿⣿⣿", color: COLORS.body }, { text: "⣷⡛", color: COLORS.tail }, { text: "⠀⠀⠀⠀⠀⠀", color: COLORS.body }],
  [{ text: "              ⠀⠻⠿⣿⣿⣿⣿⣿⣿⣿⣿⡿⠿⠿⠛⠓⠀⠀⠀⠀⠀", color: COLORS.body }],
  [{ text: "               ⠀⠀⠀⠀⠀⠀⠀⠉⠀⠉⠈⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀", color: COLORS.ears }],
] as Array<Array<{ text: string; color: string }>>;

// ============================================================================
// SECTION: UI Helper for Centering
// ============================================================================

function centerText(text: string, width: number = 50): string {
  const padding = Math.max(0, Math.floor((width - text.length) / 2));
  return " ".repeat(padding) + text;
}

// ============================================================================
// SECTION: Main Entry Point
// ============================================================================

async function main(): Promise<void> {
  const args = Shell.GetArgs();
  const isUninstall = args.includes("--uninstall") || args.includes("-u");

  // Print ASCII art with spacing
  for (const line of NINE_ART) {
    println(line);
  }
  
  // Styled header - centered
  ui.divider();
  println([{ text: centerText(`NINE CLI INSTALLER v${VERSION}`), color: COLOR_PALETTE.purple }]);
  ui.divider();
  ui.info("Mission-centric penetration CLI toolkit");
  println([]); // Empty line for spacing

  if (isUninstall) {
    await uninstall();
  } else {
    await install();
  }
}

// ============================================================================
// SECTION: Install Logic
// ============================================================================

async function install(): Promise<void> {
  const cwd = await FileSystem.cwd();
  const repoPath = cwd.absolutePath;

  // Validate nine repo structure
  const isValid = await validateRepo();
  if (!isValid) {
    ui.error("Invalid repository: nine.ts or lib/ folder not found");
    return;
  }

  // Check for existing installation
  const existing = await fileExists(NINE_WRAPPER);
  if (existing) {
    ui.warn("nine is already installed in /lib/");
    println([]); // Spacing before prompt
    const answer = await prompt("Overwrite? (y/N): ");
    if (!answer || answer.toLowerCase() !== "y") {
      ui.info("Installation cancelled");
      return;
    }
    println([]); // Spacing
    ui.info("Updating existing installation...");
    println([]); // Spacing
  } else {
    println([]); // Spacing for fresh install
  }

  // Create wrapper script
  ui.info(`Installing from: ${repoPath}`);
  println([]); // Spacing
  await createWrapper(repoPath);

  // Save install metadata
  await FileSystem.WriteFile(`${repoPath}/${DAT_FILE}`, JSON.stringify({ installedAt: new Date().toISOString() }), { absolute: true });

  // Success section - omni style
  ui.divider();
  ui.success("Installation complete!");
  println([]); // Spacing
  
  // Usage section - styled like [ SCAN RESULTS ]
  println([{ text: "───────────────────────────────────────────────────", color: COLOR_PALETTE.gray }]);
  println([{ text: centerText("[ USAGE ]"), color: COLOR_PALETTE.purple }]);
  println([{ text: "───────────────────────────────────────────────────", color: COLOR_PALETTE.gray }]);
  println([{ text: " nine    Show help", color: COLOR_PALETTE.cyan }]);
  println([{ text: "───────────────────────────────────────────────────", color: COLOR_PALETTE.gray }]);
}

// ============================================================================
// SECTION: Uninstall Logic
// ============================================================================

async function uninstall(): Promise<void> {
  const exists = await fileExists(NINE_WRAPPER);

  if (!exists) {
    ui.warn("nine is not installed in /lib/");
    return;
  }

  await FileSystem.Remove(NINE_WRAPPER, { absolute: true });
  ui.success("Removed /lib/nine.ts");
  ui.divider();
  ui.success("nine uninstalled successfully");
}

// ============================================================================
// SECTION: Helper Functions
// ============================================================================

async function validateRepo(): Promise<boolean> {
  try {
    const cwd = await FileSystem.cwd();
    const entries = await FileSystem.ReadDir(cwd.absolutePath, { absolute: true });
    const hasNineTs = entries.some((e: { name: string; extension: string; isFolder: boolean }) => `${e.name}.${e.extension}` === "nine.ts" && !e.isFolder);
    const hasLibDir = entries.some((e: { name: string; isFolder: boolean }) => e.name === "lib" && e.isFolder);
    return hasNineTs && hasLibDir;
  } catch {
    return false;
  }
}

async function createWrapper(repoPath: string): Promise<void> {
  const wrapperContent = `// @ts-nocheck
/**
 * nine - Global wrapper for Nine CLI
 * Auto-generated by install.ts
 * Repository: ${repoPath}
 * Version: ${VERSION}
 */
import { main } from "..${repoPath}/nine";
const args = Shell.GetArgs();
await main(args, '${repoPath}');
`;
  await FileSystem.WriteFile(NINE_WRAPPER, wrapperContent, { absolute: true, recursive: true });
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await FileSystem.ReadFile(path, { absolute: true });
    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// SECTION: Entry Point
// ============================================================================

main().catch((err) => ui.error(`Fatal error: ${err}`));
