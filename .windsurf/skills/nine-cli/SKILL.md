---
name: nine-cli
description: Mission-centric penetration testing toolkit for HackHub v0.1.0. Use this skill when working on the Nine CLI refacto project to maintain code quality, architecture consistency, and avoid common mistakes.
---

# Nine CLI v0.1.0 - Development Skill

## Core Philosophy

**Mission = Container of truth.** All data lives under a named mission. Attach once, run anywhere.

## Architecture Rules (CRITICAL)

### 1. Module Structure (6 Standard Sections)

Every module MUST follow this exact structure:

```typescript
// @ts-nocheck
// 1. Imports
import { UI } from "../../lib/ui";
import { MissionManifest } from "../../lib/types";

// 2. Module metadata
export const meta = {
  name: "scanner",           // Unique identifier
  command: "scan",         // CLI command
  description: "Port scanning module",
  requires: [],            // Required modules to have run first
  inputs: [],              // Data needed from manifest.assets
  outputs: ["ports"],      // Data produced for manifest
};

// 3. Core logic
export async function run(
  mission: MissionManifest,
  ui: UI,
  args?: string[]          // Optional additional args
): Promise<{
  success: boolean;
  data?: any;               // Stored in manifest.history by runner
  newAssets?: Array<{      // Runner auto-adds to manifest.assets
    type: "ip" | "domain" | "email" | "credential" | "hash" | "session";
    value: any;
    parent?: string;
  }>;
}> {
  // Implementation using native HackHub APIs
  // Return newAssets for runner to dedupe and add to manifest
}
```

### 2. Only runner.ts Writes to Manifest

- **NEVER** write to manifest directly from modules
- Modules return `newAssets`, runner handles persistence with deduplication
- All paths must be absolute: `FileSystem.cwd().absolutePath`

### 3. API Usage Rules

**ALWAYS use native HackHub APIs. NEVER use Shell.Process.exec() for standard operations:**

```typescript
// CORRECT
const subnet = await Networking.GetSubnet(ip);
const ports = await subnet.GetPorts();

// WRONG - Never do this
await Shell.Process.exec(`nmap ${ip}`);
```

**Exception:** Python wrappers (nettree, etc.) may use `Shell.Process.exec()` to run downloaded scripts.

## Code Hygiene Standards

### File Organization

```
nine/
├── core/                    # Core infrastructure only
│   ├── mission.ts          # MissionManager
│   ├── session.ts          # Session persistence
│   └── runner.ts           # Module runner
├── lib/                     # Shared utilities
│   ├── types.ts            # All interfaces (PortInfo, MissionManifest)
│   ├── ui.ts               # UI system with color palette
│   ├── storage.ts          # JSON read/write helpers
│   └── utils.ts            # Asset deduplication helpers
├── modules/                 # All modules organized by category
│   ├── recon/              # Reconnaissance modules
│   ├── enum/               # Enumeration modules
│   └── vuln/               # Vulnerability modules
├── tests/                   # Flat structure, standalone tests
└── loot/                    # Mission data storage
```

### Code Style (ENGLISH ONLY)

- **All code must be in English**
- **Comments use // Section format for major sections**
- **Functions: camelCase**
- **Classes: PascalCase**
- **Constants: UPPER_SNAKE_CASE**
- **Types/Interfaces: PascalCase with descriptive names**

Example:
```typescript
// ============================================================================
// SECTION: Module Metadata
// ============================================================================

export const meta = {
  name: "scanner",
  command: "scan",
  description: "Port scanning with native Networking API",
  requires: [],
  inputs: [],
  outputs: ["ports"],
};

// ============================================================================
// SECTION: Core Logic
// ============================================================================

export async function run(
  mission: MissionManifest,
  ui: UI,
  args?: string[]
): Promise<ModuleResult> {
  // Target resolution logic
  const targets = resolveTargets(mission, args, "ip");
  
  // Main processing
  const results = await scanTargets(targets, ui);
  
  // Return format for runner integration
  return {
    success: results.length > 0,
    data: { scanned: results },
    newAssets: extractNewAssets(results),
  };
}
```

### UI Standards (lib/ui.ts)

**ALWAYS use UI class. Never direct println.**

```typescript
const ui = UI.ctx();

// Messages
ui.info("Informational message");
ui.success("Success message");
ui.warn("Warning message");
ui.error("Error message");

// Layout
ui.section("SECTION TITLE");
ui.divider();

// Tables
ui.table(["Column1", "Column2"], rows, {
  rowColor: (row) => row.status === "OPEN" ? "green" : "red",
});

// Key-value pairs
ui.printColumns("Label", "Value", { leftColor: "white", rightColor: "cyan" });
```

**Color Palette:**
- `white` - Labels, neutral text
- `gray` - Secondary info
- `pink` (rgb(255, 0, 179)) - Targets, external IPs
- `cyan` (rgb(30, 191, 255)) - Shells, interactive elements
- `green` (#22c55e) - Success, open ports
- `orange` (#f59e0b) - Warnings, forwarded ports
- `red` (#ff4c4cff) - Errors, closed ports
- `purple` (rgba(195, 105, 255, 0.86)) - Internal IPs, counts
- `yellow` (#fbbf24) - Testing state

## Common Mistakes to AVOID

### 1. Data Flow Errors

```typescript
// WRONG: Module writing directly to manifest
await FileSystem.WriteFile(`loot/${mission.name}/manifest.json`, JSON.stringify(manifest));

// CORRECT: Return data, let runner handle it
return {
  success: true,
  data: { ports: scannedPorts },
  newAssets: [{ type: "ip", value: "192.168.1.1" }],
};
```

### 2. Target Resolution Errors

```typescript
// WRONG: Ignoring mission state
const target = args[0] || "192.168.1.1";  // Hardcoded fallback

// CORRECT: Use mission assets when no target specified
function resolveTargets(mission: MissionManifest, args: string[], type: string): string[] {
  if (args && args.length > 0) {
    return args;
  }
  // Default: use mission assets with appropriate status
  return mission.assets.ips
    .filter(ip => ip.status === "discovered")
    .map(ip => ip.value);
}
```

### 3. API Misuse

```typescript
// WRONG: Using shell commands for native operations
const output = await Shell.Process.exec(`nmap ${ip} -sV`);
const ports = parseNmapOutput(output);  // Fragile parsing

// CORRECT: Use HackHub native Networking API
const subnet = await Networking.GetSubnet(ip);
const ports = await subnet.GetPorts();
for (const port of ports) {
  const data = await subnet.GetPortData(port);
  // data.service, data.version, data.external, data.internal
}
```

### 4. Path Handling

```typescript
// WRONG: Relative paths
await FileSystem.ReadFile(`loot/${mission}/manifest.json`);

// CORRECT: Absolute paths
const cwd = await FileSystem.cwd();
await FileSystem.ReadFile(`${cwd.absolutePath}/loot/${mission}/manifest.json`);
```

## Testing Strategy (One Big Test Per Milestone)

### Philosophy

Write **one comprehensive test file per milestone** that validates the ENTIRE milestone functionality end-to-end. This test runs on HackHub BEFORE any implementation.

### Test File Naming

```
tests/
├── test-milestone-1.ts      # Tests all of Milestone 1 (Foundation)
├── test-milestone-2.ts      # Tests all of Milestone 2 (Reconnaissance)
├── test-milestone-3.ts      # Tests all of Milestone 3 (Enumeration)
└── test-milestone-4.ts      # Tests all of Milestone 4 (Vulnerability & Reporting)
```

### Test Structure

Each milestone test is a standalone file that:
1. Tests ALL components of that milestone
2. Uses real HackHub APIs
3. Validates success and error cases
4. Outputs clear pass/fail per sub-system

```typescript
// tests/test-milestone-1.ts
// ============================================================================
// MILESTONE 1: Foundation - Comprehensive Test
// Tests: types, ui, storage, utils, mission, session, runner, nine.ts
// ============================================================================

async function runAllTests(): Promise<void> {
  const ui = UI.ctx();
  ui.section("MILESTONE 1: FOUNDATION TESTS");
  
  const results = {
    types: await testTypes(),
    ui: await testUI(),
    storage: await testStorage(),
    utils: await testUtils(),
    mission: await testMissionManager(),
    session: await testSession(),
    runner: await testRunner(),
    cli: await testCLI(),
  };
  
  // Summary
  ui.divider();
  const passed = Object.values(results).filter(r => r).length;
  const total = Object.keys(results).length;
  
  if (passed === total) {
    ui.success(`ALL TESTS PASSED: ${passed}/${total}`);
  } else {
    ui.error(`TESTS FAILED: ${passed}/${total}`);
    ui.info("Failed components:");
    for (const [name, result] of Object.entries(results)) {
      if (!result) ui.error(`  - ${name}`);
    }
  }
}

// ============================================================================
// SECTION: Types Test
// ============================================================================

async function testTypes(): Promise<boolean> {
  const ui = UI.ctx();
  ui.info("Testing: lib/types.ts");
  
  try {
    // Import and validate all interfaces exist
    // Validate MissionManifest structure
    // Validate PortInfo structure
    // Test type exports
    ui.success("PASS: types");
    return true;
  } catch (err) {
    ui.error(`FAIL: types - ${err}`);
    return false;
  }
}

// ============================================================================
// SECTION: UI Test
// ============================================================================

async function testUI(): Promise<boolean> {
  const ui = UI.ctx();
  ui.info("Testing: lib/ui.ts");
  
  try {
    // Test UI.ctx() returns instance
    // Test all output methods (info, success, warn, error)
    // Test table rendering
    // Test color palette
    ui.success("PASS: ui");
    return true;
  } catch (err) {
    ui.error(`FAIL: ui - ${err}`);
    return false;
  }
}

// ============================================================================
// SECTION: Storage Test
// ============================================================================

async function testStorage(): Promise<boolean> {
  const ui = UI.ctx();
  ui.info("Testing: lib/storage.ts");
  
  try {
    // Test JSON read/write
    // Test recursive directory creation
    // Test absolute path handling
    ui.success("PASS: storage");
    return true;
  } catch (err) {
    ui.error(`FAIL: storage - ${err}`);
    return false;
  }
}

// ============================================================================
// SECTION: Utils Test
// ============================================================================

async function testUtils(): Promise<boolean> {
  const ui = UI.ctx();
  ui.info("Testing: lib/utils.ts");
  
  try {
    // Test dedupeAssets() with duplicates
    // Test dedupeAssets() with unique items
    // Test validation helpers
    ui.success("PASS: utils");
    return true;
  } catch (err) {
    ui.error(`FAIL: utils - ${err}`);
    return false;
  }
}

// ============================================================================
// SECTION: MissionManager Test
// ============================================================================

async function testMissionManager(): Promise<boolean> {
  const ui = UI.ctx();
  ui.info("Testing: core/mission.ts");
  
  try {
    // Test create() - creates manifest with seeds
    // Test attach() - loads existing mission
    // Test detach() - clears current mission
    // Test loadManifest() - reads from disk
    // Test manifest structure compliance
    ui.success("PASS: mission");
    return true;
  } catch (err) {
    ui.error(`FAIL: mission - ${err}`);
    return false;
  }
}

// ============================================================================
// SECTION: Session Test
// ============================================================================

async function testSession(): Promise<boolean> {
  const ui = UI.ctx();
  ui.info("Testing: core/session.ts");
  
  try {
    // Test getCurrentMission() - reads .current_mission
    // Test setCurrentMission() - writes .current_mission
    // Test clearCurrentMission() - removes .current_mission
    ui.success("PASS: session");
    return true;
  } catch (err) {
    ui.error(`FAIL: session - ${err}`);
    return false;
  }
}

// ============================================================================
// SECTION: Runner Test
// ============================================================================

async function testRunner(): Promise<boolean> {
  const ui = UI.ctx();
  ui.info("Testing: core/runner.ts");
  
  try {
    // Test execute() - runs module with manifest
    // Test newAssets deduplication
    // Test manifest history updates
    // Test only runner writes to manifest
    ui.success("PASS: runner");
    return true;
  } catch (err) {
    ui.error(`FAIL: runner - ${err}`);
    return false;
  }
}

// ============================================================================
// SECTION: CLI Dispatcher Test
// ============================================================================

async function testCLI(): Promise<boolean> {
  const ui = UI.ctx();
  ui.info("Testing: nine.ts CLI dispatcher");
  
  try {
    // Test create command
    // Test attach command
    // Test status command
    // Test show command
    // Test module execution flow
    ui.success("PASS: cli");
    return true;
  } catch (err) {
    ui.error(`FAIL: cli - ${err}`);
    return false;
  }
}

// ============================================================================
// ENTRY POINT
// ============================================================================

runAllTests();
```

### Workflow: Test → Validate → Implement

1. **Write milestone test** - Create comprehensive test for entire milestone
2. **Validate on HackHub** - Copy test to HackHub, verify all APIs work as expected
3. **Implement** - Write actual code based on validated test expectations
4. **Verify** - Run implementation on HackHub to confirm it works

### Validation Checklist (BEFORE Implementation)

For each milestone:
- [ ] Test file compiles and runs on HackHub
- [ ] All APIs used exist and return expected data
- [ ] File paths work with absolute paths
- [ ] Manifest structure matches spec
- [ ] Error handling covers edge cases
- [ ] All sub-systems report pass status

Once test passes on HackHub, implement the milestone.

## Mission Manifest Structure

**CRITICAL: Always maintain this exact structure:**

```typescript
interface MissionManifest {
  name: string;
  created: string;
  updated: string;
  
  seeds: Array<{
    value: string;
    type: "ip" | "domain" | "email" | "cidr";
    addedAt: string;
    resolvedIp?: string;
  }>;
  
  assets: {
    ips: Array<{
      value: string;
      status: "discovered" | "scanned" | "exploited" | "pwned";
      deviceType?: "router" | "firewall" | "printer" | "server" | "workstation" | "unknown";
      ports: PortInfo[];
      parent?: string;
      discoveredBy: string;
      discoveredAt: string;
      notes?: string;
    }>;
    domains: Array<{
      value: string;
      source: "seed" | "subfinder" | "lynx" | "dns";
      parent?: string;
      resolvedIp?: string;
      vulnerable?: boolean;
      discoveredAt: string;
    }>;
    emails: string[];
    credentials: Array<{user: string; pass: string; source: string}>;
    hashes: string[];
    ntlmHashes: Array<{
      ip: string;
      username: string;
      hash: string;
      cracked?: string;
      dumpedAt: string;
    }>;
    sessions: Array<{
      type: "jwt" | "cookie" | "token" | "api_key";
      value: string;
      source: string;
      target: string;
      extractedAt: string;
      decoded?: any;
    }>;
    files: string[];
  };
  
  history: Array<{
    timestamp: string;
    module: string;
    target?: string;
    action: string;
    result: "success" | "failure" | "partial";
    data?: any;
  }>;
}
```

## Milestone 1 Implementation Order

1. **lib/types.ts** - Define all interfaces
2. **lib/ui.ts** - UI class with color palette
3. **lib/storage.ts** - JSON read/write helpers
4. **lib/utils.ts** - dedupeAssets() helper
5. **core/mission.ts** - MissionManager
6. **core/session.ts** - Session persistence
7. **core/runner.ts** - Module runner
8. **nine.ts** - CLI dispatcher
9. **tests/** - All tests (write first!)

## Critical Review Questions

Before accepting any code proposal, verify:

1. **Does it follow the 6-section module structure?**
2. **Does it use native APIs instead of shell exec?** (except Python wrappers)
3. **Does it return newAssets instead of writing directly to manifest?**
4. **Are all paths absolute?**
5. **Is the code in English with clear section comments?**
6. **Does it use UI class for all output?**
7. **Are types properly defined and imported?**
8. **Does it handle errors gracefully?**
9. **Is the logic properly separated (core/lib/modules)?**
10. **Does it follow the color palette for UI?**

## Module Registration Pattern

```typescript
// nine.ts
import * as scanner from "./modules/recon/scanner";
import * as nettree from "./modules/recon/nettree";

const MODULES: Record<string, { module: any; aliases: string[] }> = {
  scan: { module: scanner, aliases: ["-s", "--scan"] },
  nettree: { module: nettree, aliases: ["-n", "--nettree"] },
};

// Dispatcher logic
const command = args[0];
const target = args[1];  // Optional target

if (MODULES[command]) {
  const { module } = MODULES[command];
  const mission = await session.getCurrentMission();
  if (!mission) {
    ui.error("No mission attached. Run: nine attach <mission>");
    return;
  }
  
  const result = await runner.execute(module, mission, [target]);
  // runner handles manifest updates
}
```

## Python Module Wrapper Pattern

```typescript
// modules/recon/nettree.ts
import { runPythonModule } from "../../lib/python";

export const meta = {
  name: "nettree",
  command: "nettree",
  description: "Network topology discovery",
  requires: [],
  inputs: ["ip"],
  outputs: ["ips", "topology"],
};

export async function run(
  mission: MissionManifest,
  ui: UI,
  args?: string[]
): Promise<ModuleResult> {
  const targets = resolveTargets(mission, args, "ip");
  const newAssets: NewAsset[] = [];
  
  for (const target of targets) {
    ui.info(`Running nettree on ${target}...`);
    
    const result = await runPythonModule("net_tree.py", [target], {
      checkLib: "python3",
      timeout: 60000,
      parseJson: true,
    });
    
    if (!result.success) {
      ui.error(`Nettree failed: ${result.error}`);
      continue;
    }
    
    // Parse discovered IPs from result.data
    if (result.data && result.data.devices) {
      for (const device of result.data.devices) {
        newAssets.push({
          type: "ip",
          value: device.ip,
          parent: target,
        });
      }
    }
  }
  
  return {
    success: newAssets.length > 0,
    data: { discovered: newAssets.length },
    newAssets,
  };
}
```

## Summary

**When working on Nine CLI v0.1.0:**
1. **Write ONE big test per milestone FIRST** - validate on HackHub before implementation
2. Use native HackHub APIs (Networking, FileSystem, etc.)
3. Follow 6-section module structure
4. Never write to manifest directly - return newAssets
5. All paths absolute
6. English code with section comments
7. UI class for all output
8. Verify against critical review questions
