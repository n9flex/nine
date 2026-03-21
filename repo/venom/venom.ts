/**
 * venom
 * @app-description Automated Metasploit exploit runner. Scans open ports, searches for matching exploits, sets options automatically, and chains them against a target IP.
 */

import { Sora } from "./sora";

const out = Sora.ctx();
out.setBlockWidth(68);
out.setTableWidth(68);

const BANNER = String.raw`
⠀⠀⠀⠀⠀⠀⠀⠀⢀⣀⣤⠤⠶⠶⠶⠤⠤⣤⣀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⢀⣠⠶⠛⠉⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠙⠳⢦⣀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⣰⠟⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠙⢷⡄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⣰⠏⠀⢠⣶⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣤⡀⠀⠹⣆⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⢠⡏⠀⢠⠟⣧⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣿⢳⡄⠀⢹⡄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⣾⠀⠀⡞⠀⢸⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣰⠇⠀⢷⠀⠈⣇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⢠⡇⠀⢠⠇⠀⠀⠙⣆⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣰⠋⠀⠀⠸⡆⠀⣿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⢸⡇⠀⢸⠀⠀⠀⠀⠙⢦⡀⠀⠀⠀⠀⠀⠀⢀⡾⠃⠀⠀⠀⢰⠇⠀⣿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⢸⡇⠀⢸⠀⠀⠀⠀⠀⠀⠳⣄⣰⡄⢰⣄⣰⠋⠀⠀⠀⠀⠀⢸⡀⠀⣿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠘⡇⠀⢸⠀⠀⠀⠀⠀⠀⠀⠈⢹⡇⢸⠉⠁⠀⠀⠀⠀⠀⠀⠈⡇⠀⡟⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⢿⠀⠈⢧⡀⠀⠀⠀⠀⠀⠀⣾⠀⢸⣄⠀⠀⠀⠀⠀⠀⠀⡼⢁⢸⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⢸⠘⣆⠈⢧⠀⠀⠀⠀⣠⠴⠃⠀⠀⠙⢧⣀⠀⠀⠀⠀⡼⠀⡼⢸⡃⠀⠀⠀⠀⠀⢀⠀⠀⠀⠀
⠀⣾⠀⢸⣆⠘⠷⠤⠴⠚⣁⣀⣤⣤⣤⣄⣀⠉⠙⠲⠴⠚⢡⣾⠇⠘⡇⠀⠀⠀⠀⠀⠈⢷⣤⡀⠀
⠀⢹⣆⠈⣿⣷⣾⡖⣾⠻⣟⣾⣏⣻⣹⡟⡟⣿⢳⣶⣶⣾⣿⡟⠀⢰⡇⠀⠀⠀⠀⠀⠀⠘⣇⢻⡄
⠀⠀⠻⣄⢸⣿⡋⠹⠿⣿⣿⡿⢿⣿⡟⣿⢿⣿⡟⠹⠋⠙⡿⠁⣴⠟⠀⠀⠀⠀⠀⠀⠀⠀⣿⠀⣷
⠀⠀⠀⠹⣶⣿⣿⣄⠀⢻⣘⣦⣼⣿⣴⣿⣼⣼⣇⡀⣰⣿⠃⣴⠏⠀⠀⠀⠀⠀⠀⠀⢀⣴⠏⢀⡏
⠀⠀⠀⠀⠙⣿⢿⣿⣥⣾⠛⠉⠀⠀⠉⠙⢦⡀⠈⠙⢿⣇⣰⠃⠀⠀⠀⠀⣀⣀⡤⠶⠛⠁⢠⡾⠁
⠀⠀⠀⠀⠀⠘⣿⠻⣿⢻⣦⠀⢀⡀⠀⠀⠀⠙⠀⠀⠀⠹⣇⠀⠀⢀⣴⠟⠉⠀⠀⢀⣠⡼⠋⠀⠀
⠀⠀⠀⠀⠀⠀⠘⣿⢹⡾⢻⣇⣴⡿⠳⢦⣀⠀⠀⠀⠀⠀⠙⠳⠶⠛⠁⠀⠀⢀⡼⠋⠁⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠘⣿⠻⡎⢹⢿⣷⣶⣎⣿⣧⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⡾⠁⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠸⣆⠙⢾⣸⠙⡿⢿⣩⠏⢹⣦⣀⠀⠀⠀⠀⠀⢀⣴⠟⠁⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠹⣦⡀⠉⠉⠉⠉⠁⣰⠏⠀⠈⠉⠛⠒⠒⠛⠉⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠉⠓⠒⠒⠒⠋⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
`;



const args = Shell.GetArgs();

if (!args.length) {
  out.error("Usage: venom <ip>");
  throw "";
}

const target = args[0];

if (!Networking.IsIp(target)) {
  out.error(`Invalid IP address: ${target}`);
  throw "";
}

await main();

async function main() {
  printBanner();

  if (!checkLib("metasploit")) {
    out.warn("metasploit not found, installing...");
    const installed = await installLib("metasploit");
    if (!installed) { out.error("Failed to install metasploit."); throw ""; }
    out.success("metasploit installed.");
  }

  const allPorts = await scanPorts();

  if (!allPorts.length) {
    out.warn("No ports found. Aborting.");
    return;
  }

  printPortTable(allPorts);

  const openPorts = allPorts.filter(p => p.isOpen && !p.filtered);

  if (!openPorts.length) {
    out.warn("No open ports to exploit. Aborting.");
    return;
  }

  let exploit;
  try {
    exploit = await GetMetasploit();
  } catch (err) {
    out.error("Failed to initialize Metasploit. Make sure it's properly installed.");
    return;
  }

  for (const portInfo of openPorts) {
    out.printBlockTitle(`EXPLOITING PORT ${portInfo.port}`);
    out.kv({ Service: portInfo.service || "unknown", Version: portInfo.version || "unknown" });
    out.divider();

    if (!portInfo.service) {
      out.warn("No service detected — skipping.");
      continue;
    }

    const exploits = await exploit.Search(portInfo.service);

    if (!exploits.length) {
      out.warn(`No exploits found for "${portInfo.service}".`);
      continue;
    }

    out.success(`Found ${exploits.length} exploit(s) for "${portInfo.service}".`);
    out.newLine();

    for (const module of exploits) {
      await exploit.Use(module.name);

      const options = exploit.GetOptions();
      const filled  = await fillOptions(exploit, options, portInfo);

      if (!filled) {
        continue;
      }

      await exploit.Exploit();
      
      const response = await prompt("Did a shell open? (y/n): ");
      if (response && response.toLowerCase().startsWith("y")) {
        out.newLine();
        out.printBlockFooter();
        printPwned(target, portInfo.port, module.name, portInfo.service, portInfo.version);
        return;
      }
    }

  }
}

async function scanPorts() {
  out.printBlockTitle("PORT SCAN");
  out.info(`Target : ${target}`);
  out.divider();

  const subnet = await Networking.GetSubnet(target);
  if (!subnet) { out.error("Could not reach subnet."); throw ""; }

  out.info(`Subnet : ${subnet.ip} / ${subnet.lanIp}`);

  const portNumbers = await subnet.GetPorts();
  if (!portNumbers.length) { out.error("No ports found on subnet."); throw ""; }

  out.info(`Probing ${portNumbers.length} port(s)...`);
  out.newLine();

  const results = await Promise.all(
    portNumbers.map(async (portNumber) => {
      const [portData, isOpen] = await Promise.all([
        subnet.GetPortData(portNumber),
        subnet.PingPort(portNumber),
      ]);
      return { portData, isOpen, portNumber };
    })
  );

  const ports = [];

  for (const { portData, isOpen, portNumber } of results) {
    if (!portData) continue;

    const isForwarded =
      isOpen &&
      Number.isFinite(portData.internal) &&
      portData.external !== portData.internal;

    ports.push({
      port:     portNumber,
      service:  portData.service ?? "",
      version:  portData.version ?? "",
      isOpen:   isOpen && !isForwarded,
      filtered: isForwarded,
    });
  }

  out.printBlockFooter();
  return ports;
}

function printPortTable(ports) {
  out.printBlockTitle("RESULTS");

  out.tableFromArray(
    ["STATUS", "PORT", "SERVICE", "VERSION"],
    ports.map(p => [
      p.isOpen ? "OPEN" : p.filtered ? "FORWARDED" : "CLOSED",
      p.port,
      p.service || "unknown",
      p.version || "unknown",
    ]),
    {
      headerColor: out.colors.secondary,
      rowColor: (row) =>
        row.STATUS === "OPEN"     ? out.colors.success :
        row.STATUS === "FORWARDED" ? out.colors.warning :
                                    out.colors.error,
    }
  );

  out.divider();

  const openCount     = ports.filter(p => p.isOpen).length;
  const filteredCount = ports.filter(p => p.filtered).length;
  const closedCount   = ports.filter(p => !p.isOpen && !p.filtered).length;

  out.success(`Open: ${openCount}`);
  out.warn(`Filtered: ${filteredCount}`);
  out.error(`Closed: ${closedCount}`);

  out.printBlockFooter();
}

async function fillOptions(exploit, options, portInfo) {
  for (const option of options) {
    const { name, required } = option;

    switch (name) {
      case "RHOST":
        await exploit.SetOption("RHOST", target);
        break;

      case "RPORT":
        await exploit.SetOption("RPORT", String(portInfo.port));
        break;

      case "Version":
        await exploit.SetOption("Version", portInfo.version?.split(" ")[1] ?? "");
        break;

      default:
        const value = await out.promptTextValidated(`(${required ? "required" : "optional"}) ${name}: `, {
          required,
        });

        if (required && !value) {
          out.warn(`Required option "${name}" was not provided.`);
          return false;
        }

        if (value) await exploit.SetOption(name, value);
        break;
    }
  }

  return true;
}

function printPwned(ip, port, module, service, version) {
  out.printBlockTitle("ACCESS GRANTED");
  out.newLine();
  out.print("  ██████╗ ██╗    ██╗███╗   ██╗███████╗██████╗ ", out.colors.green);
  out.print("  ██╔══██╗██║    ██║████╗  ██║██╔════╝██╔══██╗", out.colors.green);
  out.print("  ██████╔╝██║ █╗ ██║██╔██╗ ██║█████╗  ██║  ██║", out.colors.green);
  out.print("  ██╔═══╝ ██║███╗██║██║╚██╗██║██╔══╝  ██║  ██║", out.colors.green);
  out.print("  ██║     ╚███╔███╔╝██║ ╚████║███████╗██████╔╝", out.colors.green);
  out.print("  ╚═╝      ╚══╝╚══╝ ╚═╝  ╚═══╝╚══════╝╚═════╝ ", out.colors.green);
  out.newLine();
  out.divider();
  out.printColumns("Target",  ip,      { rightColor: out.colors.cyan  });
  out.printColumns("Port",    String(port), { rightColor: out.colors.cyan  });
  out.printColumns("Service", service, { rightColor: out.colors.white });
  out.printColumns("Version", version, { rightColor: out.colors.white });
  out.printColumns("Module",  module,  { rightColor: out.colors.red   });
  out.divider();
  out.newLine();
  out.success("Shell session opened. You are in!");
  out.printBlockFooter();
}

function printBanner() {
  Shell.clear?.();
  out.print(BANNER, out.colors.red);
  out.newLine();
}
