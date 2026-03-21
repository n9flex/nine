/**
 * nine - Modular CLI toolkit
 * @app-description IP scanner, WiFi cracker, and full attack pipeline
 */

const VERSION = "0.0.1";

import { UI } from "./lib/ui";
import { Logger } from "./lib/logger";
import { scanIP } from "./modules/scanner";

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
  
  if (!args.length || !Networking.IsIp(args[0])) {
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
}

// Export for HackHub /lib/ compatibility
export { main };
