# Creating a Nine Module

Guide for creating modules in Nine CLI v0.1.0 (mission-centric architecture).

## Module Structure

```
modules/<category>/<name>.ts
├── meta           # Module metadata (name, command, category, I/O)
├── run()          # CLI entry point (mission, ui, args)
└── execute()      # Core logic (optional helper)
```

## Quick Start

```typescript
import { UI } from "../../lib/ui";
import type { MissionManifest, ModuleResult } from "../../lib/types";

export const meta = {
  name: "geoip",
  command: "geoip",
  category: "recon",      // recon | enum | vuln | exploit | post
  targetTypes: ["ip"],    // ip | domain | email | any
  requires: [],           // Modules that must run first
  outputs: ["location"], // Data produced for manifest
};

export async function run(
  mission: MissionManifest,
  ui: UI,
  args?: string[]
): Promise<ModuleResult> {
  // Get target from args or mission defaults
  const target = args?.[0] || getUnscannedIp(mission);
  if (!target) {
    ui.error("No target specified and no unscanned IPs in mission");
    return { success: false, error: "No target" };
  }

  // Validate target type
  if (!Networking.IsIp(target)) {
    ui.error("geoip requires an IP address");
    return { success: false, error: "Invalid target type" };
  }

  ui.info(`Running geoip on ${target}...`);

  // Execute module logic
  try {
    const location = await Networking.GeoIp(target);
    
    ui.success(`Location: ${location.country}, ${location.city}`);
    
    return {
      success: true,
      data: { location, timestamp: new Date().toISOString() },
      // No new assets discovered
      newAssets: [],
      duration: 0, // Track if needed
    };
  } catch (err) {
    ui.error(`GeoIP failed: ${err}`);
    return { success: false, error: String(err) };
  }
}

// Helper to get default target from mission
function getUnscannedIp(mission: MissionManifest): string | null {
  const unscanned = mission.assets.ips.find(ip => ip.status === "discovered");
  return unscanned?.value || null;
}
```

## Module Metadata

```typescript
interface ModuleMeta {
  name: string;           // Unique identifier
  command: string;        // CLI command (e.g., "scan", "geoip")
  category: "recon" | "enum" | "vuln" | "exploit" | "post";
  targetTypes: ("ip" | "domain" | "email" | "any")[];
  requires: string[];     // Module names that must run first
  inputs?: string[];      // Manifest data needed
  outputs: string[];     // Data produced for manifest
}
```

## Target Resolution

Modules support default targets based on mission state:

```typescript
// IP-based modules: default to unscanned IPs
const target = args?.[0] || mission.assets.ips
  .find(ip => ip.status === "discovered")?.value;

// Domain-based modules: default to domains needing DNS resolution  
const target = args?.[0] || mission.assets.domains
  .find(d => !d.resolvedIp)?.value;

// Any module: accept any seed or discovered asset
const target = args?.[0] || [...mission.seeds, ...mission.assets.ips][0]?.value;
```

## Adding Assets to Mission

Return `newAssets` to auto-add discoveries:

```typescript
return {
  success: true,
  data: scanResults,
  newAssets: [
    { type: "ip", value: "192.168.1.45", parent: "192.168.1.1" },
    { type: "domain", value: "sub.banque.mx", parent: "banque.mx" },
    { type: "email", value: "admin@banque.mx", domain: "banque.mx" },
  ],
};
```

## Registering in nine.ts

```typescript
import { meta as geoipMeta, run as geoipRun } from "./modules/recon/geoip";

const MODULES: Record<string, { meta: ModuleMeta; run: ModuleFn }> = {
  // ... existing modules
  geoip: { meta: geoipMeta, run: geoipRun },
};

// Update help
function showUsage() {
  ui.print("  nine geoip [ip]          Geolocation lookup");
}
```

## Testing Your Module

1. **Create test first**: `tests/test-geoip.ts`
2. **Validate on HackHub**: Copy test, verify APIs
3. **Implement module**: Follow template above
4. **Verify**: Run on HackHub

```typescript
// tests/test-geoip.ts
import { UI } from "../lib/ui";

async function testGeoip(): Promise<boolean> {
  const ui = UI.ctx();
  
  try {
    const result = await Networking.GeoIp("8.8.8.8");
    if (result && result.country) {
      ui.success("PASS: GeoIP API works");
      return true;
    }
    ui.error("FAIL: GeoIP returned invalid data");
    return false;
  } catch (err) {
    ui.error(`FAIL: ${err}`);
    return false;
  }
}

// Run: node tests/test-geoip.ts
```

## Code Standards

### Imports
```typescript
// Correct
import { UI } from "../../lib/ui";
import type { MissionManifest, ModuleResult } from "../../lib/types";

// Wrong
import { Sora } from "../lib/sora";  // Don't use Sora, use UI
```

### Paths
```typescript
// Correct - absolute paths
const cwd = await FileSystem.cwd();
await FileSystem.WriteFile(`${cwd.absolutePath}/loot/file.json`, data);

// Wrong - relative paths
await FileSystem.WriteFile("loot/file.json", data);  // May fail
```

### Output
```typescript
// Correct
const ui = UI.ctx();
ui.info("Scanning...");
ui.success("Complete");
ui.error("Failed");
ui.print("Data", "cyan");

// Wrong
println({ text: "message", color: "cyan" });  // Use UI wrapper
```

## Checklist

- [ ] Test written and validated on HackHub
- [ ] `meta` object exported with all required fields
- [ ] `run()` function exported with correct signature
- [ ] Target validation (IP vs domain vs any)
- [ ] Default target logic (uses mission state if no args)
- [ ] Uses `UI.ctx()` for all output
- [ ] Uses absolute paths for file operations
- [ ] Only native HackHub APIs (no fake bash)
- [ ] Returns `ModuleResult` with `success`, `data`, `newAssets`
- [ ] Registered in `nine.ts` MODULES map
- [ ] Added to `showUsage()`
- [ ] Clean, typed, commented code

## Common Patterns

### Port Scanning Module
```typescript
export async function run(mission, ui, args) {
  const target = args?.[0] || getUnscannedIp(mission);
  if (!Networking.IsIp(target)) return { success: false };
  
  const subnet = await Networking.GetSubnet(target);
  const ports = await subnet.GetPorts();
  
  // Process and return
  return {
    success: true,
    data: { ports },
    newAssets: [], // Would add discovered IPs here
  };
}
```

### Domain Module
```typescript
export async function run(mission, ui, args) {
  const target = args?.[0] || getUnresolvedDomain(mission);
  if (Networking.IsIp(target)) {
    ui.error("Requires domain, not IP");
    return { success: false };
  }
  
  const result = await runExternalTool(target);
  
  return {
    success: true,
    data: result,
    newAssets: result.subdomains?.map(d => ({
      type: "domain", value: d, parent: target
    })),
  };
}
```

## References

- `.rules/hackhub.md` - HackHub API rules
- `docs/hackhub-api.md` - Complete API reference  
- `lib/ui.ts` - UI class and color palette
- `lib/types.ts` - Shared TypeScript interfaces
- `core/mission.ts` - MissionManager for data access
