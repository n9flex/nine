/**
 * OMNI v3.0
 * @app-description Unified toolkit: OSINT, recon, exploitation, brute force, hash cracking, WiFi, SQLi, network discovery, and full attack pipeline.
 */

import { Sora } from "./lib/sora";
import { config, MAX_DEPTH, DOMAIN_RE, PortInfo } from "./lib/config";
import { safeExec } from "./lib/utils";
import { ipPipeline, multiIpPipeline, initLocalIP, getLocalIP } from "./modules/ip";
import { domainPipeline } from "./modules/domain";
import { emailPipeline } from "./modules/email";
import { jwtPipeline } from "./modules/jwt";
import { filePipeline } from "./modules/file";
import { lynxPipeline } from "./modules/lynx";
import { wifiPipeline } from "./modules/wifi";
import { crackPipeline, crackFromFile } from "./modules/crack";
import { sqliPipeline } from "./modules/sqli";
import { profilePipeline } from "./modules/profile";
import { nettreePipeline } from "./modules/nettree";
import { subfinderScan, mxLookup, geoipLookup, nucleiScan } from "./modules/recon";
import { autoExploit } from "./modules/exploit";
import { fullPipeline, FullPipelineOptions } from "./modules/fullpipeline";

const out = Sora.ctx();

const OMNI_ART = ">> OMNI v3.0 <<";

// ── Usage ──

function usage(): void {
  out.print(OMNI_ART, out.colors.cyan);
  out.info("OMNI v3.0 — Unified Toolkit");
  out.info("Full-Spectrum Recon, Exploitation & Attack Pipeline");
  out.newLine();
  out.divider();
  out.section("USAGE");
  out.print("  omni <ip>                     Deep recon + auto exploit", out.colors.cyan);
  out.print("  omni <ip>,<ip>,<ip>           Attack multiple IPs", out.colors.cyan);
  out.print("  omni -t <file>                Attack IPs from file (one per line)", out.colors.cyan);
  out.print("  omni <domain>                 Resolve domain → IP → recon", out.colors.cyan);
  out.print("  omni -e <email>               Email → IP → exploit", out.colors.cyan);
  out.print("  omni -e <email> -a            Email → IP → auto exploit", out.colors.cyan);
  out.print("  omni -j <jwt_token>           Decode JWT token", out.colors.cyan);
  out.print("  omni -f <filepath> [1-4]      Extract from file (VEX)", out.colors.cyan);
  out.print("  omni -l <search_term>         Lynx OSINT lookup", out.colors.cyan);
  out.print("  omni -l <term> -d <depth>     Lynx recursive harvest", out.colors.cyan);
  out.print("  omni -w                       WiFi crack pipeline", out.colors.cyan);
  out.print("  omni -c <hash>                Crack a hash", out.colors.cyan);
  out.print("  omni --crack-file <file>      Crack hashes from file", out.colors.cyan);
  out.print("  omni -s <url>                 SQL injection (sqlmap)", out.colors.cyan);
  out.print("  omni -p                       View saved profiles", out.colors.cyan);
  out.print("  omni --full <target>          Full attack pipeline (everything)", out.colors.cyan);
  out.print("  omni --nettree <ip>           Network tree discovery", out.colors.cyan);
  out.print("  omni --subfinder <domain>     Subdomain enumeration", out.colors.cyan);
  out.print("  omni --mx <domain>            Mail server lookup", out.colors.cyan);
  out.print("  omni --geoip <ip>             Geolocation lookup", out.colors.cyan);
  out.print("  omni --nuclei <targets>       Vulnerability scan (comma-sep)", out.colors.cyan);
  out.print("  omni -h                       Show this help", out.colors.cyan);
  out.divider();
  out.section("FILE EXTRACT MODES (with -f)");
  out.print("  1 = Emails  2 = Names  3 = URLs  4 = Direct (all lines)", out.colors.gray);
  out.section("FLAGS");
  out.print("  -a          Auto mode (skip prompts, pick defaults)", out.colors.gray);
  out.print("  -d <1-5>    Recursive lynx depth (default 3, max 5)", out.colors.gray);
  out.print("  --no-log    Disable session logging", out.colors.gray);
  out.divider();
  out.newLine();
}

// ── Main ──

export async function main(args: string[], scriptLocation: string): Promise<void> {
  const seen = new Set<string>();

  // ── Arg Parsing ──
  let mode = "", inputVal = "";
  let autoMode = false;
  let harvestDepth = MAX_DEPTH;
  let logging = true;

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "-h" || a === "--help" || a === "?") { mode = "help"; break; }
    else if (a === "-e" || a === "--email") { mode = "email"; inputVal = args[++i] || ""; }
    else if (a === "-j" || a === "--jwt") { mode = "jwt"; inputVal = args[++i] || ""; }
    else if (a === "-t" || a === "--targets") { mode = "multi-ip"; inputVal = args[++i] || ""; }
    else if (a === "-f" || a === "--file") { mode = "file"; inputVal = args[++i] || ""; }
    else if (a === "-l" || a === "--lynx") {
      mode = "lynx";
      const parts: string[] = [];
      for (let j = i + 1; j < args.length; j++) {
        if (args[j] === "-a" || args[j] === "--auto") { autoMode = true; continue; }
        if (args[j] === "-d" || args[j] === "--depth") { harvestDepth = Math.min(5, Math.max(1, parseInt(args[++j]) || MAX_DEPTH)); continue; }
        if (args[j].startsWith("-")) continue;
        parts.push(args[j]);
      }
      inputVal = parts.join(" ");
      break;
    }
    else if (a === "-w" || a === "--wifi") { mode = "wifi"; }
    else if (a === "-c" || a === "--crack") { mode = "crack"; inputVal = args[++i] || ""; }
    else if (a === "--crack-file") { mode = "crack-file"; inputVal = args[++i] || ""; }
    else if (a === "-s" || a === "--sqli") { mode = "sqli"; inputVal = args[++i] || ""; }
    else if (a === "-p" || a === "--profiles") { mode = "profiles"; }
    else if (a === "--full") { mode = "full"; inputVal = args[++i] || ""; }
    else if (a === "--nettree") { mode = "nettree"; inputVal = args[++i] || ""; }
    else if (a === "--subfinder") { mode = "subfinder"; inputVal = args[++i] || ""; }
    else if (a === "--mx") { mode = "mx"; inputVal = args[++i] || ""; }
    else if (a === "--nuclei") { mode = "nuclei"; inputVal = args[++i] || ""; }
    else if (a === "--geoip") { mode = "geoip"; inputVal = args[++i] || ""; }
    else if (a === "--no-log") { logging = false; }
    else if (a === "-a" || a === "--auto") { autoMode = true; }
    else if (a === "-d" || a === "--depth") { harvestDepth = Math.min(5, Math.max(1, parseInt(args[++i]) || MAX_DEPTH)); }
    else if (!a.startsWith("-") && !mode) {
      if (a.includes(",")) {
        mode = "multi-ip"; inputVal = a;
      } else if (Networking.IsIp(a)) { mode = "ip"; inputVal = a; }
      else if (DOMAIN_RE.test(a)) { mode = "domain"; inputVal = a; }
      else if (a.split(".").length === 3 && !DOMAIN_RE.test(a)) { mode = "jwt"; inputVal = a; }
      else {
        mode = "lynx";
        const parts: string[] = [a];
        for (let j = i + 1; j < args.length; j++) {
          if (args[j] === "-a" || args[j] === "--auto") { autoMode = true; continue; }
          if (args[j] === "-d" || args[j] === "--depth") { harvestDepth = Math.min(5, Math.max(1, parseInt(args[++j]) || MAX_DEPTH)); continue; }
          if (args[j].startsWith("-")) continue;
          parts.push(args[j]);
        }
        inputVal = parts.join(" ");
        break;
      }
    }
  }

  if (!mode || mode === "help") { usage(); if (mode === "help") throw ""; return; }
  const noInputModes = ["wifi", "profiles"];
  if (!inputVal && !noInputModes.includes(mode)) { out.error("No input provided. Use -h for help."); throw ""; }

  if (autoMode) out.info("AUTO MODE enabled.");

  // ── Setup ──

  out.print(OMNI_ART, out.colors.cyan);
  out.info("OMNI v3.0 — Unified Toolkit");
  out.newLine();
  Shell.lock();

  // Set working directory FIRST (before logging, which needs temp/)
  await FileSystem.SetPath(scriptLocation, { absolute: true });
  const tempDir = await FileSystem.ReadDir("temp");
  if (!tempDir) await safeExec("mkdir temp");

  // Detect local IP (display ifconfig output, use default 192.168.1.2 for reverse TCP)
  await safeExec("ifconfig");

  // ── Lynx chaining callbacks ──
  const lynxOptions = {
    onChainIP: (ip: string, s: Set<string>) => ipPipeline(ip, s, autoMode),
    onChainEmail: (em: string, s: Set<string>) => emailPipeline(em, s),
  };

  const fullPipelineOpts: FullPipelineOptions = {
    onIPRecon: (ip: string, s: Set<string>) => ipPipeline(ip, s, autoMode),
    onDomainRecon: (domain: string, s: Set<string>) => domainPipeline(domain, s, lynxOptions),
    onExploit: (ip: string, ports: PortInfo[], localIP: string) => autoExploit(ip, ports, localIP, autoMode),
  };

  // ── Route ──

  switch (mode) {
    case "ip":       await ipPipeline(inputVal, seen, autoMode); break;
    case "multi-ip": await multiIpPipeline(inputVal, seen, autoMode); break;
    case "domain":   await domainPipeline(inputVal, seen, lynxOptions); break;
    case "email":    await emailPipeline(inputVal, seen); break;
    case "jwt":      await jwtPipeline(inputVal); break;
    case "file":     await filePipeline(inputVal, args); break;
    case "lynx":     await lynxPipeline(inputVal, seen, lynxOptions); break;
    case "wifi":       await wifiPipeline(); break;
    case "crack":      await crackPipeline(inputVal || undefined); break;
    case "crack-file": await crackFromFile(inputVal); break;
    case "sqli":       await sqliPipeline(inputVal); break;
    case "profiles":   await profilePipeline(); break;
    case "full":       await fullPipeline(inputVal, seen, getLocalIP(), fullPipelineOpts); break;
    case "nettree":    await nettreePipeline(inputVal); break;
    case "subfinder":  await subfinderScan(inputVal); break;
    case "mx":         await mxLookup(inputVal); break;
    case "geoip":      await geoipLookup(inputVal); break;
    case "nuclei":     await nucleiScan(inputVal.split(",")); break;
    default:         out.error("Unknown mode.");
  }

  out.info("OMNI session complete.");
  if (Shell.isLocked()) Shell.unlock();
}
