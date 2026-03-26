// @ts-nocheck
// ============================================================================
// SECTION: Imports
// ============================================================================
import { UI } from "./ui";

// ============================================================================
// SECTION: Python Module Runner Helper
// ============================================================================

/**
 * Ensures a Python script is available locally, downloading from HackDB if needed
 * @param scriptName - Name of the script (e.g., "net_tree.py")
 * @param downloadDir - Directory to download to (e.g., "downloads")
 * @param ui - UI instance for output
 * @returns Promise<boolean> - True if script is available
 */
export async function ensurePythonScript(
  scriptName: string,
  downloadDir: string,
  ui: UI
): Promise<boolean> {
  const cwd = await FileSystem.cwd();
  const scriptPath = `${cwd.absolutePath}/${downloadDir}/${scriptName}`;

  // Check if script already exists
  try {
    await FileSystem.ReadFile(scriptPath, { absolute: true });
    return true;
  } catch {
    // Script doesn't exist, download it
  }

  ui.info(`Downloading ${scriptName} from HackDB...`);

  try {
    await HackDB.DownloadExploit(scriptName, downloadDir, { absolute: true });
    return true;
  } catch (err) {
    ui.error(`Failed to download ${scriptName}: ${String(err)}`);
    return false;
  }
}

/**
 * Runs a Python module with the given arguments
 * CRITICAL: Shell.Process.exec does NOT return output directly
 * Must redirect to temp file then read it
 * @param scriptPath - Absolute path to the Python script
 * @param args - Arguments to pass to the script
 * @param ui - UI instance for output
 * @param options - Optional timeout and other settings
 * @returns Promise<{ success: boolean; output: string; error?: string }>
 */
export async function runPythonModule(
  scriptPath: string,
  args: string[],
  ui: UI,
  options?: { timeout?: number }
): Promise<{ success: boolean; output: string; error?: string }> {
  // Check python3 is available
  if (!checkLib("python3")) {
    ui.info("Installing python3...");
    const installed = await installLib("python3");
    if (!installed) {
      return { success: false, output: "", error: "python3 not available" };
    }
  }

  // Ensure script exists
  try {
    await FileSystem.ReadFile(scriptPath, { absolute: true });
  } catch {
    return { success: false, output: "", error: `Script not found: ${scriptPath}` };
  }

  // Execute with output redirected to temp file
  const tempOutputFile = "/tmp/python_output.txt";

  try {
    const cmd = `python3 ${scriptPath} ${args.join(" ")} > ${tempOutputFile}`;
    await Shell.Process.exec(cmd, { absolute: true });

    // Read the output from temp file
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

/**
 * Alternative: Run Python module and parse JSON output if available
 * @param scriptPath - Absolute path to the Python script
 * @param args - Arguments to pass
 * @param ui - UI instance
 * @param options - Configuration options
 * @returns Promise with parsed data if JSON output detected
 */
export async function runPythonModuleWithJson(
  scriptPath: string,
  args: string[],
  ui: UI,
  options?: { timeout?: number; expectJson?: boolean }
): Promise<{ success: boolean; output: string; data?: any; error?: string }> {
  const result = await runPythonModule(scriptPath, args, ui, options);

  if (!result.success || !options?.expectJson) {
    return result;
  }

  // Try to parse JSON from output
  try {
    // Look for JSON in the output (might be surrounded by other text)
    const jsonMatch = result.output.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (jsonMatch) {
      const data = JSON.parse(jsonMatch[0]);
      return { ...result, data };
    }
  } catch {
    // JSON parsing failed, return raw output
  }

  return result;
}
