/**
 * profile
 * @app-description OMNI target profiles — save and load recon results.
 */

import { Sora } from "../lib/sora";
import { safeExec } from "../lib/utils";

const out = Sora.ctx();

const PROFILE_DIR = "profiles";

export interface TargetProfile {
  target: string;
  type: string;
  created: string;
  updated: string;
  ips: string[];
  ports: Array<{ port: number; service: string; version: string; state: string }>;
  emails: string[];
  social: string[];
  hashes: string[];
  notes: string[];
  wifiCracks: Array<{ bssid: string; password: string }>;
}

function newProfile(target: string, type: string): TargetProfile {
  const now = new Date().toISOString();
  return {
    target,
    type,
    created: now,
    updated: now,
    ips: [],
    ports: [],
    emails: [],
    social: [],
    hashes: [],
    notes: [],
    wifiCracks: [],
  };
}

function sanitizeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").substring(0, 50);
}

export async function ensureProfileDir(): Promise<void> {
  const dir = await FileSystem.ReadDir(PROFILE_DIR);
  if (!dir) await safeExec(`mkdir ${PROFILE_DIR}`);
}

export async function saveProfile(profile: TargetProfile): Promise<void> {
  await ensureProfileDir();
  profile.updated = new Date().toISOString();
  const filename = `${PROFILE_DIR}/${sanitizeName(profile.target)}.json`;
  const json = JSON.stringify(profile);
  try {
    await FileSystem.WriteFile(filename, json, { absolute: false });
    out.success(`Profile saved: ${filename}`);
  } catch {
    out.error(`Could not save profile for ${profile.target}`);
  }
}

export async function loadProfile(target: string): Promise<TargetProfile | null> {
  await ensureProfileDir();
  const filename = `${PROFILE_DIR}/${sanitizeName(target)}.json`;
  try {
    const content = await FileSystem.ReadFile(filename);
    if (content) {
      const profile = JSON.parse(content) as TargetProfile;
      out.success(`Profile loaded: ${target}`);
      return profile;
    }
  } catch {}
  return null;
}

export async function profilePipeline(): Promise<void> {
  out.info("Target Profiles");
  out.divider();

  await ensureProfileDir();
  const files = await FileSystem.ReadDir(PROFILE_DIR);

  if (!files || !files.length) {
    out.warn("No profiles saved yet.");
    out.info("Profiles are created automatically during recon.");
    return;
  }

  const profiles = files.filter(f => f.extension === "json");
  if (!profiles.length) {
    out.warn("No profile files found.");
    return;
  }

  out.success(`Found ${profiles.length} profile(s):`);
  out.divider();

  for (let i = 0; i < profiles.length; i++) {
    const f = profiles[i];
    try {
      const content = await FileSystem.ReadFile(`${PROFILE_DIR}/${f.name}.${f.extension}`);
      const p = JSON.parse(content) as TargetProfile;
      const stats = [
        p.ips.length ? `${p.ips.length} IP` : "",
        p.ports.length ? `${p.ports.length} ports` : "",
        p.emails.length ? `${p.emails.length} emails` : "",
        p.social.length ? `${p.social.length} social` : "",
      ].filter(s => s).join(", ");
      out.print(`  ${i}) ${p.target} (${p.type}) — ${stats || "empty"}`, out.colors.cyan);
      out.print(`     Last updated: ${p.updated}`, out.colors.gray);
    } catch {
      out.print(`  ${i}) ${f.name} (corrupted)`, out.colors.red);
    }
  }

  out.divider();
  out.section("OPTIONS");
  out.print("  v <index>  — View full profile", out.colors.gray);
  out.print("  d <index>  — Delete profile", out.colors.gray);
  out.print("  q          — Quit", out.colors.gray);
  out.newLine();

  const cmd = await out.promptText("COMMAND: ");
  if (!cmd || cmd === "q") return;

  const parts = cmd.split(" ");
  const action = parts[0];
  const pidx = parseInt(parts[1]);

  if (isNaN(pidx) || !profiles[pidx]) {
    out.error("Invalid index.");
    return;
  }

  const pFile = profiles[pidx];

  if (action === "v") {
    const content = await FileSystem.ReadFile(`${PROFILE_DIR}/${pFile.name}.${pFile.extension}`);
    const p = JSON.parse(content) as TargetProfile;

    out.newLine();
    out.divider("=");
    out.print(`  TARGET: ${p.target}`, out.colors.white);
    out.print(`  Type: ${p.type}`, out.colors.gray);
    out.print(`  Created: ${p.created}`, out.colors.gray);
    out.print(`  Updated: ${p.updated}`, out.colors.gray);
    out.divider("=");

    if (p.ips.length) { out.print("  IPs:", out.colors.magenta); for (const ip of p.ips) out.print(`    ${ip}`, out.colors.cyan); }
    if (p.ports.length) {
      out.print("  Ports:", out.colors.magenta);
      for (const pt of p.ports) out.print(`    ${pt.port} ${pt.state} ${pt.service} ${pt.version}`, out.colors.cyan);
    }
    if (p.emails.length) { out.print("  Emails:", out.colors.magenta); for (const em of p.emails) out.print(`    ${em}`, out.colors.cyan); }
    if (p.social.length) { out.print("  Social:", out.colors.magenta); for (const s of p.social) out.print(`    ${s}`, out.colors.cyan); }
    if (p.hashes.length) { out.print("  Hashes:", out.colors.magenta); for (const h of p.hashes) out.print(`    ${h}`, out.colors.cyan); }
    if (p.wifiCracks.length) { out.print("  WiFi Cracks:", out.colors.magenta); for (const w of p.wifiCracks) out.print(`    ${w.bssid} → ${w.password}`, out.colors.green); }
    if (p.notes.length) { out.print("  Notes:", out.colors.magenta); for (const n of p.notes) out.print(`    ${n}`, out.colors.gray); }
    out.divider("=");
  } else if (action === "d") {
    const confirm = await out.promptText(`Delete profile for '${pFile.name}'? (Y/N): `);
    if (confirm === "Y") {
      await FileSystem.Remove(`${PROFILE_DIR}/${pFile.name}.${pFile.extension}`).catch(() => {});
      out.success("Profile deleted.");
    }
  }
}
