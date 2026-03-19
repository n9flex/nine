/**
 * nettree
 * @app-description OMNI network tree discovery — visual net_tree + manual IP entry + subnet API enrichment.
 */

import { Sora } from "../lib/sora";
import { safeExec, log, ensureScript } from "../lib/utils";
import { IP_RE } from "../lib/config";

const out = Sora.ctx();

const NETTREE_ART = ">> NET TREE <<";

export interface NetworkNode {
  ip: string;
  lanIp: string;
  type: string;
}

export async function nettreePipeline(ip: string): Promise<NetworkNode[]> {
  out.print(NETTREE_ART, out.colors.cyan);
  out.info("Network Tree Discovery");
  out.divider();

  // Step 1: Ensure net_tree.py exists, then run it
  const cwd = await FileSystem.cwd();
  if (!await ensureScript("net_tree.py", cwd.absolutePath)) {
    out.error("Cannot run net_tree without the script.");
    return [];
  }
  out.info("Launching net_tree — review the network map...");
  await safeExec(`python3 ./net_tree.py ${ip}`);
  await log(`NetTree: launched net_tree for ${ip}`);

  out.newLine();
  out.divider();
  out.info("The network tree is displayed above.");
  out.info("Enter the public IPs you see (comma-separated), or 'q' to skip.");
  out.print("  Example: 198.218.200.65,165.67.183.7,69.30.247.13", out.colors.gray);
  out.newLine();

  const input = await out.promptText("IPs: ");
  if (!input || input.toLowerCase() === "q") {
    out.warn("No IPs entered — skipping network discovery.");
    return [];
  }

  const rawIPs = input.split(",").map(s => s.trim()).filter(s => s.length > 0);
  const validIPs: string[] = [];
  for (const raw of rawIPs) {
    if (Networking.IsIp(raw)) {
      if (validIPs.indexOf(raw) === -1) validIPs.push(raw);
    } else {
      out.warn(`Skipping invalid IP: ${raw}`);
    }
  }

  if (!validIPs.length) {
    out.warn("No valid IPs entered.");
    return [];
  }

  // Step 2: Enrich each IP with GetSubnet data
  out.info(`Enriching ${validIPs.length} IP(s) with subnet data...`);
  out.divider();

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

        const typeColor = node.type === "ROUTER" ? out.colors.red
          : node.type === "PRINTER" ? out.colors.yellow
          : node.type === "FIREWALL" ? out.colors.red
          : node.type === "SPLITTER" ? out.colors.gray
          : out.colors.cyan;

        out.print(`  ${node.ip} (${node.lanIp}) — ${node.type}`, typeColor);
      } else {
        out.warn(`  ${nodeIP} — GetSubnet returned null`);
        nodes.push({ ip: nodeIP, lanIp: "?", type: "UNKNOWN" });
      }
    } catch {
      out.warn(`  ${nodeIP} — GetSubnet failed`);
      nodes.push({ ip: nodeIP, lanIp: "?", type: "UNKNOWN" });
    }
  }

  out.divider();
  out.success(`Discovered ${nodes.length} network node(s).`);
  await log(`NetTree: discovered ${nodes.length} nodes`);

  return nodes;
}
