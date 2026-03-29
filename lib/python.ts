// @ts-nocheck
// ============================================================================
// SECTION: Imports
// ============================================================================
import { UI } from "./ui";

// ============================================================================
// SECTION: Python Module Runner Helper
// ============================================================================

// HackDB mapping for common Python scripts
export const HACKDB_SCRIPTS: Record<string, string> = {
  "net_tree.py": "NetTree - Automated Network Tree Mapper",
  "fern.py": "Fern - Router password cracker",
  "pret.py": "Pret - Is your printer secure? Check before someone else does...",
  "kimai.py": "Kimai-1.30.10 - SameSite Cookie-Vulnerability session hijacking",
  "pyUserEnum.py": "pyUserEnum - Enumerate users on a subnet",
  "jwt_decoder.py": "JWT Decoder",
  "sqlmap.py": "Sqlmap",
};

/**
 * Ensures a Python script is available locally, downloading from HackDB if needed
 * Uses ReadDir pattern for reliable detection (avoids cwd.absolutePath issues)
 * @param filename - Script filename (e.g., "net_tree.py")
 * @param downloadDir - Directory to download to (e.g., "./python")
 * @param ui - UI instance for output
 * @returns Promise<string | null> - Relative path to script if available, null on failure
 */
export async function ensurePythonScript(
  filename: string,
  downloadDir: string,
  ui: UI
): Promise<string | null> {
  const scriptName = filename.replace(".py", "");
  const relativeDir = downloadDir.startsWith("./") ? downloadDir : `./${downloadDir}`;

  // Check if any version of the script exists in directory (ReadDir pattern)
  try {
    const files = await FileSystem.ReadDir(relativeDir, { absolute: false });
    const scriptFile = files.find(f => f.name.startsWith(scriptName) && f.extension === "py");
    if (scriptFile) {
      return `${relativeDir}/${scriptFile.name}.${scriptFile.extension}`;
    }
  } catch {
    // Directory doesn't exist or is empty
  }

  ui.info(`${filename} not found. Downloading from HackDB...`);

  // Ensure directory exists
  try {
    await FileSystem.Mkdir(relativeDir, { absolute: false });
  } catch {
    // Directory might already exist
  }

  // Download from HackDB
  const hackdbTitle = HACKDB_SCRIPTS[filename];
  if (!hackdbTitle) {
    ui.error(`Unknown script: ${filename}`);
    return null;
  }

  try {
    await HackDB.DownloadExploit(hackdbTitle, relativeDir, { absolute: false });
    ui.success(`${filename} downloaded successfully.`);
    return `${relativeDir}/${filename}`;
  } catch (err) {
    ui.error(`Failed to download ${filename}: ${err}`);
    return null;
  }
}

/**
 * Runs a Python script with the given arguments
 * Direct Shell.Process.exec execution (no output capture needed for visual scripts)
 * @param scriptPath - Path to the Python script (relative like "./python/net_tree.py")
 * @param args - Arguments to pass to the script
 * @param ui - UI instance for output
 * @returns Promise<{ success: boolean; error?: string }>
 */
export async function runPythonScript(
  scriptPath: string,
  args: string[],
  ui: UI
): Promise<{ success: boolean; error?: string }> {
  // Check python3 is available
  if (!checkLib("python3")) {
    ui.info("Installing python3...");
    const installed = await installLib("python3");
    if (!installed) {
      return { success: false, error: "python3 not available" };
    }
    
    // Re-check after installation - may need a moment to be available
    let retries = 3;
    while (retries > 0 && !checkLib("python3")) {
      ui.info("Waiting for python3 to be ready...");
      await sleep(1000);
      retries--;
    }
    
    if (!checkLib("python3")) {
      return { success: false, error: "python3 installed but not available in PATH" };
    }
  }

  try {
    await Shell.Process.exec(`python3 ${scriptPath} ${args.join(" ")}`);
    return { success: true };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    return { success: false, error };
  }
}

/**
 * Runs a Python script and captures output to temp file
 * For scripts that produce parseable output
 * @param scriptPath - Path to the Python script
 * @param args - Arguments to pass
 * @param ui - UI instance
 * @returns Promise with captured output
 */
export async function runPythonScriptWithOutput(
  scriptPath: string,
  args: string[],
  ui: UI
): Promise<{ success: boolean; output: string; error?: string }> {
  // Check python3 is available
  if (!checkLib("python3")) {
    ui.info("Installing python3...");
    const installed = await installLib("python3");
    if (!installed) {
      return { success: false, output: "", error: "python3 not available" };
    }
    
    // Re-check after installation - may need a moment to be available
    let retries = 3;
    while (retries > 0 && !checkLib("python3")) {
      ui.info("Waiting for python3 to be ready...");
      await sleep(1000);
      retries--;
    }
    
    if (!checkLib("python3")) {
      return { success: false, output: "", error: "python3 installed but not available in PATH" };
    }
  }

  const tempOutputFile = "/tmp/python_output.txt";

  try {
    const cmd = `python3 ${scriptPath} ${args.join(" ")} > ${tempOutputFile}`;
    await Shell.Process.exec(cmd, { absolute: true });

    const output = await FileSystem.ReadFile(tempOutputFile, { absolute: true });

    // Clean up temp file
    try {
      await FileSystem.Remove(tempOutputFile, { absolute: true });
    } catch {
      // Ignore cleanup errors
    }

    return { success: true, output };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);

    // Try to read any partial output
    let output = "";
    try {
      output = await FileSystem.ReadFile(tempOutputFile, { absolute: true });
    } catch {
      // No output file
    }

    // Clean up temp file
    try {
      await FileSystem.Remove(tempOutputFile, { absolute: true });
    } catch {
      // Ignore cleanup errors
    }

    return { success: false, output, error };
  }
}
