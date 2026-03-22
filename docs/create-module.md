# Creating a Nine Module

Quick reference for adding new capabilities to the Nine CLI.

## Module Structure

```
modules/<name>.ts
├── moduleInfo        # CLI registration metadata
├── COLORS            # Visual configuration
├── Types             # Interfaces for data structures
├── Core Functions    # Business logic
└── run()             # CLI entry point
```

## Minimal Template

```typescript
import { UI } from "../lib/ui";
import { loadProfile, saveModuleData, markModuleRun } from "../lib/profile";
import { writeJSON } from "../lib/storage";

export const moduleInfo = {
  name: "<name>",
  command: "<command>",
  aliases: ["-<short>", "--<long>"],
  description: "What it does",
  args: ["target"],
  // Optional: declare pipeline dependencies
  requires: [],      // Modules that must run first (e.g., ["scanner"])
  inputs: [],        // Data needed from profile.summary (e.g., ["ports"])
  outputs: [],       // Data produced for others (e.g., ["findings"])
};

const COLORS = {
  label: "white",
  target: "pink",
  success: "green",
  error: "red",
} as const;

export async function run(args: string[], flags: Record<string, string>): Promise<void> {
  const ui = UI.ctx();
  if (!args.length) { ui.error(`Usage: nine ${moduleInfo.command} <target>`); return; }
  
  const target = args[0];
  const profile = await loadProfile(target);
  
  // Execute logic
  const results = await executeLogic(target, ui);
  
  // Persist
  await saveModuleData(target, moduleInfo.name, results);
  await updateProfileSummary(profile, results);
  await markModuleRun(target, moduleInfo.name);
  
  ui.success(`Complete: loot/${target}/${moduleInfo.name}.json`);
}
```

## Target Validation

Modules should validate their target type:

```typescript
// For IP-based modules (scanner, nettree)
if (!Networking.IsIp(target)) {
  ui.error("Invalid IP address");
  return;
}

// For domain-based modules (subfinder, lynx)
if (Networking.IsIp(target)) {
  ui.error("This module requires a domain name, not an IP");
  return;
}
```

The CLI dispatcher automatically detects IPs and domains in `parseArgs()` — use the appropriate validation in your module.

Add to `nine.ts`:

```typescript
import * as <name> from "./modules/<name>";

const MODULES = {
  // ...existing modules
  <name>: { module: <name>, aliases: moduleInfo.aliases },
};
```

Update `showUsage()`:

```typescript
ui.print("  nine <command> <target>       Description (-<short>)");
```

## Data Persistence

| Function | Purpose |
|----------|---------|
| `loadProfile(target)` | Get/create target metadata |
| `saveModuleData(target, name, data)` | Save module results |
| `updateProfile(target, {ips, ports, ...})` | Update summary for chaining |
| `markModuleRun(target, name)` | Track execution |
| `getModuleData<T>(target, name)` | Read another module's data |

## UI Palette

Available colors: `white`, `gray`, `pink`, `cyan`, `green`, `orange`, `red`, `sora`, `yellow`, `purple`.

## Pipeline Integration

Declare dependencies in `moduleInfo`:

```typescript
requires: ["scanner"],      // Modules that must run first
inputs: ["ports"],          // Data needed from profile.summary
outputs: ["findings"],      // Data produced for others
```

## Checklist

- [ ] Export `moduleInfo` with metadata
- [ ] Export `run(args, flags)` function
- [ ] Validate target type (IP vs domain) before processing
- [ ] Register in `nine.ts` MODULES map
- [ ] Add to `showUsage()`
- [ ] Use `UI.ctx()` for output
- [ ] Define `COLORS` constant
- [ ] Call `loadProfile(target)` first
- [ ] Save with `saveModuleData()`
- [ ] Update `profile.summary`
- [ ] Call `markModuleRun()`
- [ ] Use native HackHub APIs only (see `.rules/hackhub.md`)
