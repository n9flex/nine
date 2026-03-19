/**
 * lynx
 * @app-description OMNI LynxHarvest — recursive OSINT engine with chaining.
 */

import { Sora } from "../lib/sora";
import {
  config, IP_RE, EMAIL_RE, PHONE_RE, HANDLE_RE, URL_RE,
  ScanResult, HarvestReport,
} from "../lib/config";
import { pushUniq, safeExec, requireTool } from "../lib/utils";

const out = Sora.ctx();

const LYNX_ART = ">> LYNX OSINT <<";

const HARVEST_ART = ">> HARVEST COMPLETE <<";

// ── Chaining callback types ──
type PipelineFn = (target: string, seen: Set<string>) => Promise<void>;

export interface LynxOptions {
  onChainIP?: PipelineFn;
  onChainEmail?: PipelineFn;
}

// ── Main Pipeline ──

export async function lynxPipeline(
  term: string,
  seen: Set<string>,
  options: LynxOptions = {},
): Promise<void> {
  await requireTool("lynx");

  out.print(LYNX_ART, out.colors.magenta);
  out.info("LynxHarvest — Recursive OSINT Engine");
  out.info(`Seed query: ${term}`);
  out.info(`Max depth : ${config.harvestDepth}`);
  out.divider();

  const report: HarvestReport = { results: [], allIPs: [], allEmails: [], allSocial: [] };

  await recursiveHarvest(term, 0, report, seen);

  // Final report
  out.newLine();
  out.divider();
  out.print(HARVEST_ART, out.colors.green);
  out.divider();

  out.success(`HARVEST COMPLETE — ${report.results.length} queries scanned`);
  out.divider();

  for (const r of report.results) {
    const total = r.social.length + r.contact.length + r.ip.length + r.address.length + r.additional.length;
    if (total === 0) continue;
    out.print(`\n  ┌─ QUERY: ${r.query}`, out.colors.orange);
    if (r.social.length) { out.print(`  │  [SOCIAL]`, out.colors.magenta); for (const s of r.social) out.print(`  │    ${s}`, out.colors.cyan); }
    if (r.contact.length) { out.print(`  │  [CONTACT]`, out.colors.magenta); for (const s of r.contact) out.print(`  │    ${s}`, out.colors.cyan); }
    if (r.ip.length) { out.print(`  │  [IP]`, out.colors.magenta); for (const s of r.ip) out.print(`  │    ${s}`, out.colors.cyan); }
    if (r.address.length) { out.print(`  │  [ADDRESS]`, out.colors.magenta); for (const s of r.address) out.print(`  │    ${s}`, out.colors.cyan); }
    if (r.additional.length) { out.print(`  │  [ADDITIONAL]`, out.colors.magenta); for (const s of r.additional) out.print(`  │    ${s}`, out.colors.cyan); }
    out.print(`  └─`, out.colors.orange);
  }

  out.divider();
  out.success("AGGREGATED UNIQUE FINDINGS:");
  out.divider();
  if (report.allSocial.length) { out.print(`  Social Handles (${report.allSocial.length}):`, out.colors.magenta); for (const s of report.allSocial) out.print(`    ${s}`, out.colors.cyan); }
  if (report.allEmails.length) { out.print(`  Emails (${report.allEmails.length}):`, out.colors.magenta); for (const s of report.allEmails) out.print(`    ${s}`, out.colors.cyan); }
  if (report.allIPs.length) { out.print(`  IP Addresses (${report.allIPs.length}):`, out.colors.magenta); for (const s of report.allIPs) out.print(`    ${s}`, out.colors.cyan); }
  out.divider();

  await saveHarvestReport(report);
  await offerChaining(report, seen, options);
}

// ── Recursive Harvest ──

async function recursiveHarvest(
  query: string,
  depth: number,
  report: HarvestReport,
  seen: Set<string>,
): Promise<void> {
  const key = query.trim().toLowerCase();
  if (seen.has(key)) { out.info(`Already scanned: ${query} — skipping.`); return; }
  if (depth > config.harvestDepth) return;
  seen.add(key);

  const indent = "  ".repeat(depth);
  out.print(`\n${indent}[*] [Depth ${depth}/${config.harvestDepth}] Scanning: ${query}`, depth === 0 ? out.colors.cyan : out.colors.gray);

  const tmp = `temp/omni_harvest_${Date.now()}.txt`;
  try {
    await Shell.Process.exec(`lynx ${query} > ${tmp}`);
  } catch {
    out.error(`${indent}    Lynx failed for: ${query}`);
    return;
  }

  let raw: string;
  try {
    raw = String(await FileSystem.ReadFile(tmp));
  } catch {
    out.error(`${indent}    Could not read output for: ${query}`);
    return;
  }
  await FileSystem.Remove(tmp).catch(() => {});

  if (!raw || !raw.trim()) { out.warn(`${indent}    No results.`); return; }

  const parsed = parseLynxOutput(raw, query);
  report.results.push(parsed);

  pushUniq(report.allSocial, parsed.social);
  pushUniq(report.allIPs, parsed.ip);

  const emails = parsed.contact.filter(c => EMAIL_RE.test(c));
  pushUniq(report.allEmails, emails);

  const total = parsed.social.length + parsed.contact.length + parsed.ip.length + parsed.address.length + parsed.additional.length;
  out.success(`${indent}    Found ${total} item(s) for: ${query}`);

  if (depth >= config.harvestDepth) {
    out.info(`${indent}    Max depth reached.`);
    return;
  }

  // Chain into discovered targets
  const nextTargets: string[] = [];
  pushUniq(nextTargets, parsed.social);
  pushUniq(nextTargets, emails);

  for (const t of nextTargets) {
    await recursiveHarvest(t, depth + 1, report, seen);
  }
}

// ── Lynx Output Parser ──

function parseLynxOutput(raw: string, q: string): ScanResult {
  type Section = "social" | "contact" | "ip" | "address" | "additional";
  const HEADERS: Array<{ re: RegExp; s: Section }> = [
    { re: /Scanning social media platforms\.\.\./i, s: "social" },
    { re: /Searching for contact information\.\.\./i, s: "contact" },
    { re: /Checking for IP address activity\.\.\./i, s: "ip" },
    { re: /Locating physical address\.\.\./i, s: "address" },
    { re: /Searching web for additional information\.\.\./i, s: "additional" },
  ];
  const NO_DATA = /^No data found\.\s*$/i;
  const res: ScanResult = { query: q, social: [], contact: [], ip: [], address: [], additional: [] };
  const lines = raw.split("\n").map(l => l.replace(/\r/g, ""));
  let cur: Section | null = null, buf: string[] = [];

  const clean = (b: string[]) => b.map(l => l.trim()).filter(l => l && !l.includes("..."));

  const extract = (ls: string[], re: RegExp): string[] => {
    const found: string[] = [];
    for (const l of ls) {
      if (NO_DATA.test(l)) continue;
      const m = l.match(re);
      if (m) for (const x of m) {
        const c = x.replace(/[),.;:]+$/g, "");
        if (c && found.indexOf(c) === -1) found.push(c);
      }
    }
    return found;
  };

  const flush = () => {
    if (!cur) { buf = []; return; }
    const c = clean(buf); buf = [];
    if (!c.length || NO_DATA.test(c.join("\n").trim())) return;

    switch (cur) {
      case "social":
        pushUniq(res.social, extract(c, HANDLE_RE));
        break;
      case "contact":
        pushUniq(res.contact, extract(c, EMAIL_RE));
        pushUniq(res.contact, extract(c, PHONE_RE));
        for (const l of c) {
          if (NO_DATA.test(l)) continue;
          if (l.match(EMAIL_RE) || l.match(PHONE_RE)) continue;
          const v = l.replace(/[),.;:]+$/g, "").trim();
          if (v && res.contact.indexOf(v) === -1) res.contact.push(v);
        }
        break;
      case "ip":
        pushUniq(res.ip, extract(c, IP_RE));
        break;
      case "address":
        for (const l of c) {
          const v = l.trim();
          if (v && !NO_DATA.test(v) && res.address.indexOf(v) === -1) res.address.push(v);
        }
        break;
      case "additional":
        pushUniq(res.additional, extract(c, URL_RE));
        for (const l of c) {
          if (NO_DATA.test(l)) continue;
          const v = l.trim();
          if (!v || v.endsWith(":") || v.includes("Version:")) continue;
          if (res.additional.indexOf(v) === -1) res.additional.push(v);
        }
        break;
    }
  };

  for (const rawLine of lines) {
    const l = rawLine.trim();
    const hdr = HEADERS.find(h => h.re.test(l));
    if (hdr) { flush(); cur = hdr.s; continue; }
    if (!cur) continue;
    if (!l.length) { flush(); continue; }
    buf.push(rawLine);
  }
  flush();
  return res;
}

// ── Lynx Scan Targets (used by file.ts) ──

export async function lynxScanTargets(targets: string[], force = false): Promise<void> {
  let go = "1";
  if (!force) {
    out.section("SCAN WITH LYNX?");
    out.list(["Yes", "No", "Exit"], { color: out.colors.gray });
    go = await out.promptText("SELECT [1/2/0]: ");
  }
  if (go === "0" || go === "2") return;

  await requireTool("lynx");

  for (let i = 0; i < targets.length; i++) {
    const t = targets[i];
    out.info(`Lynx ${i + 1}/${targets.length}: ${t}`);
    await safeExec(`lynx ${t}`);
    out.success("OK");
  }

  out.success("Lynx scan complete — results displayed above.");
}

// ── Report Save ──

async function saveHarvestReport(report: HarvestReport): Promise<void> {
  const outFile = "omni-harvest.txt";
  const lines: string[] = [
    "═══════════════════════════════════════════════════",
    "  OMNI v2.0 — LynxHarvest Report",
    `  Generated: ${new Date().toISOString()}`,
    `  Queries scanned: ${report.results.length}`,
    "═══════════════════════════════════════════════════",
    "",
  ];

  if (report.allSocial.length) { lines.push("[SOCIAL HANDLES]"); for (const s of report.allSocial) lines.push(`  ${s}`); lines.push(""); }
  if (report.allEmails.length) { lines.push("[EMAILS]"); for (const s of report.allEmails) lines.push(`  ${s}`); lines.push(""); }
  if (report.allIPs.length) { lines.push("[IP ADDRESSES]"); for (const s of report.allIPs) lines.push(`  ${s}`); lines.push(""); }

  lines.push("═══════════════════════════════════════════════════");
  lines.push("  PER-QUERY BREAKDOWN");
  lines.push("═══════════════════════════════════════════════════");
  lines.push("");

  for (const r of report.results) {
    lines.push(`--- QUERY: ${r.query} ---`);
    if (r.social.length) lines.push("  Social: " + r.social.join(", "));
    if (r.contact.length) lines.push("  Contact: " + r.contact.join(", "));
    if (r.ip.length) lines.push("  IP: " + r.ip.join(", "));
    if (r.address.length) lines.push("  Address: " + r.address.join(", "));
    if (r.additional.length) lines.push("  Additional: " + r.additional.join(", "));
    lines.push("");
  }

  try {
    await FileSystem.WriteFile(outFile, lines.join("\n"), { absolute: false });
    out.success(`Report saved to ${outFile}`);
  } catch {
    out.error(`Could not save report to ${outFile}`);
  }
}

// ── Chaining ──

async function offerChaining(
  report: HarvestReport,
  seen: Set<string>,
  options: LynxOptions,
): Promise<void> {
  if (!report.allIPs.length && !report.allEmails.length) return;

  out.section("CHAINING OPTIONS");

  const opts: string[] = [];
  if (report.allIPs.length) {
    out.print(`  1) Run IP recon + exploit on discovered IPs (${report.allIPs.length} found)`, out.colors.cyan);
    opts.push("1");
  }
  if (report.allEmails.length) {
    out.print(`  2) Run email recon on discovered emails (${report.allEmails.length} found)`, out.colors.cyan);
    opts.push("2");
  }
  out.print(`  0) Done — exit`, out.colors.gray);
  out.divider();

  const choice = await out.promptText(`SELECT [${opts.join("/")}/0]: `);

  if (choice === "1" && report.allIPs.length && options.onChainIP) {
    if (config.autoMode) {
      out.info(`AUTO: Scanning all ${report.allIPs.length} IP(s)...`);
      for (const ip of report.allIPs) await options.onChainIP(ip, seen);
    } else {
      out.section("Discovered IPs");
      report.allIPs.forEach((ip, i) => out.print(`  ${i}) ${ip}`, out.colors.cyan));
      const sel = await out.promptText("Select IP index (or 'all'): ");
      if (sel.toLowerCase() === "all") {
        for (const ip of report.allIPs) await options.onChainIP(ip, seen);
      } else {
        const idx = parseInt(sel);
        if (!isNaN(idx) && report.allIPs[idx]) await options.onChainIP(report.allIPs[idx], seen);
      }
    }
  } else if (choice === "2" && report.allEmails.length && options.onChainEmail) {
    if (config.autoMode) {
      out.info(`AUTO: Scanning all ${report.allEmails.length} email(s)...`);
      for (const em of report.allEmails) await options.onChainEmail(em, seen);
    } else {
      out.section("Discovered Emails");
      report.allEmails.forEach((em, i) => out.print(`  ${i}) ${em}`, out.colors.cyan));
      const sel = await out.promptText("Select email index (or 'all'): ");
      if (sel.toLowerCase() === "all") {
        for (const em of report.allEmails) await options.onChainEmail(em, seen);
      } else {
        const idx = parseInt(sel);
        if (!isNaN(idx) && report.allEmails[idx]) await options.onChainEmail(report.allEmails[idx], seen);
      }
    }
  }
}
