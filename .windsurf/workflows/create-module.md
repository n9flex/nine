---
description: Create a new Nine CLI module with full context injection from HackHub API, existing modules, and project architecture
---

# /create-module

Create a new Nine CLI module with complete context awareness.

## Context Injection (Auto-loaded)

The following context is automatically available:

- **HackHub API**: `.rules/hackhub.md` — Native API rules, No Fake Bash principle
- **API Reference**: `docs/hackhub-api.md` — Complete TypeScript API for HackHub
- **Module Guide**: `docs/create-module.md` — Step-by-step module creation guide
- **Architecture**: `docs/architecture.md` — Project structure and patterns
- **Existing Modules**: `modules/scanner.ts`, `modules/exploit.ts`, `modules/nettree.ts` — Reference implementations

## Module Requirements Checklist

Before generating code, verify the target module against:

- [ ] **Name**: Clear, lowercase, no spaces (e.g., `bruteforce`, `crawler`)
- [ ] **Purpose**: Single responsibility, fits in the pipeline
- [ ] **Inputs**: What data it needs (target string, flags, previous module data)
- [ ] **Outputs**: What it produces for `profile.summary` and module JSON
- [ ] **Dependencies**: Which modules must run first (if any)
- [ ] **API Usage**: Uses native HackHub APIs only (Networking, FileSystem, etc.)

## Generation Steps

### 1. Analyze Request
Parse the user's module request. Identify:
- Module name and command
- Core functionality
- Target type (IP, domain, email, name)
- Data dependencies

### 2. Select Reference Pattern
Choose the most similar existing module as template:

| If module does... | Use template |
|-------------------|--------------|
| Network operations (ports, IPs) | `modules/scanner.ts` |
| Exploitation, attacks | `modules/exploit.ts` |
| External Python script | `modules/nettree.ts` |
| OSINT, lookups | `modules/lynx.ts` |

### 3. Generate Structure

Create `modules/<name>.ts` with:

```typescript
// 1. Imports
import { UI } from "../lib/ui";
import { loadProfile, saveModuleData, markModuleRun } from "../lib/profile";
import { writeJSON } from "../lib/storage";

// 2. Module metadata
export const moduleInfo = {
  name: "<name>",
  command: "<command>",
  aliases: ["-<short>", "--<long>"],
  description: "<description>",
  args: ["target"],
  flags: { /* optional flags */ },
  requires: [/* dependency modules */],
  inputs: [/* profile.summary keys needed */],
  outputs: [/* profile.summary keys produced */],
};

// 3. Color configuration
const COLORS = {
  label: "white",
  target: "pink",
  // ...context-appropriate colors
} as const;

// 4. Types
interface <Name>Result {
  // Define output structure
}

// 5. Core logic
async function execute<Name>(target: string, ui: UI): Promise<<Name>Result> {
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
  const profile = await loadProfile(target);
  
  // Check dependencies if applicable
  // const scanData = await getModuleData<...>(target, "scanner");
  
  ui.info(`Running ${moduleInfo.name} on ${target}...`);
  
  const results = await execute<Name>(target, ui);
  
  await saveModuleData(target, moduleInfo.name, {
    ...results,
    executedAt: new Date().toISOString(),
  });
  
  // Update profile summary
  profile.summary.<key> = results.<data>;
  profile.updated = new Date().toISOString();
  await writeJSON(target, "profile.json", profile);
  
  await markModuleRun(target, moduleInfo.name);
  
  ui.success(`Results saved to loot/${target}/${moduleInfo.name}.json`);
}
```

### 4. Update Dispatcher

Modify `nine.ts`:

```typescript
// Add import
import * as <name> from "./modules/<name>";

// Add to MODULES registry
const MODULES = {
  // ...existing
  <name>: { module: <name>, aliases: <name>.moduleInfo.aliases },
};

// Update showUsage()
function showUsage() {
  ui.print("  nine <command> <target>    <description> (-<short>)");
}
```

### 5. Verification

- [ ] TypeScript compiles without errors
- [ ] Uses native HackHub APIs only (no `Shell.Process.exec` except for Python wrappers)
- [ ] Exports `moduleInfo` and `run()`
- [ ] Follows color palette from `lib/ui.ts`
- [ ] Saves to `loot/<target>/<name>.json`
- [ ] Updates `profile.summary`
- [ ] Calls `markModuleRun()`

## Output Format

Provide:

1. **Module file** (`modules/<name>.ts`) — complete implementation
2. **nine.ts diff** — registration and usage updates
3. **Brief explanation** — what it does and how it fits the pipeline

## Rules

- **Never** invent HackHub APIs — only use documented ones from `docs/hackhub-api.md`
- **Always** use `lib/ui.ts` for output, never raw `println()`
- **Always** define `COLORS` constant for visual consistency
- **Always** persist results via `saveModuleData()` and `writeJSON()`
- **Prefer** native APIs over shell execution (`.rules/hackhub.md`)
- **Keep** modules focused — one responsibility per module