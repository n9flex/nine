# Nine CLI Specification

Mission-centric penetration testing toolkit for HackHub with centralized data model and independent modules.

---

## Core Principles

1. **Mission = Container of truth** - All data lives under a named mission
2. **Attach once, run anywhere** - No repeated mission/target arguments
3. **Module independence** - Each module is standalone but reads/writes to central manifest
4. **Traceability** - Every action logged with timestamp, source, and results
5. **No pipeline complexity** - Manual module execution, no automatic orchestration

---

## Data Model

### Mission Manifest (Single Source of Truth)

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
    resolvedIp?: string;  // Populated by DNS modules (dig, nslookup)
  }>;
  
  // Discovered assets
  assets: {
    ips: Array<{
      value: string;
      status: "discovered" | "scanned" | "exploited" | "pwned";
      deviceType?: "router" | "firewall" | "printer" | "server" | "workstation" | "unknown";
      ports: PortInfo[];
      parent?: string;           // Discovered from which seed
      discoveredBy: string;      // Module name that found it
      discoveredAt: string;
      notes?: string;
    }>;
    domains: Array<{
      value: string;
      source: "seed" | "subfinder" | "lynx" | "dns";  // How it was discovered
      parent?: string;       // Parent domain for subdomains (e.g., "banque.mx" for "www.banque.mx")
      resolvedIp?: string;   // IP if domain was resolved
      vulnerable?: boolean;  // Flagged by nuclei/vulnerability scanners
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
      source: string;      // Module that extracted it
      target: string;      // IP/domain associated
      extractedAt: string;
      decoded?: any;       // Decoded JWT payload
    }>;
    files: string[];           // Downloaded exploits, wordlists, etc.
  };
  
  // Execution history
  history: Array<{
    timestamp: string;
    module: string;
    target?: string;
    action: string;
    result: "success" | "failure" | "partial";
    data?: any;                // Module-specific output
  }>;
}
```

### Session File

```
loot/.current_mission → {"mission": "BanqueMexico", "attachedAt": "..."}
```

---

## Project Structure

```
nine/
├── core/
│   ├── mission.ts        # MissionManager: create, attach, detach, loadManifest
│   ├── session.ts        # Session persistence (.current_mission)
│   └── runner.ts         # Module runner with manifest updates
├── lib/
│   ├── ui.ts             # UI class (colors, tables, sections)
│   ├── types.ts          # Shared interfaces (PortInfo, MissionManifest, etc.)
│   ├── storage.ts        # JSON read/write helpers
│   └── utils.ts          # dedupeAssets(), validation helpers
├── modules/
│   ├── recon/
│   │   ├── scanner.ts    # Port scanning (nmap)
│   │   ├── nettree.ts    # Network discovery
│   │   ├── geoip.ts      # Geolocation IP
│   │   ├── dig.ts        # DNS lookup
│   │   ├── nslookup.ts   # NS records
│   │   ├── mxlookup.ts   # MX records
│   │   ├── subfinder.ts  # Subdomain discovery
│   │   └── lynx.ts       # OSINT harvest
│   ├── enum/
│   │   ├── pyUserEnum.ts # User enumeration
│   │   └── dirhunter.ts  # Directory bruteforce
│   └── vuln/
│       └── nuclei.ts     # Nuclei integration
└── nine.ts               # CLI dispatcher
```

---

// lib/types.ts
interface PortInfo {
  port: number;
  state: "open" | "closed" | "filtered" | "forwarded";
  service: string;
  version?: string;
  // Port forwarding detection (external !== internal)
  forwarded?: {
    externalPort: number;
    internalPort: number;
    targetIp?: string;  // Internal destination IP
  };
}

// lib/python.ts - Python Module Runner
export async function runPythonModule(
  script: string,           // "net_tree.py", "fern.py"
  args: string[],          // Arguments to pass
  options?: {
    checkLib?: string;     // Dependency to check (e.g., "metasploit")
    timeout?: number;      // Max execution time
    parseJson?: boolean;   // Auto-parse JSON output
  }
): Promise<{
  success: boolean;
  output: string;
  data?: any;
  error?: string;
}> {
  // 1. Check if dependency installed (if specified)
  // 2. Download from HackDB if missing
  // 3. Execute via Shell.Process.exec()
  // 4. Parse and return results
}

---

## Module Interface Standard

Every module exports:

```typescript
export const meta = {
  name: "scanner",           // Unique identifier
  command: "scan",           // CLI command
  description: "Port scanning",
  requires: [],              // Required modules to have run first
  inputs: [],                // Data needed from manifest.assets
  outputs: ["ports"],       // Data produced
};

export async function run(
  mission: MissionManifest,
  ui: UI,
  args?: string[]           // Optional additional args
): Promise<{
  success: boolean;
  data?: any;               // Stored in manifest.history by runner
  newAssets?: Array<{       // Runner auto-adds to manifest.assets with deduplication
    type: "ip" | "domain" | "email" | "credential" | "hash" | "session";
    value: any;
    parent?: string;
  }>;
}>;
```

---

## CLI Commands

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
nine scan [ip]                     # Scan target (default: all unscanned IPs)
nine nettree [ip]                  # Network discovery
nine lynx <term>                   # OSINT harvest
nine exploit [ip]                  # Run exploits
nine brute [ip]                    # Brute force services
```

**Default target behavior:** If no target specified, module runs on all assets of required type with appropriate status.

---

## Testing Strategy

### Workflow: Test → Validate → Implement

1. **Write test** - Create test file in `tests/` validating the expected behavior
2. **Validate on HackHub** - Copy test to HackHub terminal, verify APIs work as expected
3. **Implement** - Write the actual module/feature based on validated test
4. **Verify** - Run implementation on HackHub to confirm it works

### Test Structure

Single `tests/` directory at root (flat structure, easy to copy to HackHub):

```
tests/
├── test-mission-core.ts      # MissionManager tests (create, attach, detach)
├── test-session.ts           # Session persistence tests
├── test-runner.ts            # Module runner tests
├── test-scanner.ts           # Scanner module validation
├── test-nettree.ts           # Nettree module validation
└── test-full-flow.ts         # Integration test: create → attach → scan → nettree
```

Each test file:
- Is standalone (can run independently on HackHub)
- Uses real APIs (FileSystem, Networking, etc.)
- Validates both success and error cases
- Outputs clear pass/fail results

### Test Pattern Example

```typescript
// tests/test-mission-core.ts
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
    if (manifest.seeds.length !== 1) {
      ui.error("FAIL: seed count mismatch");
      return false;
    }
    
    ui.success("PASS: create mission");
    return true;
  } catch (err) {
    ui.error(`FAIL: ${err}`);
    return false;
  }
}

async function main(): Promise<void> {
  const results = [];
  results.push(await testCreateMission());
  results.push(await testAttachMission());
  // ... more tests
  
  const passed = results.filter(r => r).length;
  UI.ctx().info(`${passed}/${results.length} tests passed`);
}
```

### Validation Checklist (before implementation)

For each module test, verify on HackHub:
- [ ] APIs used exist and return expected data
- [ ] File paths work with absolute paths
- [ ] Manifest structure matches spec
- [ ] Error handling covers edge cases

Once test passes on HackHub, implement the real module.

---

## Milestones

### Milestone 1: Foundation
- [ ] Project structure and TypeScript configuration
- [ ] Mission data model (Manifest, types in lib/types.ts)
- [ ] lib/utils.ts with dedupeAssets() helper
- [ ] MissionManager with tests (create, attach, detach, loadManifest)
- [ ] Session persistence with tests (.current_mission)
- [ ] UI library (lib/ui.ts)
- [ ] runner.ts with manifest write logic and deduplication
- [ ] CLI dispatcher with mission context
- [ ] Integration test: create → attach → status flow

### Milestone 2: Reconnaissance Modules
- [ ] scanner.ts with tests - Port scanning with manifest integration
- [ ] nettree.ts with tests - Network discovery with auto-IP ingestion
- [ ] geoip.ts with tests - Geolocation lookup
- [ ] dig.ts with tests - DNS lookup
- [ ] History logging for all modules
- [ ] Integration test: full recon flow

### Milestone 3: Enumeration Modules
- [ ] nslookup.ts with tests - NS record lookup
- [ ] mxlookup.ts with tests - MX record lookup
- [ ] subfinder.ts with tests - Subdomain enumeration
- [ ] lynx.ts with tests - OSINT harvest
- [ ] pyUserEnum.ts with tests - User enumeration
- [ ] dirhunter.ts with tests - Directory bruteforce

### Milestone 4: Vulnerability & Reporting
- [ ] nuclei.ts with tests - Vulnerability scanning
- [ ] Domain vulnerability flagging in manifest
- [ ] Export mission to report (JSON + TXT)
- [ ] Asset querying (show pwned IPs, show credentials)
- [ ] Full integration test suite

---

## File Locations

- Manifest: `loot/<mission>/manifest.json`
- Session: `loot/.current_mission`
- Module results: Stored in `manifest.history`, not separate files

---

## Shared Utilities (lib/utils.ts)

### Asset Deduplication

Helper to prevent duplicate assets when multiple modules discover the same target:

```typescript
export function dedupeAssets<T extends { value: string }>(
  existing: T[],
  newAssets: Array<{ type: string; value: string; parent?: string }>
): {
  unique: Array<{ type: string; value: string; parent?: string }>;
  duplicates: string[];
} {
  const seen = new Set(existing.map(a => a.value));
  const unique = newAssets.filter(a => !seen.has(a.value));
  const duplicates = newAssets.filter(a => seen.has(a.value)).map(a => a.value);
  return { unique, duplicates };
}
```

Used by `runner.ts` before adding new assets to the manifest.

---

## Rules

1. **Only runner.ts writes to manifest** - Modules return `newAssets`, runner handles persistence with deduplication
2. **All paths absolute** - Use `FileSystem.cwd().absolutePath`
3. **No fake APIs** - Only use documented HackHub APIs
4. **Every module tested** - Each module has test file validated on HackHub
5. **UI only via lib/ui.ts** - No direct println except through UI class
