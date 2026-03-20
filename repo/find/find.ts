/**
 * find
 * @app-description Recursive file search for a FileSystem API. Supports Linux-style flags and wildcards.
 */

import { Sora } from "./sora";

const out = Sora.ctx();
const args = Shell.GetArgs();

await main();

async function main() {
  if (args.includes("-h") || args.includes("--help")) {
    usage();
    return;
  }

  const [patternArg, pathArg] = args.filter((arg) => !arg.startsWith("-"));
  if (!patternArg) {
    usage();
    return;
  }

  const useRoot = args.includes("-r") || args.includes("--root");
  const cwdInfo = await FileSystem.cwd();
  const originalPath = cwdInfo?.absolutePath || cwdInfo?.currentPath || ".";

  let root = pathArg || ".";
  if (useRoot) {
    await FileSystem.SetPath("/", { absolute: true });
    root = ".";
  }

  const resolved = await resolvePath(root);
  if (!resolved) {
    if (useRoot && originalPath) {
      await FileSystem.SetPath(originalPath, { absolute: true });
    }
    out.error("Path not found.");
    return;
  }

  const matcher = buildMatcher(patternArg);
  const results: string[] = [];

  await walk(resolved, matcher, results);

  if (!results.length) {
    out.warn("No matches found.");
    return;
  }

  results.forEach((line) => out.print(line, out.colors.secondary));
  out.newLine();
  out.success(`Found ${results.length} match(es)`);

  if (useRoot && originalPath) {
    await FileSystem.SetPath(originalPath, { absolute: true });
  }
}

function usage() {
  out.print("Usage: find <pattern> [path] [options]", out.colors.secondary);
  out.print("  -r, --root           Search from /", out.colors.secondary);
  out.print("Pattern supports * and ? wildcards", out.colors.secondary);
}

function buildMatcher(pattern: string) {
  const cleaned = pattern.replace(/^['"]|['"]$/g, "");
  const escaped = cleaned.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`^${escaped.replace(/\*/g, ".*").replace(/\?/g, ".")}$`, "i");
  return (name: string) => regex.test(name);
}

async function walk(path: string, matcher: (name: string) => boolean, results: string[]) {
  const entries = await FileSystem.ReadDir(path);
  if (!entries) return;

  for (const entry of entries) {
    const baseName = entry.name;
    const ext = entry.extension ? String(entry.extension) : "";
    const normalizedExt = ext.startsWith(".") ? ext.slice(1) : ext;
    let fullName = baseName;
    if (normalizedExt && !baseName.endsWith(`.${normalizedExt}`)) {
      fullName = `${baseName}.${normalizedExt}`;
    }
    const fullPath = normalize(`${path}/${fullName}`);
    const candidates = new Set([baseName, fullName, fullPath]);

    const isMatch = Array.from(candidates).some((name) => matcher(name));
    if (isMatch) {
      results.push(fullPath);
    }

    if (entry.isFolder) {
      await walk(fullPath, matcher, results);
    }
  }
}

async function resolvePath(input: string) {
  if (input.startsWith("/")) {
    const entries = await FileSystem.ReadDir(input);
    return entries ? input : null;
  }

  const entries = await FileSystem.ReadDir(input);
  if (entries) return input;

  const cwd = await FileSystem.cwd();
  const basePath = cwd?.currentPath || cwd?.absolutePath || ".";
  const combined = normalize(`${basePath}/${input}`);
  const combinedEntries = await FileSystem.ReadDir(combined);
  return combinedEntries ? combined : null;
}

function normalize(path: string) {
  return path.replace(/\/+/g, "/");
}
