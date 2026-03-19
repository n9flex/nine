/**
 * ip
 * @app-description OMNI IP pipeline — deep recon, port scanning, and auto-exploitation.
 */

import { Sora } from "../lib/sora";
import { PortInfo, DOMAIN_RE } from "../lib/config";
import { safeExec, log, ensureScript } from "../lib/utils";
import { autoExploit, reverseTCP, routerHandler, firewallHandler, printerHandler } from "./exploit";
import { brutePipeline, getBrutablePorts } from "./brute";
import { postExploitPipeline } from "./postexploit";
import { crackPipeline } from "./crack";

const out = Sora.ctx();

const IP_ART = ">> IP RECON <<";

// ── Private module state ──
let localIP = "192.168.1.2";
let netTreeRan = false;

export function initLocalIP(ip: string): void { localIP = ip; }
export function getLocalIP(): string { return localIP; }

// ── Port table display ──

function printPortTable(ports: PortInfo[]): void {
  out.newLine();
  out.printTable(
    ports.map((p, i) => ({
      ID: i + 1,
      Status: p.isOpen ? "OPEN" : p.filtered ? "FORWARDED" : "CLOSED",
      Port: p.port,
      Service: (p.service || "?").substring(0, 15),
      Version: p.version || "?",
    })),
    {
      headerColor: out.colors.gray,
      columnColors: {
        Status: (value) => {
          if (value === "OPEN") return out.colors.green;
          if (value === "FORWARDED") return out.colors.yellow;
          return out.colors.red;
        },
      },
    },
  );
  out.divider();
  const o = ports.filter(p => p.isOpen).length;
  const f = ports.filter(p => p.filtered).length;
  const c = ports.length - o - f;
  out.info(`Open: ${o}  Forwarded: ${f}  Closed: ${c}`);
}

// ── Main IP Pipeline ──

export async function ipPipeline(ip: string, seen: Set<string>, autoMode?: boolean): Promise<void> {
  const ipKey = `ip:${ip}`;
  if (seen.has(ipKey)) { out.info(`Already scanned IP ${ip} — skipping.`); return; }
  seen.add(ipKey);
  const auto = autoMode || false;

  out.print(IP_ART, out.colors.cyan);
  out.info(`Starting deep recon on ${ip}...`);
  out.divider();

  if (!netTreeRan) {
    const cwd = await FileSystem.cwd();
    if (await ensureScript("net_tree.py", cwd.absolutePath)) {
      out.info("Running net_tree...");
      await safeExec(`python3 ./net_tree.py ${ip}`);
    }
    netTreeRan = true;
  }

  out.info("Running geoip...");
  await safeExec(`geoip ${ip}`);

  const cwdForEnum = await FileSystem.cwd();
  if (await ensureScript("pyUserEnum.py", cwdForEnum.absolutePath)) {
    out.info("Running pyUserEnum...");
    await safeExec(`python3 ./pyUserEnum.py ${ip}`);
  }

  await safeExec(`whois ${ip}`);
  await safeExec(`dig ${ip}`);

  // NTLM check
  try {
    if (await NTLM.Check(ip)) {
      out.success("NTLM supported on server.");
      const savedCwd = await FileSystem.cwd();
      await FileSystem.SetPath("/", { absolute: true });
      await safeExec(`node /ntlm-hack-tool/ntlm-hack.ts ${ip}`);
      await FileSystem.SetPath(savedCwd.absolutePath, { absolute: true });
    }
  } catch {}

  // Subnet
  out.info("Retrieving subnet...");
  const subnet = await Networking.GetSubnet(ip);
  if (!subnet) { out.error("Subnet unreachable."); return; }
  out.success(`Subnet: ${subnet.ip}/${subnet.lanIp}`);

  const type = (subnet as any).type;

  if (type === "ROUTER") { await routerHandler(ip); return; }
  if (type === "FIREWALL") { await firewallHandler(ip); return; }

  // Port scan
  out.info("Scanning ports...");
  const portNumbers = await subnet.GetPorts();

  if (type === "PRINTER") { await printerHandler(ip, portNumbers); return; }

  if (!portNumbers.length) {
    out.warn("No ports found.");
    if (auto) {
      await reverseTCP(localIP);
    } else {
      const ans = await out.promptText("Try reverse TCP? (Y/N): ");
      if (ans === "Y") await reverseTCP(localIP);
    }
    return;
  }

  // Gather port data in parallel
  const portResults = await Promise.all(
    portNumbers.map(async (pn) => {
      const [pd, open] = await Promise.all([subnet.GetPortData(pn), subnet.PingPort(pn)]);
      return { pn, pd, open };
    })
  );

  const ports: PortInfo[] = [];
  for (const { pn, pd, open } of portResults) {
    if (!pd) continue;
    let svc = pd.service || "unknown", ver = pd.version || "unknown";
    const isForwarded = open && Number.isFinite(pd.internal) && pd.external !== pd.internal;
    if (ver.includes(" ")) { const p = ver.split(" "); svc = p[0]; ver = p[1]; }
    ports.push({ port: pn, service: svc, version: ver, isOpen: open && !isForwarded, filtered: isForwarded });
  }

  // Nmap scan (display output directly like deep.ts does)
  await safeExec(`nmap ${ip} -sV`);

  printPortTable(ports);
  const openPorts = ports.filter(p => p.isOpen);
  if (!openPorts.length) { out.warn("No open ports."); return; }

  // Exploit
  let exploitSuccess = false;
  if (auto) {
    exploitSuccess = await autoExploit(ip, openPorts, localIP, auto);
  } else {
    out.print("\n[?] Select port to exploit by ID (0 to exit):", out.colors.white);
    const choice = await out.promptText("PORT ID: ");
    const idx = parseInt(choice);
    if (isNaN(idx) || idx === 0) return;
    const target = ports[idx - 1];
    if (!target) { out.error("Invalid ID."); return; }
    if (!target.isOpen) { out.error(`Port ${target.port} is not open (${target.filtered ? "FORWARDED" : "CLOSED"}).`); return; }
    exploitSuccess = await autoExploit(ip, [target], localIP, auto);
  }

  // If exploit succeeded, we're already in — no need for brute force or post-exploitation
  if (exploitSuccess) return;

  // Brute force offer (only if exploit failed)
  const brutable = getBrutablePorts(openPorts);
  if (brutable.length) {
    const bruteAns = auto ? "Y" : await out.promptText("Run brute force on open services? (Y/N): ");
    if (bruteAns.toUpperCase() === "Y") {
      await brutePipeline(ip, openPorts);
    }
  }

}

// ── Multi-IP Pipeline ──

export async function multiIpPipeline(input: string, seen: Set<string>, autoMode?: boolean): Promise<void> {
  let targets: string[] = [];

  if (!input.includes(",")) {
    out.info(`Loading targets from: ${input}`);
    let content: string;
    try { content = await FileSystem.ReadFile(input); } catch { content = ""; }
    if (!content) { out.error(`Cannot read ${input}`); return; }
    targets = content.split("\n").map(l => l.trim()).filter(l => l.length > 0);
  } else {
    targets = input.split(",").map(t => t.trim()).filter(t => t.length > 0);
  }

  if (!targets.length) { out.error("No targets found."); return; }

  out.success(`Loaded ${targets.length} target(s):`);
  out.divider();
  targets.forEach((t, i) => out.print(`  ${i + 1}) ${t}`, out.colors.cyan));
  out.divider();

  for (let i = 0; i < targets.length; i++) {
    const t = targets[i];
    out.newLine();
    out.divider("=");
    out.print(`TARGET ${i + 1}/${targets.length}: ${t}`, out.colors.white);
    out.divider("=");

    if (Networking.IsIp(t)) {
      await ipPipeline(t, seen, autoMode);
    } else if (DOMAIN_RE.test(t)) {
      out.info(`Resolving domain: ${t}`);
      await safeExec(`dig ${t}`);
      // Try to resolve via Networking API
      try {
        const resolved = await Networking.Resolve(t);
        if (resolved && Networking.IsIp(resolved)) {
          out.success(`Resolved: ${t} → ${resolved}`);
          await ipPipeline(resolved, seen, autoMode);
        } else {
          out.warn(`"${t}" could not be resolved — skipping.`);
        }
      } catch {
        out.warn(`"${t}" could not be resolved — skipping.`);
      }
    } else {
      out.warn(`"${t}" is not a valid IP or domain — skipping.`);
    }
  }

  out.newLine();
  out.divider("=");
  out.success(`All ${targets.length} target(s) processed.`);
  out.divider("=");
}
