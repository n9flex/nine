/**
 * scanx
 * @app-description Fast subnet port scanner with service detection. Scans all ports on a target IP, detects open, forwarded and closed ports, and displays results in a color-coded table.
 */

import { Sora } from "./sora";

const out = Sora.ctx();
out.setBlockWidth(68);
out.setTableWidth(68);

const BANNER = String.raw`
 ______     ______     ______     __   __     __  __    
/\  ___\   /\  ___\   /\  __ \   /\ "-.\ \   /\_\_\_\  
\ \___  \  \ \ \____  \ \  __ \  \ \ \-.  \  \/_/\/_/  
 \/\_____\  \ \_____\  \ \_\ \_\  \ \_\\"\_\   /\_\/\_\
  \/_____/   \/_____/   \/_/\/_/   \/_/ \/_/   \/_/\/_/`;

const args = Shell.GetArgs();

await main();

async function main() {
  const ip = parseArgs(args);
  if (!ip) return;

  if (!Networking.IsIp(ip)) {
    out.error(`Invalid IP: ${ip}`);
    return;
  }

  Shell.lock();

  try {
    Shell.clear?.();
    out.print(BANNER, out.colors.red);
    out.newLine();

    const subnet = await Networking.GetSubnet(ip);
    if (!subnet) {
      out.error(`Cannot connect to subnet: ${ip}`);
      return;
    }

    const portNumbers = await subnet.GetPorts();
    if (!portNumbers.length) {
      out.warn("No ports found.");
      return;
    }

    out.printBlockTitle("SCAN RESULTS");

    out.printColumns("Target", ip,                          { rightColor: out.colors.cyan });
    out.printColumns("Subnet", `${subnet.ip} / ${subnet.lanIp}`, { rightColor: out.colors.cyan });

    const router = await subnet.GetRouter();
    if (router) {
      out.printColumns("Router", `${router.ip} -> ${router.lanIp}`, { rightColor: out.colors.cyan });
    }

    out.printColumns("Ports", `${portNumbers.length} discovered`, { rightColor: out.colors.white });
    out.divider();

    const scanResults = await Promise.all(
      portNumbers.map(async (portNumber) => ({
        portData: await subnet.GetPortData(portNumber),
        isOpen:   await subnet.PingPort(portNumber),
      }))
    );

    const rows = [];
    let openCount     = 0;
    let filteredCount = 0;

    for (const { portData, isOpen } of scanResults) {
      if (!portData) continue;

      const isForwarded =
        isOpen &&
        Number.isFinite(portData.internal) &&
        portData.external !== portData.internal;

      const status = !isOpen      ? "CLOSED"
                   : isForwarded  ? "FORWARDED"
                   :                "OPEN";

      if (isOpen && !isForwarded) openCount++;
      if (isForwarded) filteredCount++;

      rows.push({
        Status:   status,
        Port:     portData.external,
        Target:   portData.target   || "N/A",
        Internal: portData.internal,
        Service:  portData.service  || "unknown",
        Version:  portData.version  || "unknown",
      });
    }

    out.printTable(rows, {
      headerColor: out.colors.secondary,
      rowColor: (row) =>
        row.Status === "OPEN"      ? out.colors.success :
        row.Status === "FORWARDED" ? out.colors.warning :
                                     out.colors.error,
    });

    out.divider();

    const closedCount = portNumbers.length - openCount - filteredCount;

    out.success(`Open: ${openCount}`);
    out.warn(`Forwarded: ${filteredCount}`);
    out.error(`Closed: ${closedCount}`);

    out.printBlockFooter();
  } finally {
    Shell.unlock();
  }
}

function parseArgs(args) {
  if (args.includes("-h") || args.includes("--help")) {
    out.info("Usage: scanx <ip>");
    return null;
  }
  const ip = args.find(arg => !arg.startsWith("-"));
  if (!ip) {
    out.info("Usage: scanx <ip>");
    return null;
  }
  return ip;
}
