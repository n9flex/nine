/**
 * domain
 * @app-description OMNI domain resolution pipeline.
 */

import { Sora } from "../lib/sora";
import { safeExec } from "../lib/utils";
import { ipPipeline } from "./ip";
import { lynxPipeline, LynxOptions } from "./lynx";

const out = Sora.ctx();

export async function domainPipeline(
  domain: string,
  seen: Set<string>,
  lynxOptions: LynxOptions = {},
): Promise<void> {
  out.info(`Resolving domain: ${domain}`);

  out.info("Running dig...");
  await safeExec(`dig ${domain}`);

  out.info("Running whois...");
  await safeExec(`whois ${domain}`);

  out.info("Falling back to Lynx OSINT search...");
  await lynxPipeline(domain, seen, lynxOptions);
}
