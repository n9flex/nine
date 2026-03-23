---
description: Create a new Nine CLI module for mission-centric architecture
---

# /create-module

## Workflow

1. **Write test first** → Create `tests/test-<name>.ts` validating behavior on HackHub
2. **Validate APIs** → Run test on HackHub to verify API usage
3. **Implement module** → Create `modules/<category>/<name>.ts`
4. **Update nine.ts** → Register module in dispatcher

## Module Template

```typescript
import { UI } from "../lib/ui";
import { MissionManager } from "../core/mission";

export const meta = {
  name: "<name>",
  command: "<cmd>",
  category: "recon",  // recon | enum | vuln
  targetTypes: ["ip"], // ip | domain | any
  requires: [],
  outputs: [],
};

export async function run(
  mission: MissionManifest,
  ui: UI,
  args?: string[]
): Promise<ModuleResult> {
  // Validate target
  const target = args?.[0] || getDefaultTarget(mission);
  if (!target) { ui.error("No target"); return { success: false }; }
  
  // Implementation
  const data = await execute(target);
  
  return {
    success: true,
    data,
    newAssets: [] // Auto-added to manifest
  };
}
```

## Rules

- Test before implementation (test-driven)
- Use `UI.ctx()` for all output (no raw `println`)
- Use absolute paths: `FileSystem.cwd().absolutePath`
- Only native HackHub APIs (see `.rules/hackhub.md`)
- Never write to manifest directly (use runner)
- Clean code: typed, commented, single responsibility