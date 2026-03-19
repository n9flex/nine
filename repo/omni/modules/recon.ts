/**
 * recon
 * @app-description OMNI extended recon — subfinder, mxlookup, geoip, nuclei.
 */

import { Sora } from "../lib/sora";
import { safeExec } from "../lib/utils";
import { IP_RE, DOMAIN_RE } from "../lib/config";

const out = Sora.ctx();

// ── Subdomain Enumeration ──

export async function subfinderScan(domain: string): Promise<string[]> {
  if (!DOMAIN_RE.test(domain)) {
    out.warn(`subfinder requires a domain, not an IP: ${domain}`);
    return [];
  }

  out.info(`Running subfinder on ${domain}...`);
  await safeExec(`subfinder -d ${domain}`);
  out.info("Subfinder output displayed above.");

  return [];
}

// ── Mail Server Lookup ──

export async function mxLookup(domain: string): Promise<string[]> {
  if (!DOMAIN_RE.test(domain)) {
    out.warn(`mxlookup requires a domain: ${domain}`);
    return [];
  }

  out.info(`Running mxlookup on ${domain}...`);
  await safeExec(`mxlookup ${domain}`);
  out.info("MX lookup output displayed above.");

  return [];
}

// ── GeoIP ──

export interface GeoInfo {
  raw: string;
  ips: string[];
}

export async function geoipLookup(ip: string): Promise<GeoInfo> {
  out.info(`Running geoip on ${ip}...`);
  await safeExec(`geoip ${ip}`);
  out.info("GeoIP output displayed above.");

  return { raw: "", ips: [] };
}

// ── Nuclei Vulnerability Scan ──

export async function nucleiScan(targets: string[]): Promise<string> {
  if (!targets.length) { out.warn("No targets for nuclei."); return ""; }

  out.info("Preparing nuclei scan...");

  const hostsFile = `temp/omni_nuclei_hosts_${Date.now()}.txt`;
  const content = targets.join("\n");
  try {
    await FileSystem.WriteFile(hostsFile, content, { absolute: false });
  } catch {
    out.error("Could not write hosts file for nuclei.");
    return "";
  }

  out.info(`Running nuclei on ${targets.length} target(s)...`);
  out.warn("This may take a while...");

  await safeExec(`nuclei -h ${hostsFile}`);
  await FileSystem.Remove(hostsFile).catch(() => {});

  out.info("Nuclei output displayed above.");

  return "";
}
