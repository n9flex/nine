/**
 * nine - Modular CLI toolkit
 * @app-description IP scanner, WiFi cracker, and full attack pipeline
 */

const VERSION = "0.0.1";

import { UI } from "./lib/ui";
import { Logger } from "./lib/logger";
import { scanIP } from "./modules/scanner";
import * as nettree from "./modules/nettree";

const ui = UI.ctx();
const logger = new Logger();

const NINE_ART = String.raw`
      ⠀⠀⣠⡶⠂⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
     ⠀⣰⣿⠃⠀⠀⠀⠀⠀⠀⠀⢀⣀⡀⠀⠀⠀⠀⠀⠀⠀
    ⢸⣿⣯⠀⠀⠀⠀⠀⠀⢠⣴⣿⣿⣿⣿⣦⠀⠀⠀⠀⠀
    ⢼⣿⣿⣆⠀⢀⣀⣀⣴⣿⣿⣿⠋⠀⠀⠀⠀⠀⠀⠀⠀
    ⢸⣿⣿⣿⣿⣿⣿⣿⠿⠿⣿⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀
    ⠀⢻⣿⠋⠙⢿⣿⣿⡀⠀⣿⣷⣄⠀⠀⠀⠀⠀⠀⠀⠀
    ⠀⢸⠿⢆⣀⣼⣿⣿⣿⣿⡏⠀⢹⠀⠀⠀⠀⠀⠀⠀⠀
    ⠀⠀⡀⣨⡙⠟⣩⣙⣡⣬⣴⣤⠏⠀⠀⠀⠀⠀⠀⣀⡀
    ⠀⠀⠙⠿⣿⣿⣿⣿⣿⣿⣿⣧⠀⠀⠀⣀⣤⣾⣿⣿⡇
    ⠀⠀⠀⠀⠀⢀⣿⣿⣿⣿⣿⣿⣇⠀⢸⣿⣿⠿⠿⠛⠃
    ⠀⠀⠀⠀⢠⣿⣿⢹⣿⢹⣿⣿⣿⢰⣿⠿⠃⠀⠀⠀⠀
    ⠀⢀⣀⣤⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⡛⠀⠀⠀⠀⠀⠀
    ⠀⠻⠿⣿⣿⣿⣿⣿⣿⣿⣿⡿⠿⠿⠛⠓⠀⠀⠀⠀⠀
    ⠀⠀⠀⠀⠀⠀⠀⠉⠀⠉⠈⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀                                                                       
`;

const CREDIT = `
         nine v${VERSION}
      Modular CLI Toolkit
`;

// Color configuration - uses UI palette keys
const COLORS = {
  usageExample: "yellow",  // nine <ip> examples
  sectionTitle: "white", // USAGE headers
} as const;

// Module registry
const MODULES = {
  nettree: { module: nettree, aliases: nettree.moduleInfo.aliases },
};

async function main(args: string[], scriptLocation?: string): Promise<void> {
  // Set working directory if called from wrapper
  if (scriptLocation) {
    await FileSystem.SetPath(scriptLocation, { absolute: true });
  }

  // Print ASCII art with gradient (pink → sora → purple)
  const artLines = NINE_ART.split("\n");
  for (const line of artLines) {
    if (line.trim()) {
      ui.printGradient(line, ["pink", "sora", "purple"]);
    }
  }
  ui.printGradient(CREDIT, ["pink", "sora", "purple"]);
  ui.newLine();
  
  if (!args.length) {
    showUsage();
    return;
  }
  
  // Check if first arg is a module command
  const firstArg = args[0];
  const moduleEntry = Object.entries(MODULES).find(([_, entry]) => 
    entry.aliases.includes(firstArg) || firstArg === entry.module.moduleInfo.command
  );
  
  if (moduleEntry) {
    const [moduleName, moduleData] = moduleEntry;
    const moduleArgs = args.slice(1); // Remove module command, keep target and flags
    const flags = {};
    
    await moduleData.module.run(moduleArgs, flags);
    return;
  }
  
  // If no module matched, treat as IP scan
  if (!Networking.IsIp(firstArg)) {
    showUsage();
    return;
  }
  
  const target = args[0];
  const isFull = args.includes("--full");
  
  Shell.lock();
  
  try {
    logger.setTarget(target);
    await scanIP(target, logger, ui);
    
    if (isFull) {
      ui.info("Full pipeline mode - coming soon");
      // TODO: Call exploit, brute, post modules
    }

    // Generate report
    await logger.saveReport();
    const reportPath = await logger.getReportPath();
    ui.success(`Report saved: ${reportPath}`);
  } finally {
    Shell.unlock();
  }
}

function showUsage() {
  ui.section("USAGE");
  ui.print("  nine <ip>          Scan target IP", COLORS.usageExample);
  ui.print("  nine nettree <ip>  Network topology discovery (-nt)", COLORS.usageExample);
}

// Export for HackHub /lib/ compatibility
export { main };
