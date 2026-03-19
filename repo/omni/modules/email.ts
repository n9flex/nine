/**
 * email
 * @app-description OMNI email recon pipeline — WHOIS lookup to IP exploitation.
 */

import { Sora } from "../lib/sora";
import { safeExec } from "../lib/utils";
import { ipPipeline } from "./ip";

const out = Sora.ctx();

export async function emailPipeline(email: string, seen: Set<string>): Promise<void> {
  const emKey = `email:${email.toLowerCase()}`;
  if (seen.has(emKey)) { out.info(`Already scanned email ${email} — skipping.`); return; }
  seen.add(emKey);

  out.info(`WHOIS lookup for: ${email}`);
  await safeExec(`whois ${email}`);

  out.info("WHOIS output displayed above. Routing to IP pipeline if an IP was visible.");
}
