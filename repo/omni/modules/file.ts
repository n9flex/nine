/**
 * file
 * @app-description OMNI file extraction pipeline (VEX) — extract emails, names, URLs from files.
 */

import { Sora } from "../lib/sora";
import { EMAIL_RE, NAME_RE, URL_RE } from "../lib/config";
import { lynxScanTargets } from "./lynx";

const out = Sora.ctx();

const FILE_ART = ">> FILE EXTRACT <<";

const MODES: Record<string, { id: number; n: string }> = {
  "1": { id: 1, n: "EMAILS" },
  "2": { id: 2, n: "NAMES" },
  "3": { id: 3, n: "URLS" },
  "4": { id: 4, n: "DIRECT" },
};
const PATS: Record<number, RegExp> = { 1: EMAIL_RE, 2: NAME_RE, 3: URL_RE };

export async function filePipeline(filepath: string, args: string[]): Promise<void> {
  out.print(FILE_ART, out.colors.cyan);
  out.info(`File extraction: ${filepath}`);

  let modeArg = args.find(a => ["1", "2", "3", "4"].includes(a));
  if (!modeArg) {
    out.section("EXTRACT MODULES");
    out.list(["Emails", "Names", "URLs", "Direct (all lines)"], { color: out.colors.gray });
    out.print("0) Cancel", out.colors.gray);
    out.newLine();
    modeArg = await out.promptText("SELECT MODULE [1-4, 0]: ");
    if (modeArg === "0") return;
  }

  const mod = MODES[modeArg];
  if (!mod) { out.error("Invalid module."); return; }

  out.info(`Extracting ${mod.n} from ${filepath}...`);

  let content: string;
  try { content = await FileSystem.ReadFile(filepath); } catch { content = ""; }
  if (!content) { out.error(`Cannot read ${filepath}`); return; }

  let results: string[];
  if (mod.id === 4) {
    results = content.split("\n").map(l => l.trim()).filter(l => l.length > 0);
  } else {
    const matches = content.match(PATS[mod.id]);
    results = matches ? Array.from(new Set(matches)) : [];
  }

  if (!results.length) { out.warn("No data found."); return; }

  if (mod.id === 4) {
    out.success(`Loaded ${results.length} lines.`);
  } else {
    out.success(`Extracted ${results.length} items:`);
    out.divider();
    for (const r of results) out.print(`  >> ${r}`, out.colors.cyan);
    out.divider();
  }

  const forceScan = mod.id === 4;
  await lynxScanTargets(results, forceScan);
}
