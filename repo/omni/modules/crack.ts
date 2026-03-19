/**
 * crack
 * @app-description OMNI hash cracking pipeline — identify and crack hashes.
 */

import { Sora } from "../lib/sora";
import { safeExec } from "../lib/utils";

const out = Sora.ctx();

const CRACK_ART = ">> HASH CRACK <<";

function identifyHash(hash: string): string {
  const len = hash.length;
  if (/^[a-f0-9]+$/i.test(hash)) {
    if (len === 32) return "MD5";
    if (len === 40) return "SHA-1";
    if (len === 64) return "SHA-256";
    if (len === 128) return "SHA-512";
  }
  if (hash.startsWith("$2a$") || hash.startsWith("$2b$") || hash.startsWith("$2y$")) return "bcrypt";
  if (hash.startsWith("$6$")) return "SHA-512 (crypt)";
  if (hash.startsWith("$5$")) return "SHA-256 (crypt)";
  if (hash.startsWith("$1$")) return "MD5 (crypt)";
  return "Unknown";
}

export async function crackPipeline(hashInput?: string): Promise<void> {
  out.print(CRACK_ART, out.colors.cyan);
  out.info("Hash Cracking Pipeline");
  out.divider();

  let hash = hashInput;
  if (!hash) {
    hash = await out.promptText("Enter hash to crack: ");
    if (!hash) { out.error("No hash provided."); return; }
  }

  const hashType = identifyHash(hash);
  out.info(`Hash     : ${hash}`);
  out.info(`Type     : ${hashType}`);
  out.divider();

  // Try Crypto.Hash.decrypt first (instant lookup for game-encrypted hashes)
  out.info("Trying direct decrypt...");
  try {
    const direct = Crypto.Hash.decrypt(hash);
    if (direct) {
      out.newLine();
      out.divider();
      out.success("HASH CRACKED (direct lookup)!");
      out.divider();
      out.print(`  Hash      : ${hash}`, out.colors.gray);
      out.print(`  Type      : ${hashType}`, out.colors.gray);
      out.print(`  Plaintext : ${direct}`, out.colors.green);
      out.divider();
      return;
    }
  } catch {}
  out.warn("Direct decrypt failed.");

  // Try John the Ripper
  out.info("Running John the Ripper...");
  const tmpJohn = `temp/omni_john_${Date.now()}.txt`;
  try {
    await FileSystem.WriteFile(tmpJohn, hash, { absolute: false });
    await safeExec(`john ${tmpJohn}`);
  } catch {
    out.warn("John the Ripper failed.");
  }
  await FileSystem.Remove(tmpJohn).catch(() => {});

  // Try Hashcat with wordlist
  out.info("Running Hashcat with wordlist...");

  // Write hash to temp file for Hashcat
  const tmpHash = `temp/omni_hash_${Date.now()}.txt`;
  try {
    await FileSystem.WriteFile(tmpHash, hash, { absolute: false });
    const result = await Crypto.Hashcat.Decrypt(tmpHash);
    if (result) {
      out.newLine();
      out.divider();
      out.success("HASH CRACKED (Hashcat)!");
      out.divider();
      out.print(`  Hash      : ${hash}`, out.colors.gray);
      out.print(`  Type      : ${hashType}`, out.colors.gray);
      out.print(`  Plaintext : ${result}`, out.colors.green);
      out.divider();
    } else {
      out.error("Hashcat could not crack the hash.");
      out.info("The hash may require a larger wordlist or different attack mode.");
    }
  } catch {
    out.error("Hashcat execution failed.");
  }
  await FileSystem.Remove(tmpHash).catch(() => {});
}

export async function crackFromFile(filepath: string): Promise<void> {
  out.print(CRACK_ART, out.colors.cyan);
  out.info(`Batch hash cracking from: ${filepath}`);
  out.divider();

  let content: string;
  try { content = await FileSystem.ReadFile(filepath); } catch { content = ""; }
  if (!content) { out.error(`Cannot read ${filepath}`); return; }

  const hashes = content.split("\n").map(l => l.trim()).filter(l => l.length > 0);
  if (!hashes.length) { out.error("No hashes found in file."); return; }

  out.success(`Loaded ${hashes.length} hash(es).`);
  out.divider();

  for (let i = 0; i < hashes.length; i++) {
    out.print(`\n[${i + 1}/${hashes.length}] ${hashes[i]}`, out.colors.white);
    await crackPipeline(hashes[i]);
  }

  out.newLine();
  out.divider();
  out.success(`Batch complete — ${hashes.length} hash(es) processed.`);
  out.divider();
}
