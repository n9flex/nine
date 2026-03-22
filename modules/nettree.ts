/**
 * NetTree module - Network topology discovery
 */

import type { UI } from "../lib/ui";
import type { Logger } from "../lib/logger";

// HackDB mapping for Python scripts
const HACKDB_SCRIPTS: Record<string, string> = {
  "net_tree.py": "NetTree - Automated Network Tree Mapper",
};

export interface NetworkNode {
  ip: string;
  lanIp: string;
  type: string;
}

/**
 * Ensures net_tree.py exists in the python/ directory, downloads from HackDB if missing
 * Returns relative path for Shell.Process.exec compatibility
 */
async function ensureNetTreeScript(cwd: string, ui: UI): Promise<string | null> {
  const pythonDir = `${cwd}/python`;
  const scriptPath = `${pythonDir}/net_tree.py`;
  const relativePath = `./python/net_tree.py`;

  // Check if script exists
  try {
    await FileSystem.ReadFile(scriptPath, { absolute: true });
    return relativePath; // Return relative path for execution
  } catch {
    // Script doesn't exist, download it
    ui.info("net_tree.py not found. Downloading from HackDB...");
  }

  // Ensure python directory exists
  try {
    await FileSystem.Mkdir(pythonDir, { recursive: true, absolute: true });
  } catch {
    // Directory might already exist
  }

  // Download from HackDB
  const hackdbTitle = HACKDB_SCRIPTS["net_tree.py"];
  if (!hackdbTitle) {
    ui.error("Unknown script: net_tree.py");
    return null;
  }

  try {
    await HackDB.DownloadExploit(hackdbTitle, pythonDir, { absolute: true });
    ui.success("net_tree.py downloaded successfully.");
    return relativePath; // Return relative path for execution
  } catch (err) {
    ui.error(`Failed to download net_tree.py: ${err}`);
    return null;
  }
}

/**
 * Runs net_tree.py on target IP and returns discovered nodes
 */
export async function runNetTree(
  targetIP: string,
  cwd: string,
  ui: UI,
  logger?: Logger
): Promise<NetworkNode[]> {
  ui.section("NET TREE DISCOVERY");
  ui.info(`Target: ${targetIP}`);

  // Ensure script is available
  const scriptPath = await ensureNetTreeScript(cwd, ui);
  if (!scriptPath) {
    ui.error("Cannot run net_tree without the script.");
    return [];
  }

  // Run net_tree.py
  ui.info("Launching net_tree — visualizing network topology...");
  ui.divider();

  try {
    await Shell.Process.exec(`python3 ${scriptPath} ${targetIP}`);
    logger?.log({
      type: "port",
      target: targetIP,
      status: "success",
      data: { module: "nettree", action: "launched" },
    });
  } catch (err) {
    ui.warn(`net_tree execution warning: ${err}`);
    // Continue even if there are warnings
  }

  ui.divider();
  ui.newLine();
  ui.info("Network tree displayed above.");
  ui.info("Enter the public IPs you discovered (comma-separated), or 'skip' to continue.");
  ui.print("  Example: 198.218.200.65, 165.67.183.7", "yellow");
  ui.newLine();

  // Prompt for discovered IPs
  const input = await prompt("IPs: ");
  if (!input || input.toLowerCase() === "skip" || input.toLowerCase() === "q") {
    ui.warn("No IPs entered — skipping network node enrichment.");
    return [];
  }

  // Parse and validate IPs
  const rawIPs = input.split(",").map((s) => s.trim()).filter((s) => s.length > 0);
  const validIPs: string[] = [];

  for (const raw of rawIPs) {
    if (Networking.IsIp(raw)) {
      if (!validIPs.includes(raw)) validIPs.push(raw);
    } else {
      ui.warn(`Skipping invalid IP: ${raw}`);
    }
  }

  if (!validIPs.length) {
    ui.warn("No valid IPs entered.");
    return [];
  }

  // Enrich each IP with subnet data
  ui.info(`Enriching ${validIPs.length} IP(s) with subnet data...`);
  ui.divider();

  const nodes: NetworkNode[] = [];

  for (const nodeIP of validIPs) {
    try {
      const subnet = await Networking.GetSubnet(nodeIP);
      if (subnet) {
        const node: NetworkNode = {
          ip: subnet.ip,
          lanIp: subnet.lanIp,
          type: (subnet as any).type || "UNKNOWN",
        };
        nodes.push(node);

        // Color by device type
        let typeColor = "cyan";
        if (node.type === "ROUTER" || node.type === "FIREWALL") typeColor = "red";
        else if (node.type === "PRINTER") typeColor = "yellow";
        else if (node.type === "SPLITTER") typeColor = "gray";

        ui.print(`  ${node.ip} (${node.lanIp}) — ${node.type}`, typeColor as any);
      } else {
        ui.warn(`  ${nodeIP} — GetSubnet returned null`);
        nodes.push({ ip: nodeIP, lanIp: "?", type: "UNKNOWN" });
      }
    } catch {
      ui.warn(`  ${nodeIP} — GetSubnet failed`);
      nodes.push({ ip: nodeIP, lanIp: "?", type: "UNKNOWN" });
    }
  }

  ui.divider();
  ui.success(`Discovered ${nodes.length} network node(s).`);

  logger?.log({
    type: "port",
    target: targetIP,
    status: "success",
    data: { module: "nettree", nodes: nodes.length, discoveredIPs: validIPs },
  });

  return nodes;
}
