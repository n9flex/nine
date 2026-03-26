# Milestone 1: Foundation - Implementation Plan

Implement the 8 core infrastructure files for Nine CLI v0.1.0 to pass the existing `tests/test-milestone-1.ts` (49/49 tests).

---

## Context

**Test Status**: Already implemented at `c:\Users\mathias.aveneau\Documents\GIT\nine\tests\test-milestone-1.ts` (1150 lines, 49 tests)
**Target**: All tests pass on HackHub after implementation
**Architecture**: Mission-centric penetration testing toolkit with centralized manifest

---

## Implementation Order (Dependency Chain)

```
lib/types.ts (0 deps)
    ↓
lib/ui.ts (0 deps - uses global println)
    ↓
lib/storage.ts (FileSystem API)
    ↓
lib/utils.ts (0 deps)
    ↓
core/mission.ts (types + storage + utils)
    ↓
core/session.ts (storage)
    ↓
core/runner.ts (types + storage + utils + mission)
    ↓
nine.ts (all)
```

---

## Tasks

### Task 1: lib/types.ts - Type Definitions

**Description**: Define all TypeScript interfaces for the mission-centric data model.

**Files affected**:
- `c:\Users\mathias.aveneau\Documents\GIT\nine\lib\types.ts` (new)

**Exports**:
```typescript
export interface PortInfo { port: number; state: "open" | "closed" | "filtered" | "forwarded"; service: string; version?: string; forwarded?: { externalPort: number; internalPort: number; targetIp?: string }; }
export interface Seed { value: string; type: "ip" | "domain" | "email" | "cidr"; addedAt: string; resolvedIp?: string; }
export interface IPAsset { value: string; status: "discovered" | "scanned" | "exploited" | "pwned"; deviceType?: "router" | "firewall" | "printer" | "server" | "workstation" | "unknown"; ports: PortInfo[]; parent?: string; discoveredBy: string; discoveredAt: string; notes?: string; }
export interface DomainAsset { value: string; source: "seed" | "subfinder" | "lynx" | "dns"; parent?: string; resolvedIp?: string; vulnerable?: boolean; discoveredAt: string; }
export interface HistoryEntry { timestamp: string; module: string; target?: string; action: string; result: "success" | "failure" | "partial"; data?: unknown; }
export interface MissionManifest { name: string; created: string; updated: string; seeds: Seed[]; assets: { ips: IPAsset[]; domains: DomainAsset[]; emails: string[]; credentials: Array<{user: string; pass: string; source: string}>; hashes: string[]; ntlmHashes: Array<{ip: string; username: string; hash: string; cracked?: string; dumpedAt: string}>; sessions: Array<{type: "jwt" | "cookie" | "token" | "api_key"; value: string; source: string; target: string; extractedAt: string; decoded?: unknown}>; files: string[]; }; history: HistoryEntry[]; }
export interface ModuleMeta { name: string; command: string; description: string; requires: string[]; inputs: string[]; outputs: string[]; }
export interface ModuleResult { success: boolean; data?: unknown; newAssets?: Array<{ type: "ip" | "domain" | "email" | "credential" | "hash" | "session"; value: unknown; parent?: string }>; }
export type ModuleFunction = (mission: MissionManifest, ui: UI, args?: string[]) => Promise<ModuleResult>;
```

**Acceptance criteria**:
```bash
# File must exist and export all interfaces
node -e "console.log('types.ts: OK')"
```

---

### Task 2: lib/ui.ts - UI Class with Color Palette

**Description**: Implement UI class for all console output with standardized colors.

**Files affected**:
- `c:\Users\mathias.aveneau\Documents\GIT\nine\lib\ui.ts` (new)

**Requirements**:
- `UI.ctx()` - singleton pattern returning UI instance
- `info(msg)`, `success(msg)`, `warn(msg)`, `error(msg)` - colored messages
- `section(title)`, `divider()` - layout helpers
- `print(label, value?, colors?)` - key-value pairs
- `table(headers, rows)` - data tables
- Color palette constant with: white, gray, pink, cyan, green, orange, red, purple, yellow

**Acceptance criteria**:
```bash
node -e "const {UI} = require('./lib/ui.ts'); const ui = UI.ctx(); ui.success('test'); console.log('ui.ts: OK')"
```

---

### Task 3: lib/storage.ts - JSON File Operations

**Description**: File system helpers using HackHub's native FileSystem API with absolute paths.

**Files affected**:
- `c:\Users\mathias.aveneau\Documents\GIT\nine\lib\storage.ts` (new)

**Exports**:
```typescript
export async function readJson<T>(path: string): Promise<T | null>
export async function writeJson(path: string, data: unknown): Promise<void>
export async function fileExists(path: string): Promise<boolean>
export async function deleteFile(path: string): Promise<void>
export async function ensureDir(path: string): Promise<void>
```

**Critical Rule**: Always use absolute paths
```typescript
const cwd = await FileSystem.cwd();
const path = `${cwd.absolutePath}/loot/${mission}/manifest.json`;
```

**Acceptance criteria**:
```bash
node tests/test-milestone-1.ts test-storage
# Expected: test-storage PASSED
```

---

### Task 4: lib/utils.ts - Asset Deduplication

**Description**: Utility functions for asset management and validation.

**Files affected**:
- `c:\Users\mathias.aveneau\Documents\GIT\nine\lib\utils.ts` (new)

**Exports**:
```typescript
export function dedupeAssets<T extends { value: string }>(existing: T[], newAssets: Array<{ type: string; value: unknown; parent?: string }>): { unique: Array<{ type: string; value: unknown; parent?: string }>; duplicates: string[] }
export function validateIp(ip: string): boolean
export function sanitizeMissionName(name: string): string
export function getCurrentTimestamp(): string
```

**Acceptance criteria**:
```bash
node tests/test-milestone-1.ts test-utils
# Expected: test-utils PASSED
```

---

### Task 5: core/mission.ts - MissionManager

**Description**: Mission lifecycle management (create, load, save).

**Files affected**:
- `c:\Users\mathias.aveneau\Documents\GIT\nine\core\mission.ts` (new)

**Exports**:
```typescript
export async function createManifest(missionName: string, seeds: string[], cwdAbsolute: string): Promise<MissionManifest>
export async function loadManifest(missionName: string, cwdAbsolute: string): Promise<MissionManifest | null>
export async function saveManifest(manifest: MissionManifest, cwdAbsolute: string): Promise<void>
```

**Behavior**:
- Seed IPs → auto-added to `assets.ips` with status "discovered"
- Seed domains → stored in `seeds[]` only
- Use `sanitizeMissionName()` for safe directory names

**Acceptance criteria**:
```bash
node tests/test-milestone-1.ts test-mission
# Expected: test-mission PASSED (8 sub-tests)
```

---

### Task 6: core/session.ts - Session Persistence

**Description**: Track current mission via `.current_mission` file.

**Files affected**:
- `c:\Users\mathias.aveneau\Documents\GIT\nine\core\session.ts` (new)

**Exports**:
```typescript
export async function getCurrentMission(cwdAbsolute: string): Promise<{ mission: string; attachedAt: string } | null>
export async function setCurrentMission(mission: string, cwdAbsolute: string): Promise<void>
export async function clearCurrentMission(cwdAbsolute: string): Promise<void>
```

**Session file location**: `loot/.current_mission`

**Acceptance criteria**:
```bash
node tests/test-milestone-1.ts test-session
# Expected: test-session PASSED (5 sub-tests)
```

---

### Task 7: core/runner.ts - Module Runner

**Description**: Execute modules with manifest update logic. **ONLY runner writes to manifest**.

**Files affected**:
- `c:\Users\mathias.aveneau\Documents\GIT\nine\core\runner.ts` (new)

**Exports**:
```typescript
export async function executeModule(
  module: { meta: ModuleMeta; run: ModuleFunction },
  mission: MissionManifest,
  cwdAbsolute: string,
  args?: string[],
  ui?: UI
): Promise<ModuleResult>
```

**Critical Logic**:
1. Call `module.run(mission, ui, args)` → get result
2. Deduplicate `result.newAssets` against existing assets
3. Add unique assets to `mission.assets[asset.type + 's']`
4. Push history entry: `{ module: meta.name, result, timestamp, ... }`
5. Save manifest via `saveManifest()`
6. Return result

**Acceptance criteria**:
```bash
node tests/test-milestone-1.ts test-runner
# Expected: test-runner PASSED (6 sub-tests)
```

---

### Task 8: nine.ts - CLI Dispatcher

**Description**: Main entry point with command routing.

**Files affected**:
- `c:\Users\mathias.aveneau\Documents\GIT\nine\nine.ts` (new)

**Commands**:
- `nine create <mission> [seeds...]` - Create mission with optional seeds
- `nine attach <mission>` - Attach to mission
- `nine detach` - Detach current mission
- `nine status` - Show mission summary
- `nine scan [ip]` - Mock scanner module for testing
- `nine nettree [ip]` - Mock nettree module for testing

**Module Registration Pattern**:
```typescript
const MODULES: Record<string, { module: any; aliases: string[] }> = {
  scan: { module: scanner, aliases: ["-s", "--scan"] },
  nettree: { module: nettree, aliases: ["-n", "--nettree"] },
};
```

**Acceptance criteria**:
```bash
node tests/test-milestone-1.ts test-cli
# Expected: test-cli PASSED (7 sub-tests)
```

---

### Task 9: Full Integration Test

**Description**: Run complete test suite to verify all 49 tests pass.

**Acceptance criteria**:
```bash
node tests/test-milestone-1.ts full-test
# Expected: 49/49 PASS
```

---

## Critical Architecture Rules (NEVER Break)

1. **Only runner.ts writes to manifest** - Modules return `newAssets`, never write directly
2. **Native HackHub APIs only** - Never `Shell.Process.exec()` for standard ops
3. **Absolute paths** - `FileSystem.cwd().absolutePath` /paths
4. **UI class for output** - No raw `println()`
5. **English code** - camelCase, PascalCase types, UPPER_SNAKE_CASE constants

---

## File References

| Document | Purpose |
|----------|---------|
| `c:\Users\mathias.aveneau\Documents\GIT\nine\.windsurf\context\M1.md` | Milestone 1 detailed specs |
| `c:\Users\mathias.aveneau\Documents\GIT\nine\.windsurf\skills\nine-cli\SKILL.md` | Patterns and standards |
| `c:\Users\mathias.aveneau\Documents\GIT\nine\tests\test-milestone-1.ts` | Test validation (already implemented) |

---

## Plan Review

**Self-review**: PASS  
**Confidence**: High - test already exists, clear implementation order  
**Known gaps**: None - all interfaces and patterns documented
