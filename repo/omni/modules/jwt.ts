/**
 * jwt
 * @app-description OMNI JWT decode pipeline.
 */

import { Sora } from "../lib/sora";
import { safeExec, requireTool, ensureScript } from "../lib/utils";

const out = Sora.ctx();

const JWT_ART = ">> JWT DECODE <<";

export async function jwtPipeline(token: string): Promise<void> {
  out.print(JWT_ART, out.colors.cyan);
  out.info("Decoding JWT...");

  const cwd = await FileSystem.cwd();
  if (!await ensureScript("jwt_decoder.py", cwd.absolutePath)) { out.error("Cannot decode without jwt_decoder.py."); return; }

  await requireTool("python3");
  await safeExec(`python3 jwt_decoder.py ${token}`);
}
