/**
 * IP Scanner module
 */

import type { UI } from "../lib/ui";
import type { Logger } from "../lib/logger";

// Local color configuration - modify these to change scanner output colors
const COLORS = {
  // Labels (left column)
  label: "white",
  // Network elements
  target: "pink",
  subnetExternal: "pink",
  subnetInternal: "purple",
  router: "orange",
  // Data/counts
  ports: "purple",
  // Port statuses
  open: "green",
  forwarded: "orange",
  closed: "red",
} as const;

interface PortInfo {
  port: number;
  service: string;
  version: string;
  isOpen: boolean;
  isForwarded: boolean;
}

export async function scanIP(ip: string, logger: Logger, ui: UI): Promise<void> {
  // Get subnet
  ui.info("Resolving subnet...");
  const subnet = await Networking.GetSubnet(ip);
  if (!subnet) {
    ui.error("Subnet unreachable");
    logger.log({ type: "port", target: ip, status: "failure", data: { error: "No subnet" } });
    return;
  }

  // Get detailed port info
  ui.info("Scanning ports...");
  const portNumbers = await subnet.GetPorts();

  if (!portNumbers.length) {
    ui.warn("No ports found");
    return;
  }

  const ports: PortInfo[] = [];
  let openCount = 0;
  let forwardedCount = 0;

  for (const port of portNumbers) {
    const [portData, isOpen] = await Promise.all([
      subnet.GetPortData(port),
      subnet.PingPort(port),
    ]);

    if (portData) {
      const isForwarded = isOpen && Number.isFinite(portData.internal) && portData.external !== portData.internal;
      
      if (isOpen && !isForwarded) openCount++;
      if (isForwarded) forwardedCount++;

      ports.push({
        port,
        service: portData.service || "unknown",
        version: portData.version || "unknown",
        isOpen,
        isForwarded,
      });

      logger.logPort(port, portData.service || "unknown", portData.version || "unknown", isOpen);
    }
  }

  displayResults(ip, subnet, ports, openCount, forwardedCount, ui);
}

function displayResults(ip: string, subnet: any, ports: PortInfo[], openCount: number, forwardedCount: number, ui: UI): void {
  ui.printBlockTitle("SCAN RESULTS");

  // Metadata columns
  ui.printColumns("Target", ip, { leftColor: COLORS.label, rightColor: COLORS.target });
  
  // Subnet with dual color - external / internal
  ui.printSubnet("Subnet", subnet.ip, subnet.lanIp, {
    labelColor: COLORS.label,
    externalColor: COLORS.subnetExternal,
    internalColor: COLORS.subnetInternal,
    separatorColor: "gray",
  });

  const router = subnet.GetRouter ? subnet.GetRouter() : null;
  if (router) {
    ui.printColumns("Router", `${router.ip} -> ${router.lanIp}`, { leftColor: COLORS.label, rightColor: COLORS.router });
  }

  ui.printColumns("Ports", `${ports.length} discovered`, { leftColor: COLORS.label, rightColor: COLORS.ports });
  ui.divider();

  // Table with row colorization
  const rows = ports.map((p) => ({
    Status: p.isOpen ? (p.isForwarded ? "FORWARDED" : "OPEN") : "CLOSED",
    Port: p.port,
    Service: p.service || "unknown",
    Version: p.version || "unknown",
  }));

  ui.table(["Status", "Port", "Service", "Version"], rows, {
    rowColor: (row) => {
      if (row.Status === "OPEN") return COLORS.open;
      if (row.Status === "FORWARDED") return COLORS.forwarded;
      return COLORS.closed;
    },
  });

  ui.divider();

  // Summary counters
  const closedCount = ports.length - openCount - forwardedCount;
  ui.success(`Open: ${openCount}`);
  ui.warn(`Forwarded: ${forwardedCount}`);
  ui.error(`Closed: ${closedCount}`);

  ui.printBlockFooter();
}
