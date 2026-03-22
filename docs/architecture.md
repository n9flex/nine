# Nine CLI Architecture

> Modular penetration testing toolkit for HackHub. Each module is a standalone CLI command that can be executed independently or chained manually.

---

## Philosophy

- **Standalone modules**: Each module is an independent CLI command
- **Manual chaining**: No automatic pipeline—users control the data flow
- **JSON persistence**: All data saved to `./loot/<target>/` as structured JSON
- **Standardized I/O**: Consistent input/output via `lib/types.ts` interfaces

---

## Project Structure

```
nine/
├── lib/
│   ├── storage.ts          # Filesystem abstraction (HackHub FileSystem API)
│   ├── profile.ts          # Target profile management
│   ├── types.ts            # Shared TypeScript interfaces
│   ├── ui.ts               # Unified output system
│   └── logger.ts           # Logging utilities
├── modules/
│   ├── scanner.ts          # Port scanning
│   ├── nettree.ts          # Network discovery (Python wrapper)
│   └── exploit.ts          # Exploitation framework
├── nine.ts                 # Main CLI dispatcher
└── loot/                   # Persistent data directory
    └── <target>/
        ├── profile.json     # Metadata and findings summary
        └── <module>.json    # Module-specific results
```

---

## Data Persistence

### Target Profiles

Each target (IP, domain, email, or name) has a dedicated directory under `./loot/<target>/`:

| File | Purpose |
|------|---------|
| `profile.json` | Metadata, timestamps, and summary of all findings |
| `<module>.json` | Detailed results from each module execution |

**Example `profile.json`:**
```json
{
  "target": "211.189.37.178",
  "type": "ip",
  "created": "2026-03-22T02:55:46.440Z",
  "updated": "2026-03-22T03:12:02.258Z",
  "summary": {
    "ips": ["211.189.37.178"],
    "domains": [],
    "emails": [],
    "names": [],
    "ports": [3389],
    "modulesRun": ["scanner"]
  }
}
```

### Storage API (`lib/storage.ts`)

```typescript
// Write JSON data
await writeJSON(target, "scanner.json", data);

// Read JSON data
const data = await readJSON<ScanResult>(target, "scanner.json");

// List all targets
const targets = await listTargets();

// Load profile
const profile = await loadProfile(target);
```

**Important:** Always use `{ absolute: true }` with absolute paths via `FileSystem.cwd().absolutePath`.

---

## Module Development

### 1. Module Structure

Create `modules/<name>.ts` with these **6 standard sections**:

```typescript
// 1. Imports
import { UI } from "../lib/ui";
import { loadProfile, saveModuleData, markModuleRun } from "../lib/profile";
import { writeJSON } from "../lib/storage";

// 2. Module metadata
export const moduleInfo = {
  name: "modulename",
  command: "command",
  aliases: ["-a", "--alias"],
  description: "Brief description",
  args: ["target"],
  flags: {},
  // Pipeline declarations (optional)
  requires: [],   // Dependency modules
  inputs: [],     // Consumes from profile.summary
  outputs: [],    // Produces for other modules
};

// 3. Color configuration
const COLORS = {
  label: "white",
  target: "pink",
  success: "green",
  warning: "orange",
  error: "red",
} as const;

// 4. Types
interface ModuleResult {
  // Define output structure
}

// 5. Core logic
async function executeModule(target: string, ui: UI): Promise<ModuleResult> {
  // Implementation using native HackHub APIs
}

// 6. CLI entry point
export async function run(args: string[], flags: Record<string, string>): Promise<void> {
  const ui = UI.ctx();
  
  if (!args.length) {
    ui.error(`Usage: nine ${moduleInfo.command} <target>`);
    return;
  }
  
  const target = args[0];
  
  // Validate target type (IP vs domain)
  if (!Networking.IsIp(target)) {
    ui.error("This module requires a valid IP address");
    return;
  }
  
  const profile = await loadProfile(target);
  
  ui.info(`Running ${moduleInfo.name} on ${target}...`);
  
  // Execute module logic
  const results = await executeModule(target, ui);
  
  // Save results
  await saveModuleData(target, moduleInfo.name, {
    results,
    executedAt: new Date().toISOString(),
  });
  
  // Update profile summary - CRITICAL for data persistence
  profile.summary.ips = results.ips || profile.summary.ips;
  profile.summary.ports = results.ports || profile.summary.ports;
  profile.updated = new Date().toISOString();
  await writeJSON(target, "profile.json", profile);
  
  // Mark as executed
  await markModuleRun(target, moduleInfo.name);
  
  ui.success(`Results saved to loot/${target}/${moduleInfo.name}.json`);
}
```

### 2. Register in Dispatcher

Add to `nine.ts`:

```typescript
import * as myModule from "./modules/my-module";

const MODULES: Record<string, { module: any; aliases: string[] }> = {
  scanner: { module: scanner, aliases: ["-s", "--scan"] },
  mymodule: { module: myModule, aliases: ["-m", "--mymodule"] },
};
```

Update `showUsage()`:
```typescript
function showUsage() {
  ui.print("  nine scanner <target>     Scan ports (-s, --scan)");
  ui.print("  nine mymodule <target>    Description (-m, --mymodule)");
}
```

---

## Guidelines

### Target Type Validation

The CLI dispatcher (`nine.ts:parseArgs`) automatically detects **IPs** and **domains** from positional arguments:

```typescript
// IP detection via Networking.IsIp()
nine -s 192.168.1.1      // target = "192.168.1.1"

// Domain detection via heuristic (contains dot, no spaces)
nine -sub example.com    // target = "example.com"
```

**Module validation responsibility:**
- IP-based modules (`scanner`, `nettree`): Validate with `Networking.IsIp(target)`
- Domain-based modules (`subfinder`, `lynx`): Reject IPs, accept `target.includes(".")`

Always update `profile.summary` with discovered data so `nine show <target>` displays it correctly.

---

### API Usage

**Always** use the native HackHub API. **Never** use `Shell.Process.exec()` for standard operations:

```typescript
// ✅ Correct
const subnet = await Networking.GetSubnet(ip);
const ports = await subnet.GetPorts();

// ❌ Incorrect
await Shell.Process.exec(`nmap ${ip}`);
```

See `docs/hackhub-api.md` for the complete API reference.

### UI Standards

Use `lib/ui.ts` for all output:

```typescript
const ui = UI.ctx();

ui.info("Informational message");
ui.success("Success message");
ui.warn("Warning message");
ui.error("Error message");

ui.section("SECTION TITLE");
ui.divider();

ui.table(["Column1", "Column2"], rows, {
  rowColor: (row) => row.status === "OPEN" ? "green" : "red",
});

ui.printColumns("Label", "Value", { leftColor: "white", rightColor: "cyan" });
```

### Color Palette (`lib/ui.ts`)

| Color | Value | Usage |
|-------|-------|-------|
| `white` | `"white"` | Labels, neutral text |
| `gray` | `"gray"` | Secondary info |
| `pink` | `rgb(255, 0, 179)` | Targets, external IPs |
| `cyan` | `rgb(30, 191, 255)` | Shells, interactive elements |
| `green` | `#22c55e` | Success, open ports |
| `orange` | `#f59e0b` | Warnings, forwarded ports |
| `red` | `#ff4c4cff` | Errors, closed ports |
| `purple` | `rgba(195, 105, 255, 0.86)` | Internal IPs, counts |
| `yellow` | `#fbbf24` | Testing state |
| `sora` | `#ff2056` | Brand accent |

---

## Module Reference Patterns

### Network Module (`scanner.ts`)

**Data flow:**
```
Input IP → GetSubnet → GetPorts → PingPort/GetPortData → PortInfo[] → Display → Save
```

**Saved data keys:**
- `ports` — Array of scanned ports
- `scannedAt` — ISO timestamp
- `subnet` — `{ip, lanIp}`

### Exploitation Module (`exploit.ts`)

**Data flow:**
```
PortInfo[] → Filter open ports → SearchExploits → Try exploits → ExploitResult → Report
```

### Python Wrapper (`nettree.ts`)

**Pattern:** Download script from HackDB → Execute with `Shell.Process.exec()` → Parse output → Enrich results

*Note: Python wrappers are the exception to the "no shell exec" rule.*

---

## Pipeline Architecture (Future)

Planned `nine full <target>` command for automated execution:

```
┌─────────┐    ┌──────────┐    ┌─────────┐    ┌──────────┐    ┌─────────┐
│  recon  │───→│ scanner  │───→│ nettree │───→│  lynx   │───→│ exploit │
└────┬────┘    └────┬─────┘    └────┬────┘    └────┬─────┘    └────┬────┘
     │              │               │              │              │
     ▼              ▼               ▼              ▼              ▼
 domains         ports           IPs           emails        shells
 emails         versions       routers          names
  names         services      devices      credentials
```

*Dependencies are checked at runtime via `profile.summary.modulesRun` and cross-module data is retrieved via `getModuleData()`.*

**Module dependencies:**

| Module | Outputs | Consumed By |
|--------|---------|-------------|
| `recon` | domains, emails, names, ips | `scanner`, `lynx` |
| `scanner` | ports, ips | `exploit`, `nettree` |
| `nettree` | ips (discovered) | `scanner` |
| `lynx` | emails, names, social | `recon` |
| `exploit` | shells, vulnerablePorts | — |

---

## References

| Document | Purpose |
|----------|---------|
| `docs/hackhub-api.md` | HackHub API reference |
| `docs/create-module.md` | Step-by-step module creation guide |
| `lib/types.ts` | Shared TypeScript interfaces (PortInfo, ModuleFindings) |
| `lib/ui.ts` | UI system and color palette |
| `lib/storage.ts` | Data persistence utilities |
| `lib/profile.ts` | Profile management |
| `modules/scanner.ts` | Complete module reference |
| `.rules/hackhub.md` | Coding standards (No Fake Bash) |
| `.windsurf/workflows/create-module.md` | Windsurf workflow for automated module creation |
