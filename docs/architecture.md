# Nine CLI Architecture

> Modular penetration testing toolkit for HackHub. Each module is a standalone CLI command that can be executed independently or chained manually.

---

## Philosophy

1. **Mission = Container of truth** - All data lives under a named mission
2. **Attach once, run anywhere** - No repeated mission/target arguments
3. **Module independence** - Each module is standalone but reads/writes to central manifest
4. **Traceability** - Every action logged with timestamp, source, and results
5. **No pipeline complexity** - Manual module execution, no automatic orchestration

---

## Project Structure

```
nine/
├── core/
│   ├── mission.ts          # MissionManager: create, attach, detach, loadManifest
│   ├── session.ts          # Session persistence (.current_mission)
│   └── runner.ts           # Module runner with manifest updates
├── lib/
│   ├── storage.ts          # JSON read/write helpers
│   ├── profile.ts          # Target profile management (legacy)
│   ├── types.ts            # Shared TypeScript interfaces
│   ├── ui.ts               # Unified output system
│   ├── logger.ts           # Logging utilities
│   └── utils.ts            # Asset deduplication helpers
├── modules/
│   ├── recon/              # Reconnaissance modules
│   │   ├── scanner.ts      # Port scanning
│   │   ├── nettree.ts      # Network discovery
│   │   ├── geoip.ts        # Geolocation IP
│   │   ├── dig.ts          # DNS lookup
│   │   ├── nslookup.ts     # NS records
│   │   ├── mxlookup.ts     # MX records
│   │   ├── subfinder.ts    # Subdomain discovery
│   │   └── lynx.ts         # OSINT harvest
│   ├── enum/               # Enumeration modules
│   │   ├── pyUserEnum.ts   # User enumeration
│   │   └── dirhunter.ts    # Directory bruteforce
│   └── vuln/               # Vulnerability modules
│       └── nuclei.ts       # Nuclei integration
├── nine.ts                 # Main CLI dispatcher
└── loot/
    └── <mission>/
        ├── manifest.json   # Mission manifest (single source of truth)
        └── .current_mission → Session file pointing to active mission

---

## Data Persistence

### Mission Manifest (Single Source of Truth)

Each mission has a dedicated directory under `./loot/<mission>/` with a central `manifest.json`:

```typescript
interface MissionManifest {
  name: string;
  created: string;
  updated: string;
  
  // Entry points
  seeds: Array<{
    value: string;
    type: "ip" | "domain" | "email" | "cidr";
    addedAt: string;
    resolvedIp?: string;
  }>;
  
  // Discovered assets
  assets: {
    ips: Array<{
      value: string;
      status: "discovered" | "scanned" | "exploited" | "pwned";
      deviceType?: "router" | "firewall" | "printer" | "server" | "workstation" | "unknown";
      ports: PortInfo[];
      parent?: string;
      discoveredBy: string;
      discoveredAt: string;
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
    }>;
    files: string[];
  };
  
  // Execution history
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

### Session File

```
loot/.current_mission → {"mission": "MissionName", "attachedAt": "..."}
```

---

## Module Development

### 1. Module Structure

Create `modules/<name>.ts` with these **6 standard sections**:

```typescript
// 1. Imports
import { UI } from "../../lib/ui";
import { MissionManifest } from "../../lib/types";

// 2. Module metadata
export const meta = {
  name: "scanner",
  command: "scan",
  description: "Port scanning module",
  requires: [],           // Required modules to have run first
  inputs: [],             // Data needed from manifest.assets
  outputs: ["ports"],     // Data produced for manifest
};

// 3. Core logic
export async function run(
  mission: MissionManifest,
  ui: UI,
  args?: string[]         // Optional additional args
): Promise<{
  success: boolean;
  data?: any;              // Stored in manifest.history by runner
  newAssets?: Array<{     // Runner auto-adds to manifest.assets
    type: "ip" | "domain" | "email" | "credential" | "hash" | "session";
    value: any;
    parent?: string;
  }>;
}> {
  // Implementation using native HackHub APIs
  // Return newAssets for runner to dedupe and add to manifest
}
```

### 2. Register in Dispatcher

Add to `nine.ts`:

```typescript
import * as scanner from "./modules/recon/scanner";

const MODULES: Record<string, { module: any; aliases: string[] }> = {
  scan: { module: scanner, aliases: ["-s", "--scan"] },
};
```

Update `showUsage()`:
```typescript
function showUsage() {
  ui.print("  nine create <mission>       Create new mission");
  ui.print("  nine attach <mission>       Attach to mission");
  ui.print("  nine scan [ip]              Scan ports on IP (or all unscanned)");
}
```

---

## Guidelines

### Target Resolution

Modules receive the full `MissionManifest` and resolve targets based on `args` or mission state:

```typescript
// Specific target provided
nine scan 192.168.1.1    // args = ["192.168.1.1"]

// No target - use mission assets with appropriate status
nine scan                // runs on all unscanned IPs from manifest.assets.ips
```

**Default target behavior:** If no target specified, module runs on all assets of required type with appropriate status.

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

## CLI Reference

### Mission Management

```bash
nine create <mission> [seed...]    # Create mission with optional seeds
nine attach <mission>              # Attach to mission (creates if needed)
 nine detach                        # Detach current mission
nine status                        # Show current mission + assets summary
nine show                          # Full mission details
nine assets                        # List all assets (IPs, domains, creds)
nine history                       # Show execution history
```

### Module Execution

```bash
nine scan [ip]                     # Port scan (default: all unscanned IPs)
nine nettree [ip]                  # Network discovery
nine lynx <term>                   # OSINT harvest
nine exploit [ip]                  # Run exploits
nine brute [ip]                    # Brute force services
```

**Note:** Target is optional - if not provided, module runs on all applicable mission assets.

## Testing Strategy

### Workflow: Test → Validate → Implement

1. **Write test** - Create test file in `tests/` validating expected behavior
2. **Validate on HackHub** - Copy test to HackHub terminal, verify APIs work
3. **Implement** - Write actual module/feature based on validated test
4. **Verify** - Run implementation on HackHub to confirm it works

### Test Structure

Single `tests/` directory at root (flat structure, easy to copy to HackHub):

```
tests/
├── test-mission-core.ts      # MissionManager tests
├── test-session.ts           # Session persistence tests
├── test-runner.ts            # Module runner tests
├── test-scanner.ts           # Scanner module validation
└── test-full-flow.ts         # Integration test
```

Each test file:
- Is standalone (can run independently on HackHub)
- Uses real APIs (FileSystem, Networking, etc.)
- Validates both success and error cases
- Outputs clear pass/fail results

### Test Pattern

```typescript
async function testCreateMission(): Promise<boolean> {
  const ui = UI.ctx();
  ui.info("Testing: create mission");
  
  try {
    const manager = new MissionManager();
    const manifest = await manager.create("test", ["192.168.1.1"]);
    
    if (manifest.name !== "test") {
      ui.error("FAIL: mission name mismatch");
      return false;
    }
    
    ui.success("PASS: create mission");
    return true;
  } catch (err) {
    ui.error(`FAIL: ${err}`);
    return false;
  }
}
```

---

## References

| Document | Purpose |
|----------|---------|
| `docs/hackhub-api.md` | HackHub API reference |
| `lib/types.ts` | Shared TypeScript interfaces (PortInfo, MissionManifest) |
| `lib/ui.ts` | UI system and color palette |
| `core/mission.ts` | MissionManager implementation |
| `core/runner.ts` | Module runner with manifest integration |
| `lib/utils.ts` | Asset deduplication utilities |
| `.rules/hackhub.md` | Coding standards (No Fake Bash) |
| `.windsurf/workflows/create-module.md` | Module creation workflow |
