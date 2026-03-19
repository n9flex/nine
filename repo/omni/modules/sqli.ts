/**
 * sqli
 * @app-description OMNI SQL injection pipeline — automated sqlmap attacks.
 */

import { Sora } from "../lib/sora";
import { safeExec, requireTool, ensureScript } from "../lib/utils";

const out = Sora.ctx();

const SQLI_ART = ">> SQL INJECTION <<";

export async function sqliPipeline(target: string): Promise<void> {
  out.print(SQLI_ART, out.colors.cyan);
  out.info("SQL Injection Pipeline");
  out.divider();

  await requireTool("python3");

  out.info(`Target: ${target}`);

  // Ensure sqlmap exists
  if (!await ensureScript("sqlmap.py", "/")) return;

  out.section("ATTACK MODE");
  out.list([
    "Auto (--batch --smart)",
    "Forms (--forms --batch)",
    "Full dump (--dump-all --batch)",
    "Custom flags",
  ], { color: out.colors.gray });
  out.print("0) Cancel", out.colors.gray);
  out.newLine();

  const choice = await out.promptText("SELECT [1-4, 0]: ");
  if (choice === "0") return;

  let flags = "";
  switch (choice) {
    case "1": flags = "--batch --smart"; break;
    case "2": flags = "--forms --batch"; break;
    case "3": flags = "--dump-all --batch"; break;
    case "4":
      flags = await out.promptText("Enter sqlmap flags: ");
      if (!flags) { out.error("No flags provided."); return; }
      break;
    default: out.error("Invalid selection."); return;
  }

  out.info(`Running: python3 /sqlmap.py -u ${target} ${flags}`);
  out.warn("This may take a while...");
  out.divider();

  const savedDir = await FileSystem.cwd();
  await FileSystem.SetPath("/", { absolute: true });
  try {
    await safeExec(`python3 /sqlmap.py -u ${target} ${flags}`);
  } catch {
    out.error("sqlmap execution failed.");
  }
  await FileSystem.SetPath(savedDir.absolutePath, { absolute: true });

  out.newLine();
  out.divider();
  out.success("SQLMap execution complete — check output above.");
  out.divider();
}
