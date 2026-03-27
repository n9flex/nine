# Nine CLI - Base Context (Always Loaded)

This file contains universal context for all Nine CLI development. Always loaded when working with @nine agent.

---

## Project Overview

**Nine CLI v0.1.0** - Mission-centric penetration testing toolkit for HackHub.

**Core Principle:** Mission = Container of truth. Attach once, run anywhere.

---

## Project Structure

```
nine/
├── core/                    # Core infrastructure ONLY
│   ├── mission.ts          # MissionManager: create, attach, detach, loadManifest
│   ├── session.ts          # Session persistence (.current_mission)
│   └── runner.ts           # Module runner (ONLY runner writes to manifest)
├── lib/                     # Shared utilities
│   ├── types.ts            # All TypeScript interfaces (PortInfo, MissionManifest)
│   ├── ui.ts               # UI class with color palette
│   ├── storage.ts          # JSON read/write helpers
│   └── utils.ts            # Asset deduplication helpers
├── modules/                 # All modules organized by category
│   ├── recon/              # Reconnaissance modules
│   ├── enum/               # Enumeration modules
│   └── vuln/               # Vulnerability modules
├── tests/                   # Flat structure, standalone tests per milestone
├── loot/                    # Mission data storage
│   └── <mission>/
│       ├── manifest.json     # Mission manifest (single source of truth)
│       └── session files
└── nine.ts                 # Main CLI dispatcher
```

---

## TypeScript Configuration

All files using HackHub internal APIs must include `// @ts-nocheck` at the beginning to avoid lint errors:

```typescript
// @ts-nocheck
// File using Shell, FileSystem, Networking APIs
import { UI } from "./lib/ui";
```

---

## Mission Manifest Structure

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

---

## Critical Rules (NEVER Break)

### 1. Only runner.ts Writes to Manifest
- **Modules return `newAssets`** - runner handles persistence with deduplication
- **Never write directly** to manifest.json from modules

### 2. Native HackHub APIs Only
- Use `Networking.GetSubnet()`, `FileSystem.ReadFile()`
- **Never** use `Shell.Process.exec()` for standard operations
- Exception: Python wrappers may use shell exec

### 3. Absolute Paths Only
```typescript
// Correct
const cwd = await FileSystem.cwd();
await FileSystem.ReadFile(`${cwd.absolutePath}/loot/${mission}/manifest.json`);

// Wrong
await FileSystem.ReadFile(`loot/${mission}/manifest.json`);
```

### 4. UI Class for All Output
```typescript
const ui = UI.ctx();
ui.info("Message");
ui.success("Success");
ui.error("Error");
ui.table(["Col1", "Col2"], rows);
```

### 5. English Code Only
- Functions: camelCase
- Classes: PascalCase
- Constants: UPPER_SNAKE_CASE
- Types: PascalCase with descriptive names

### 6. No Mock Data in Real Modules
- **NEVER** use mock data, fake responses, or hardcoded examples
- **NEVER** include sample/test data in production modules
- **ALWAYS** process only actual mission data from manifest.assets

---

## HackHub API Essentials

### Core I/O
```typescript
println("text");
println([{ text: "colored", color: "green" }]);
printTable([{ Port: 22, Status: "open" }]);
await prompt("Question: ");
await sleep(ms);
```

### File System
```typescript
const { currentPath, absolutePath } = await FileSystem.cwd();
await FileSystem.ReadDir(".")  // { name, isFolder, extension }[]
await FileSystem.ReadFile("file.txt");
await FileSystem.WriteFile("out.txt", "data", { recursive: true });
await FileSystem.Mkdir("folder", { recursive: true });
```

### Networking
```typescript
const subnet = await Networking.GetSubnet("1.2.3.4");
const ports = await subnet.GetPorts();  // number[]
const isOpen = await subnet.PingPort(22);
const portData = await subnet.GetPortData(22);
// portData.service, portData.version, portData.external, portData.internal
```

### Shell
```typescript
const args = Shell.GetArgs();  // string[]
await Shell.Process.exec("cmd");  // Only for Python wrappers!
```

---

## Color Palette (lib/ui.ts)

| Usage | Color |
|-------|-------|
| Targets, external IPs | `rgb(255, 0, 179)` (pink) |
| Shells, interactive elements | `rgb(30, 191, 255)` (cyan) |
| Success, open ports | `#22c55e` (green) |
| Warnings, forwarded ports | `#f59e0b` (orange) |
| Errors, closed ports | `#ff4c4cff` (red) |
| Internal IPs, counts | `rgba(195, 105, 255, 0.86)` (purple) |
| Testing state | `#fbbf24` (yellow) |
| Labels, neutral text | `"white"` |
| Secondary info | `"gray"` |

---

## Testing Strategy

**One big test per milestone.** Write test first, validate on HackHub, then implement.

```typescript
// tests/test-milestone-1.ts
async function runAllTests(): Promise<void> {
  const results = {
    types: await testTypes(),
    ui: await testUI(),
    storage: await testStorage(),
    // ...
  };
  
  const passed = Object.values(results).filter(r => r).length;
  const total = Object.keys(results).length;
  
  if (passed === total) ui.success(`ALL TESTS PASSED`);
  else ui.error(`TESTS FAILED: ${total - passed}`);
}
```

---

## File References

| Document | Purpose |
|----------|---------|
| `docs/hackhub-api.md` | Complete HackHub API reference |
| `docs/architecture.md` | Full architecture documentation |
| `.windsurf/agents/nine.md` | Agent configuration |
| `.windsurf/skills/nine-cli/SKILL.md` | Quick patterns reference |
| `.windsurf/workflows/audit.md` | Audit command documentation |
| `.windsurf/workflows/create-module.md` | Module creation workflow |
