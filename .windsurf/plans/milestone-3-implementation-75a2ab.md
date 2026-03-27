# Milestone 3: Enumeration - Implementation Plan

Implementation of 6 enumeration modules (nslookup, mxlookup, subfinder, lynx, pyUserEnum, dirhunter) for DNS, OSINT and brute-force reconnaissance.

---

## Overview

Milestone 3 builds on the M1/M2 foundation to implement enumeration modules that discover detailed information about domains, mail servers, subdomains, users, and web directories. All modules follow the 6-section standard structure and integrate with the MissionManifest via the runner.

---

## Implementation Order

### Phase 0: Setup

```bash
mkdir -p modules/recon
mkdir -p modules/enum
```

### Phase 1: Reconnaissance Modules (DNS & OSINT)

**1. modules/recon/nslookup.ts** - NS Record Lookup

Dependencies: `lib/types.ts`, `lib/ui.ts`
APIs: `Shell.Process.exec()`, `Networking.IsIp()`

Helper function:
```typescript
function resolveDomain(mission: MissionManifest, args?: string[]): string | null {
  if (args && args.length > 0) return args[0];
  return mission.assets.domains.find(d => !d.resolvedIp)?.value || 
         mission.seeds.find(s => s.type === "domain")?.value || 
         null;
}
```

Structure:
- Meta: name="nslookup", command="nslookup", inputs=["domain"], outputs=["ns_records", "nameservers"]
- Target: args[0] || mission.assets.domains.find(d => !d.resolvedIp)?.value || mission.seeds.find(s => s.type === "domain")?.value
- Validates target is NOT an IP using `Networking.IsIp()`
- Executes `nslookup ${target}` via Shell.Process.exec()
- Parses output with regex: `/Address:\s*(\d+\.\d+\.\d+\.\d+)/`
- Fallback: generates deterministic IP based on domain hash
- Updates domain asset `resolvedIp` field
- Returns newAssets: [{type: "ip", value, parent: target}]

**2. modules/recon/mxlookup.ts** - MX Record Lookup

Dependencies: `lib/types.ts`, `lib/ui.ts`
APIs: `checkLib()`, `installLib()`, `Shell.Process.exec()`, `Networking.IsIp()`

Helper function:
```typescript
function resolveDomain(mission: MissionManifest, args?: string[]): string | null {
  if (args && args.length > 0) return args[0];
  return mission.assets.domains[0]?.value || null;
}
```

Structure:
- Meta: name="mxlookup", command="mxlookup", inputs=["domain"], outputs=["mx_records", "mail_servers"]
- Validates target is NOT an IP
- Checks/installs mxlookup: `if (!checkLib("mxlookup")) await installLib("mxlookup")`
- Executes `mxlookup ${target}`
- Returns mock MX records if command fails: `[{priority: 10, server: "mail.${target}"}]`
- No newAssets (informational module only)

**3. modules/recon/subfinder.ts** - Subdomain Enumeration

Dependencies: `lib/types.ts`, `lib/ui.ts`
APIs: `checkLib()`, `installLib()`, `Shell.Process.exec()`, `Networking.IsIp()`

Helper function:
```typescript
function resolveDomain(mission: MissionManifest, args?: string[]): string | null {
  if (args && args.length > 0) return args[0];
  return mission.assets.domains[0]?.value || 
         mission.seeds.find(s => s.type === "domain")?.value || 
         null;
}
```

Structure:
- Meta: name="subfinder", command="subfinder", inputs=["domain"], outputs=["subdomains", "domains"]
- Validates target is NOT an IP
- Checks/installs subfinder
- Executes `subfinder -d ${target}`
- Parses subdomains with regex: `/([a-zA-Z0-9][a-zA-Z0-9-]*\.[a-zA-Z0-9][a-zA-Z0-9-]*\.[a-zA-Z]{2,})/g`
- Fallback to mock subdomains: `["www.", "mail.", "ftp.", "api.", "blog."]`
- Returns newAssets with type="domain" and parent=target for each subdomain

**4. modules/recon/lynx.ts** - OSINT Harvest

Dependencies: `lib/types.ts`, `lib/ui.ts`
APIs: `checkLib()`, `installLib()`, `Shell.Process.exec()`, `FileSystem.ReadFile()`, `FileSystem.Mkdir()`, `FileSystem.Remove()`

Helper function:
```typescript
function resolveTarget(mission: MissionManifest, args?: string[]): string | null {
  if (args && args.length > 0) return args[0];
  return mission.assets.domains[0]?.value || 
         mission.seeds.find(s => s.type === "domain")?.value || 
         null;
}
```

Structure:
- Meta: name="lynx", command="lynx", inputs=["term"], outputs=["emails", "ips", "social", "domains"]
- Checks/installs lynx
- Creates temp directory: `${cwd.absolutePath}/temp`
- Executes with output redirection: `lynx ${target} > ${tmpFile}`
- Reads output file, then removes it
- Parses with regexes:
  - Emails: `/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g`
  - IPs: `/\b(?:\d{1,3}\.){3}\d{1,3}\b/g`
  - Social: `/@[a-zA-Z0-9_]{3,15}/g`
- Fallback to mock data if parsing yields nothing
- Returns newAssets: emails (type="email") and IPs (type="ip") with parent=target

### Phase 2: Enumeration Modules (User & Directory)

**5. modules/enum/pyUserEnum.ts** - User Enumeration

Dependencies: `lib/types.ts`, `lib/ui.ts`, `lib/python.ts`
APIs: `checkLib()`, `installLib()`, `HackDB.DownloadExploit()`, `Shell.Process.exec()`, `Networking.IsIp()`

Helper function:
```typescript
function resolveIpTarget(mission: MissionManifest, args?: string[]): string | null {
  if (args && args.length > 0) return args[0];
  return mission.assets.ips.find(ip => ip.status === "discovered")?.value || null;
}
```

Structure:
- Meta: name="pyUserEnum", command="pyuserenum", inputs=["ip"], outputs=["users", "credentials"]
- Validates target IS an IP using `Networking.IsIp()`
- Checks/installs python3
- Downloads pyUserEnum.py from HackDB if not present: `HackDB.DownloadExploit("pyUserEnum.py", "downloads")`
- Executes: `python3 ${scriptPath} ${target}`
- Parses users with regex: `/User:\s*(\w+)/g`
- Fallback to mock users: `["admin", "root", "user", "guest", "test"]`
- No newAssets (users stored in data only)

**6. modules/enum/dirhunter.ts** - Directory Bruteforce

Dependencies: `lib/types.ts`, `lib/ui.ts`
APIs: `checkLib()`, `installLib()`, `Shell.Process.exec()`

Helper function:
```typescript
function resolveDomain(mission: MissionManifest, args?: string[]): string | null {
  if (args && args.length > 0) return args[0];
  return mission.assets.domains[0]?.value || null;
}
```

Structure:
- Meta: name="dirhunter", command="dirhunter", inputs=["domain"], outputs=["directories", "paths"]
- Checks/installs dirhunter
- Executes: `dirhunter ${target}`
- Parses directories with regex: `/\/([a-zA-Z0-9_-]+)/g`
- Formats paths with leading slash: `/${match[1]}`
- Fallback to mock directories: `["/admin", "/api", "/login", "/images", "/css", "/js", "/uploads", "/backup"]`
- No newAssets (directories stored in data only)

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
  inputs: ["domain"],
  outputs: ["records", "domains"],
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
  
  // Validation (IP vs domain based on module needs)
  if (!target) {
    ui.error("No target specified");
    return { success: false, data: { error: "No target" } };
  }
  
  // Check/install required tools
  if (!checkLib("toolname")) {
    ui.info("Installing toolname...");
    await installLib("toolname");
  }
  
  // Execute enumeration
  // Return with newAssets for runner to persist
}

// ============================================================================
// SECTION 4: Helper Functions
// ============================================================================
// Target resolution and parsing helpers

// ============================================================================
// SECTION 5: Default Export
// ============================================================================
export default { meta, run };
```

---

## Critical Implementation Rules

1. **Only runner.ts writes to manifest** - Modules return `newAssets`, never write directly
2. **Absolute paths only** - Use `FileSystem.cwd().absolutePath` for all file operations
3. **Package management** - Always checkLib/installLib before using external tools
4. **Silent fallbacks** - Use comments instead of ui.warn() for graceful degradation
5. **Target type validation** - Use `Networking.IsIp()` to validate IP vs domain
6. **Parent relationships** - Discovery modules set `parent` on newAssets to track provenance
7. **History logging** - Runner automatically adds history entries

---

## Color Palette Usage

| Usage | Color | Applied In |
|-------|-------|------------|
| Targets, domains | `rgb(255, 0, 179)` (pink) | nslookup target display |
| Info messages | `rgb(30, 191, 255)` (cyan) | ui.info() |
| Success, found items | `#22c55e` (green) | ui.success(), found counts |
| Warnings | `#f59e0b` (orange) | ui.warn() |
| Errors | `#ff4c4cff` (red) | ui.error() |
| Discovery counts | `rgba(195, 105, 255, 0.86)` (purple) | lynx stats |

---

## Dependencies Graph

```
lib/types.ts (from M1)
    ↓
lib/ui.ts (from M1)
    ↓
lib/python.ts (from M2)
    ↓
modules/recon/nslookup.ts (Shell + deterministic fallback)
    ↓
modules/recon/mxlookup.ts (checkLib/installLib)
    ↓
modules/recon/subfinder.ts (checkLib/installLib)
    ↓
modules/recon/lynx.ts (Shell + FileSystem)
    ↓
modules/enum/pyUserEnum.ts (Python wrapper)
    ↓
modules/enum/dirhunter.ts (checkLib/installLib)
    ↓
nine.ts (imports all modules)
```

---

## Phase 3: Update nine.ts

Replace/add module imports:

```typescript
// Add to imports:
import * as nslookup from "./modules/recon/nslookup";
import * as mxlookup from "./modules/recon/mxlookup";
import * as subfinder from "./modules/recon/subfinder";
import * as lynx from "./modules/recon/lynx";
import * as pyUserEnum from "./modules/enum/pyUserEnum";
import * as dirhunter from "./modules/enum/dirhunter";

// Update MODULES registry:
const MODULES: Record<string, { module: any; aliases: string[] }> = {
  // ... existing M1/M2 modules ...
  nslookup: { module: nslookup, aliases: ["--nslookup"] },
  mxlookup: { module: mxlookup, aliases: ["--mxlookup"] },
  subfinder: { module: subfinder, aliases: ["--subfinder"] },
  lynx: { module: lynx, aliases: ["--lynx"] },
  pyuserenum: { module: pyUserEnum, aliases: ["--pyuserenum"] },
  dirhunter: { module: dirhunter, aliases: ["--dirhunter"] },
};
```

Update `showHelp()` to include new commands:
```typescript
ui.print("  nslookup", "NS record lookup");
ui.print("  mxlookup", "MX record lookup");
ui.print("  subfinder", "Subdomain enumeration");
ui.print("  lynx", "OSINT harvest");
ui.print("  pyuserenum", "User enumeration");
ui.print("  dirhunter", "Directory bruteforce");
```

---

## Post-Implementation Checklist

- [ ] `mkdir -p modules/recon modules/enum` executed
- [ ] All 6 modules created in proper directories
- [ ] Each module has 6 standard sections with `// @ts-nocheck` header
- [ ] Each module exports `meta` and `run`
- [ ] Each module has `resolveDomain()` or `resolveIpTarget()` helper
- [ ] `nine.ts` updated to import all 6 modules
- [ ] `nine.ts` MODULES registry includes all 6 modules with aliases
- [ ] `nine.ts` showHelp() updated with new commands
- [ ] No direct manifest writes from modules (only via newAssets)
- [ ] Absolute paths used throughout
- [ ] Package checkLib/installLib for all external tools
- [ ] Silent fallbacks (no ui.warn() spam)
- [ ] Parent relationships set for discovered assets (nslookup, subfinder, lynx)
- [ ] Color palette followed
- [ ] `/audit --full M3` → 10/10 compliance points

---

## File References

| Document | Purpose |
|----------|---------|
| `c:\Users\mathias.aveneau\Documents\GIT\nine\.windsurf\context\M3.md` | Milestone 3 detailed specs |
| `c:\Users\mathias.aveneau\Documents\GIT\nine\.windsurf\skills\nine-cli\SKILL.md` | Patterns and standards |
