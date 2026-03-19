/**
 * fullpipeline
 * @app-description OMNI full attack pipeline — chains all modules for automated end-to-end attack.
 */

import { Sora } from "../lib/sora";
import { config, PortInfo, DOMAIN_RE } from "../lib/config";
import { safeExec, log } from "../lib/utils";
import { nettreePipeline, NetworkNode } from "./nettree";
import { subfinderScan, mxLookup, geoipLookup, nucleiScan } from "./recon";
import { brutePipeline, getBrutablePorts } from "./brute";
import { postExploitPipeline } from "./postexploit";
import { crackPipeline } from "./crack";
import { saveProfile, loadProfile, TargetProfile } from "./profile";

const out = Sora.ctx();

const FULL_ART = ">> FULL PIPELINE <<";

// Callbacks to avoid circular imports with ip.ts, domain.ts, exploit.ts
export interface FullPipelineOptions {
  onIPRecon: (ip: string, seen: Set<string>) => Promise<void>;
  onDomainRecon: (domain: string, seen: Set<string>) => Promise<void>;
  onExploit: (ip: string, ports: PortInfo[], localIP: string) => Promise<void>;
}

export async function fullPipeline(
  target: string,
  seen: Set<string>,
  localIP: string,
  opts: FullPipelineOptions,
): Promise<void> {
  out.print(FULL_ART, out.colors.red);
  out.info("FULL ATTACK PIPELINE");
  out.warn("This will run every available module against the target.");
  out.divider();

  await log(`FullPipeline: starting against ${target}`);

  const profile: TargetProfile = (await loadProfile(target)) || {
    target,
    type: "full-pipeline",
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    ips: [],
    ports: [],
    emails: [],
    social: [],
    hashes: [],
    notes: [],
    wifiCracks: [],
  };

  let primaryIP = target;
  let domain: string | null = null;

  // ── Phase 1: Resolve target ──

  out.section("PHASE 1: TARGET RESOLUTION");

  if (Networking.IsIp(target)) {
    out.info(`Target is an IP: ${target}`);
    if (profile.ips.indexOf(target) === -1) profile.ips.push(target);
  } else if (DOMAIN_RE.test(target)) {
    domain = target;
    out.info(`Target is a domain: ${target}`);
    out.info("Running dig...");
    await safeExec(`dig ${target}`);
    out.info("Domain resolved — check dig output above.");
    if (profile.ips.indexOf(target) === -1) profile.ips.push(target);
  } else {
    out.error(`Cannot determine target type for: ${target}`);
    return;
  }

  // ── Phase 2: Network Discovery ──

  out.section("PHASE 2: NETWORK DISCOVERY");
  const networkNodes = await nettreePipeline(primaryIP);
  for (const node of networkNodes) {
    if (profile.ips.indexOf(node.ip) === -1) profile.ips.push(node.ip);
    profile.notes.push(`NetTree: ${node.ip} (${node.lanIp}) — ${node.type}`);
  }

  // ── Phase 3: Extended Recon ──

  out.section("PHASE 3: EXTENDED RECON");

  // GeoIP
  const geo = await geoipLookup(primaryIP);
  for (const ip of geo.ips) { if (profile.ips.indexOf(ip) === -1) profile.ips.push(ip); }
  if (geo.raw) profile.notes.push(`GeoIP: ${geo.raw.substring(0, 200)}`);

  // Subdomain enumeration (if domain)
  if (domain) {
    const subs = await subfinderScan(domain);
    for (const sub of subs) profile.notes.push(`Subdomain: ${sub}`);

    // MX lookup
    const mxIPs = await mxLookup(domain);
    for (const ip of mxIPs) { if (profile.ips.indexOf(ip) === -1) profile.ips.push(ip); }
  }

  // ── Phase 4: Port Scan ──

  out.section("PHASE 4: PORT SCAN & SERVICE DETECTION");
  out.info(`Scanning ${primaryIP}...`);

  const subnet = await Networking.GetSubnet(primaryIP);
  const ports: PortInfo[] = [];

  if (subnet) {
    const type = (subnet as any).type;
    out.info(`Device type: ${type}`);
    profile.type = type;

    if (type !== "ROUTER" && type !== "SPLITTER") {
      const portNumbers = await subnet.GetPorts();
      const portResults = await Promise.all(
        portNumbers.map(async (pn) => {
          const [pd, open] = await Promise.all([subnet.GetPortData(pn), subnet.PingPort(pn)]);
          return { pn, pd, open };
        })
      );

      for (const { pn, pd, open } of portResults) {
        if (!pd) continue;
        let svc = pd.service || "unknown", ver = pd.version || "unknown";
        const isForwarded = open && Number.isFinite(pd.internal) && pd.external !== pd.internal;
        if (ver.includes(" ")) { const p = ver.split(" "); svc = p[0]; ver = p[1]; }
        const pi: PortInfo = { port: pn, service: svc, version: ver, isOpen: open && !isForwarded, filtered: isForwarded };
        ports.push(pi);
        profile.ports.push({ port: pn, service: svc, version: ver, state: pi.isOpen ? "OPEN" : pi.filtered ? "FORWARDED" : "CLOSED" });
      }

      if (ports.length) {
        out.success(`Found ${ports.length} port(s).`);
        for (const p of ports) {
          const state = p.isOpen ? "OPEN" : p.filtered ? "FORWARDED" : "CLOSED";
          out.print(`  ${p.port} ${state} ${p.service} ${p.version}`, p.isOpen ? out.colors.green : out.colors.gray);
        }
      }
    } else {
      out.info(`${type} — skipping port scan.`);
    }
  } else {
    out.warn("GetSubnet returned null — skipping API port scan.");
  }

  // Nmap verification
  out.info("Running nmap verification...");
  await safeExec(`nmap ${primaryIP} -sV`);

  // ── Phase 5: Vulnerability Scan ──

  out.section("PHASE 5: VULNERABILITY SCAN");
  const nucleiTargets = [primaryIP];
  if (domain) nucleiTargets.push(domain);
  const vulnResults = await nucleiScan(nucleiTargets);
  if (vulnResults) profile.notes.push(`Nuclei: ${vulnResults.substring(0, 500)}`);

  // ── Phase 6: Brute Force ──

  out.section("PHASE 6: BRUTE FORCE");
  const openPorts = ports.filter(p => p.isOpen);
  if (openPorts.length) {
    const creds = await brutePipeline(primaryIP, openPorts);
    for (const c of creds) profile.notes.push(`Creds: ${c}`);
  } else {
    out.warn("No open ports for brute force.");
  }

  // ── Phase 7: Exploitation ──

  out.section("PHASE 7: EXPLOITATION");
  if (openPorts.length) {
    await opts.onExploit(primaryIP, openPorts, localIP);

    // ── Phase 8: Post-Exploitation ──
    out.section("PHASE 8: POST-EXPLOITATION");
    const hashes = await postExploitPipeline(primaryIP);
    for (const h of hashes) {
      if (profile.hashes.indexOf(h) === -1) profile.hashes.push(h);
    }

    // Crack extracted hashes
    if (hashes.length) {
      out.section("PHASE 8b: CRACKING EXTRACTED HASHES");
      for (const h of hashes) {
        await crackPipeline(h);
      }
    }
  } else {
    out.warn("No open ports for exploitation.");
  }

  // ── Phase 9: Save Profile ──

  out.section("PHASE 9: SAVE RESULTS");
  await saveProfile(profile);

  // ── Phase 10: Cascade to discovered network nodes ──

  if (networkNodes.length) {
    out.section("PHASE 10: CASCADE NETWORK ATTACK");
    const attackable = networkNodes.filter(n => n.type === "DEVICE" && n.ip !== primaryIP);
    if (attackable.length) {
      out.info(`${attackable.length} device(s) discovered on network.`);

      let cascade = "Y";
      if (!config.autoMode) {
        attackable.forEach((n, i) => out.print(`  ${i}) ${n.ip} (${n.type})`, out.colors.cyan));
        cascade = await out.promptText("Attack all discovered devices? (Y/N): ");
      }

      if (cascade.toUpperCase() === "Y") {
        for (const node of attackable) {
          if (seen.has(`ip:${node.ip}`)) continue;
          out.newLine();
          out.divider("=");
          out.info(`CASCADE: Attacking ${node.ip} (${node.type})`);
          out.divider("=");
          await opts.onIPRecon(node.ip, seen);
        }
      }
    }
  }

  out.newLine();
  out.divider("=");
  out.success("FULL ATTACK PIPELINE COMPLETE");
  out.divider("=");
  await log(`FullPipeline: complete for ${target}`);
}
