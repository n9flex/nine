/**
 * brute
 * @app-description OMNI brute force module — hydra automation for login cracking.
 */

import { Sora } from "../lib/sora";
import { safeExec, ensureScript } from "../lib/utils";
import { config, PortInfo } from "../lib/config";

const out = Sora.ctx();

const BRUTE_ART = ">> BRUTE FORCE <<";

const BRUTABLE = ["ssh", "ftp", "http", "imap", "smtp", "pop3", "telnet", "rdp", "mysql"];

// Map game service names to hydra protocol names
function toHydraProtocol(service: string): string {
  const svc = service.toLowerCase();
  if (svc.includes("ssh") || svc.includes("openssh")) return "ssh";
  if (svc.includes("ftp") || svc.includes("vsftpd")) return "ftp";
  if (svc.includes("telnet")) return "telnet";
  if (svc.includes("imap") || svc.includes("courier")) return "imap";
  if (svc.includes("pop3") || svc.includes("dovecot")) return "pop3";
  if (svc.includes("smtp") || svc.includes("postfix")) return "smtp";
  if (svc.includes("rdp") || svc.includes("freerdp")) return "rdp";
  if (svc.includes("mysql") || svc.includes("mariadb")) return "mysql";
  if (svc.includes("https")) return "https-get";
  if (svc.includes("http") || svc.includes("apache")) return "http-get";
  return svc;
}

export function getBrutablePorts(ports: PortInfo[]): PortInfo[] {
  return ports.filter(p => p.isOpen && BRUTABLE.some(s => p.service.toLowerCase().includes(s)));
}

export async function brutePipeline(ip: string, ports: PortInfo[]): Promise<string[]> {
  out.print(BRUTE_ART, out.colors.cyan);
  out.info("Brute Force Pipeline (Hydra)");
  out.divider();

  const targets = getBrutablePorts(ports);
  if (!targets.length) {
    out.warn("No brutable services found (need SSH, FTP, HTTP, IMAP, etc.).");
    return [];
  }

  out.success(`Found ${targets.length} brutable service(s):`);
  targets.forEach((t, i) => {
    out.print(`  ${i}) ${t.service} on port ${t.port}`, out.colors.cyan);
  });
  out.divider();

  const wordlist = "wordlist.lst";
  const username = "admin";
  out.info(`Using wordlist: ${wordlist}`);
  out.info(`Using username: ${username}`);

  // Ensure wordlist is available
  if (wordlist === "wordlist.lst") {
    const cwd = await FileSystem.cwd();
    if (!await ensureScript("wordlist.lst", cwd.absolutePath)) return [];
  }

  for (const target of targets) {
    out.newLine();
    out.info(`BRUTE FORCING: ${target.service} on ${ip}:${target.port}`);

    const protocol = toHydraProtocol(target.service);
    out.warn("Running hydra (this may take a while)...");
    out.print(`  hydra -l ${username} -P ${wordlist} -s ${target.port} ${ip} ${protocol}`, out.colors.gray);
    await safeExec(`hydra -l ${username} -P ${wordlist} -s ${target.port} ${ip} ${protocol}`);
  }

  out.newLine();
  out.success("Brute force complete — check hydra output above for credentials.");

  return [];
}
