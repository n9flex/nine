/**
 * utils
 * @app-description OMNI shared utility functions.
 */

import { Sora } from "./sora";

const out = Sora.ctx();

export async function safeExec(cmd: string): Promise<void> {
  try { await Shell.Process.exec(cmd); } catch {}
}

export function pushUniq(target: string[], items: string[]): void {
  for (const i of items) {
    const v = i.trim();
    if (v && target.indexOf(v) === -1) target.push(v);
  }
}

export async function requireTool(tool: string): Promise<boolean> {
  try {
    const ok = checkLib(tool);
    if (!ok) {
      out.info(`Installing ${tool}...`);
      const r = await installLib(tool);
      if (r) { out.success(`${tool} installed.`); return true; }
      else { out.error(`Failed to install ${tool}.`); return false; }
    }
  } catch {}
  return true;
}

export function extractVersion(raw: string): string | null {
  if (!raw) return null;
  const m = raw.match(/\d+(?:\.\d+)+/);
  return m ? m[0] : null;
}

// ── HackDB Script Downloader ──

const HACKDB_SCRIPTS: Record<string, string> = {
  "net_tree.py": "NetTree - Automated Network Tree Mapper",
  "pyUserEnum.py": "pyUserEnum - Enumerate users on a subnet",
  "jwt_decoder.py": "JWT Decoder",
  "fern.py": "Fern - Router password cracker",
  "kimai.py": "Kimai-1.30.10 - SameSite Cookie-Vulnerability session hijacking",
  "pret.py": "Pret - Is your printer secure? Check before someone else does...",
  "sqlmap.py": "Sqlmap",
  "wordlist.lst": "Wordlist file containing nearly 15,000 passwords",
};

export async function ensureScript(filename: string, dir: string): Promise<boolean> {
  const files = await FileSystem.ReadDir(dir, { absolute: true });
  const exists = files?.some(f => `${f.name}.${f.extension}` === filename);
  if (exists) return true;

  const hackdbTitle = HACKDB_SCRIPTS[filename];
  if (!hackdbTitle) {
    out.error(`Unknown script: ${filename}`);
    return false;
  }

  out.info(`${filename} not found. Downloading from HackDB...`);
  try {
    await HackDB.DownloadExploit(hackdbTitle, dir, { absolute: true });
    out.success(`${filename} downloaded.`);
    return true;
  } catch {
    out.error(`Failed to download ${filename}.`);
    return false;
  }
}

// ── Session Logger ──

let logFile: string | null = null;

export function initLog(scriptDir: string): void {
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  logFile = `${scriptDir}/temp/omni-session-${ts}.log`;
}

export async function log(msg: string): Promise<void> {
  if (!logFile) return;
  const line = `[${new Date().toISOString()}] ${msg}`;
  try {
    const existing = await FileSystem.ReadFile(logFile, { absolute: true }).catch(() => "");
    const content = existing ? existing + "\n" + line : line;
    await FileSystem.WriteFile(logFile, content, { absolute: true });
  } catch {}
}
