# Nine CLI Architecture

Mission-centric penetration testing toolkit for HackHub.

## Philosophy

1. **Mission = Container of truth** - All data lives under a named mission
2. **Attach once, run anywhere** - No repeated mission/target arguments
3. **Module independence** - Each module is standalone but contributes to central manifest
4. **No mock data** - Real commands only, empty results if nothing found

## Project Structure

```
nine/
├── core/
│   ├── mission.ts          # Mission creation, attach/detach
│   ├── session.ts          # .current_mission persistence
│   └── runner.ts           # Module execution + manifest updates
├── lib/
│   ├── types.ts            # TypeScript interfaces
│   ├── ui.ts               # Output system + color palette
│   └── utils.ts            # Asset deduplication
├── modules/
│   ├── recon/              # Reconnaissance (scanner, dig, nslookup, mxlookup...)
│   ├── enum/               # Enumeration (subfinder, dirhunter, pyUserEnum)
│   └── vuln/               # Vulnerability scanning
├── nine.ts                 # CLI dispatcher
└── loot/
    └── <mission>/
        └── manifest.json   # Single source of truth
```

## Mission Manifest

```typescript
interface MissionManifest {
  name: string;
  created: string;
  updated: string;
  seeds: Array<{ value: string; type: "ip" | "domain" | "email" }>;
  assets: {
    ips: Array<{ value: string; status: string; ports: PortInfo[]; parent?: string }>;
    domains: Array<{ value: string; parent?: string; resolvedIp?: string }>;
    emails: string[];
    credentials: Array<{ user: string; pass: string; source: string }>;
    directories: Array<{ value: string; parent?: string }>;
  };
  history: Array<{ module: string; timestamp: string; result: string }>;
}
```

## Module Structure

```typescript
// @ts-nocheck
import { UI } from "../../lib/ui";
import { MissionManifest, ModuleResult } from "../../lib/types";

export const meta = {
  name: "modulename",
  command: "command",
  description: "What it does",
  requires: [],
  inputs: ["ip"],
  outputs: ["ports"],
};

export async function run(
  mission: MissionManifest,
  ui: UI,
  args?: string[]
): Promise<ModuleResult> {
  // 1. Resolve target
  const target = args?.[0] || getFromMission(mission);
  if (!target) {
    ui.error("No target specified");
    return { success: false, data: { error: "No target" } };
  }

  // 2. Execute (Shell.Process.exec for CLI wrappers)
  const output = await runCommand(target);

  // 3. Parse real output
  const results = parseOutput(output);

  // 4. Return for runner to persist
  return {
    success: results.length > 0,
    data: { results },
    newAssets: results.map(r => ({ type: "ip", value: r, parent: target }))
  };
}

function getFromMission(mission: MissionManifest): string | null {
  return mission.assets.ips.find(ip => ip.status === "discovered")?.value || null;
}

export default { meta, run };
```

## Patterns

### CLI Wrapper (dig, nslookup, mxlookup, subfinder, dirhunter)

```typescript
// Redirect output to temp file for capture
const tmpFile = "./tmp/output.txt";
await FileSystem.Mkdir("./tmp", { recursive: true });
await Shell.Process.exec(`command ${target} > ${tmpFile}`);
const output = await FileSystem.ReadFile(tmpFile, { absolute: false });
```

### Native Networking (scanner)

```typescript
const subnet = await Networking.GetSubnet(ip);
const ports = await subnet.GetPorts();
```

### Multi-target Support

```typescript
function resolveTargets(mission: MissionManifest, args?: string[]): string[] {
  if (args && args.length > 0) return args;
  return mission.assets.ips
    .filter(ip => ip.status === "discovered")
    .map(ip => ip.value);
}
```

## CLI Commands

```bash
# Mission management
nine create <mission> [seeds...]
nine attach <mission>
nine detach
nine status / show / assets / history

# Modules (target optional, uses mission assets if omitted)
nine scan [ip]
nine dig [domain]
nine subfinder [domain]
nine dirhunter [domain]
nine nettree [ip]
```

## References

- `.rules/hackhub.md` - API rules
- `docs/hackhub-api.md` - API reference
- `lib/ui.ts` - Color palette
- `lib/types.ts` - TypeScript types
