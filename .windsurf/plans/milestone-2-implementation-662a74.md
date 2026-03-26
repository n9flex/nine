# Milestone 2 Implementation Plan

Implementation of 4 reconnaissance modules (scanner, nettree, geoip, dig) and the Python wrapper helper, validated by 53 comprehensive tests.

---

## Overview

Milestone 2 builds on the M1 foundation to implement reconnaissance modules that discover and analyze network assets. All modules follow the 6-section standard structure and integrate with the MissionManifest via the runner.

**Test Reference**: `tests/test-milestone-2.ts` (53 tests total)
- scanner: 9 tests
- nettree: 8 tests
- geoip: 8 tests
- dig: 13 tests
- integration: 12 tests

---

## Implementation Order

### Phase 0: Setup

```bash
mkdir -p modules/recon
```

### Phase 1: Foundation Helper

**1. lib/python.ts** - Python Module Runner Helper

Dependencies: `lib/ui.ts`, `lib/storage.ts`
Purpose: Wrapper for executing Python scripts from HackDB

Key functions:
```typescript
export async function ensurePythonScript(
  scriptName: string,
  downloadDir: string,
  ui: UI
): Promise<boolean>
// 1. Check if script exists in downloadDir
// 2. If not, use HackDB.DownloadExploit(scriptName, "downloads")
// 3. Returns true if script is available

export async function runPythonModule(
  scriptPath: string,
  args: string[],
  ui: UI,
  options?: { timeout?: number }
): Promise<{ success: boolean; output: string; error?: string }>
// CRITICAL: Shell.Process.exec does NOT return output directly
// Must redirect to temp file then read it:
//   await Shell.Process.exec(
//     `python3 ${scriptPath} ${args.join(" ")} > /tmp/output.txt`,
//     { absolute: true }
//   );
//   const output = await FileSystem.ReadFile("/tmp/output.txt", { absolute: true });
```

Additional requirements:
- Check python3: `if (!checkLib("python3")) await installLib("python3")`
- Use absolute paths for all file operations
- Clean up temp files after reading

---

### Phase 2: Reconnaissance Modules

**2. modules/recon/scanner.ts** - Port Scanning

Dependencies: `lib/types.ts`, `lib/ui.ts`
APIs: `Networking.IsIp()`, `Networking.GetSubnet()`, `subnet.GetPorts()`, `subnet.GetPortData()`, `subnet.PingPort()`

Helper function:
```typescript
function resolveTargets(mission: MissionManifest, args?: string[]): string[] {
  if (args && args.length > 0) return args;
  return mission.assets.ips
    .filter(ip => ip.status === "discovered")
    .map(ip => ip.value);
}
```

Structure:
- Meta: name="scanner", command="scan", inputs=["ip"], outputs=["ports"]
- Target resolution: args[0] || mission.assets.ips.find(ip => ip.status === "discovered")?.value
- Returns `PortInfo[]` with state (open/closed), service, version, forwarded detection
- Updates existing asset status to "scanned" (doesn't create newAssets)
- Forwarded detection: `portData.external !== portData.internal`

**3. modules/recon/nettree.ts** - Network Discovery

Dependencies: `lib/types.ts`, `lib/ui.ts`, `lib/python.ts`
APIs: `checkLib()`, `installLib()`, `HackDB.DownloadExploit()`, `Shell.Process.exec()`

Helper function:
```typescript
function resolveTargets(mission: MissionManifest, args?: string[]): string[] {
  if (args && args.length > 0) return args;
  return mission.assets.ips
    .filter(ip => ip.status === "discovered")
    .map(ip => ip.value);
}
```

Structure:
- Meta: name="nettree", command="nettree", inputs=["ip"], outputs=["ips", "topology"]
- Downloads and executes `net_tree.py` from HackDB
- Parses output with IP regex: `/\b(?:\d{1,3}\.){3}\d{1,3}\b/g`
- Returns newAssets with type="ip" and parent=target for each discovered IP
- Fallback to mock IPs if download/execution fails

**4. modules/recon/geoip.ts** - Geolocation Lookup

Dependencies: `lib/types.ts`, `lib/ui.ts`
APIs: `Networking.IsIp()` (mock data - no native geoip API in HackHub)

Helper function:
```typescript
function resolveTargets(mission: MissionManifest, args?: string[]): string[] {
  if (args && args.length > 0) return args;
  return mission.assets.ips.map(ip => ip.value);
}
```

Structure:
- Meta: name="geoip", command="geoip", inputs=["ip"], outputs=["geolocation"]
- Validates IP format with `Networking.IsIp()`
- Returns mock `GeoIPData` (country, city, region, lat/long, isp)
- No newAssets (lookup only, no asset creation)

**5. modules/recon/dig.ts** - DNS Lookup

Dependencies: `lib/types.ts`, `lib/ui.ts`
APIs: None (mock implementation - dig command hangs in HackHub)

Helper function:
```typescript
function resolveDomain(mission: MissionManifest, args?: string[]): string | null {
  if (args && args.length > 0) return args[0];
  const domainSeed = mission.seeds.find(s => s.type === "domain");
  return domainSeed?.value || null;
}
```

Structure:
- Meta: name="dig", command="dig", inputs=["domain"], outputs=["dns_records", "resolved_ips"]
- Target: args[0] || mission.seeds.find(s => s.type === "domain")?.value
- Returns mock resolved IP (93.184.216.34 for example.com)
- newAssets: [{type: "ip", value, parent: domain}, {type: "domain", value: domain}]
- Parent relationship tracks which domain resolved to which IP

---

## Module Architecture (6 Sections)

```typescript
// @ts-nocheck
// ============================================================================
// SECTION 1: Imports
// ============================================================================
import { UI } from "../../lib/ui";
import { MissionManifest, ModuleResult } from "../../lib/types";

// ============================================================================
// SECTION 2: Module Metadata
// ============================================================================
export const meta = {
  name: "moduleName",
  command: "cmd",
  description: "Description",
  requires: [],
  inputs: ["ip"],
  outputs: ["ports"],
};

// ============================================================================
// SECTION 3: Core Logic
// ============================================================================
export async function run(
  mission: MissionManifest,
  ui: UI,
  args?: string[]
): Promise<ModuleResult> {
  // Target resolution
  const target = args?.[0] || getTargetFromMission(mission);
  
  // Validation
  if (!target) {
    ui.error("No target specified");
    return { success: false, data: { error: "No target" } };
  }
  
  // Execute reconnaissance
  // Return with newAssets for runner to persist
}

// ============================================================================
// SECTION 4: Helper Functions
// ============================================================================

// ============================================================================
// SECTION 5: Default Export
// ============================================================================
export default { meta, run };
```

---

## Critical Implementation Rules

1. **Only runner.ts writes to manifest** - Modules return `newAssets`, never write directly
2. **Absolute paths only** - Use `FileSystem.cwd().absolutePath` for all file operations
3. **Native APIs for networking** - Use `Networking.*` instead of shell commands (except Python wrappers)
4. **UI class for all output** - No direct `println()` calls
5. **Parent relationships** - Discovery modules set `parent` on newAssets to track provenance
6. **History logging** - Runner automatically adds history entries with timestamp, module, target, result

---

## Color Palette Usage

| Usage | Color | Applied In |
|-------|-------|------------|
| Targets, external IPs | `rgb(255, 0, 179)` (pink) | scanner target display |
| Info messages | `rgb(30, 191, 255)` (cyan) | ui.info() |
| Success, open ports | `#22c55e` (green) | ui.success(), open port status |
| Warnings | `#f59e0b` (orange) | ui.warn(), forwarded ports |
| Errors, closed ports | `#ff4c4cff` (red) | ui.error(), closed port status |
| Internal IPs, counts | `rgba(195, 105, 255, 0.86)` (purple) | geoip coordinates |

---

## Validation Steps

Per-module test execution:
```bash
node tests/test-milestone-2.ts test-scanner    # 9 tests
node tests/test-milestone-2.ts test-nettree    # 8 tests
node tests/test-milestone-2.ts test-geoip      # 8 tests
node tests/test-milestone-2.ts test-dig        # 13 tests
```

Full integration:
```bash
node tests/test-milestone-2.ts full-test       # 53 tests
```

Expected: **53/53 PASS**

---

## Dependencies Graph

```
lib/types.ts (from M1)
    ↓
lib/ui.ts (from M1)
    ↓
lib/python.ts (NEW)
    ↓
modules/recon/scanner.ts (Networking API)
    ↓
modules/recon/nettree.ts (depends on python.ts)
    ↓
modules/recon/geoip.ts (no deps)
    ↓
modules/recon/dig.ts (no deps)
    ↓
nine.ts (imports all modules)
```

---

## Phase 3: Update nine.ts

Replace inline mock modules with real imports:

```typescript
// Remove mock definitions and replace with:
import * as scanner from "./modules/recon/scanner";
import * as nettree from "./modules/recon/nettree";
import * as geoip from "./modules/recon/geoip";
import * as dig from "./modules/recon/dig";

// Update MODULES registry:
const MODULES: Record<string, { module: any; aliases: string[] }> = {
  scan: { module: scanner, aliases: ["-s", "--scan"] },
  nettree: { module: nettree, aliases: ["-n", "--nettree"] },
  geoip: { module: geoip, aliases: ["-g", "--geoip"] },
  dig: { module: dig, aliases: ["-d", "--dig"] },
};

// Add command handlers for geoip and dig in switch statement
```

Update `showHelp()` to include new commands:
```typescript
ui.print("  scan", "Port scanning on targets");
ui.print("  nettree", "Network discovery");
ui.print("  geoip", "Geolocation lookup");
ui.print("  dig", "DNS lookup");
```

---

## Post-Implementation Checklist

- [ ] `mkdir -p modules/recon` executed
- [ ] `lib/python.ts` created with `ensurePythonScript()` and `runPythonModule()`
- [ ] All 4 modules created in `modules/recon/`
- [ ] Each module has 6 standard sections with `// @ts-nocheck` header
- [ ] Each module exports `meta` and `run`
- [ ] Each module has `resolveTargets()` or `resolveDomain()` helper
- [ ] `nine.ts` updated to import real modules (not mocks)
- [ ] `nine.ts` MODULES registry includes all 4 modules with aliases
- [ ] `nine.ts` showHelp() updated with geoip and dig commands
- [ ] No direct manifest writes from modules
- [ ] Absolute paths used throughout (`FileSystem.cwd().absolutePath`)
- [ ] Parent relationships set for discovered assets (nettree, dig)
- [ ] Color palette followed (pink for IPs, green for success, etc.)
- [ ] History entries include: timestamp, module, target, action, result
- [ ] All 53 tests passing on HackHub: `node tests/test-milestone-2.ts full-test`
- [ ] `/audit --full M2` → 10/10 compliance points
