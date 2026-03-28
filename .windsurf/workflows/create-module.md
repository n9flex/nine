---
description: Create a new Nine CLI module
---

# /create-module

## Workflow

1. Copy existing working module as template
2. Adapt for your use case
3. Test on HackHub
4. Register in nine.ts

## Module Template

```typescript
// @ts-nocheck
import { UI } from "../../lib/ui";
import { MissionManifest, ModuleResult } from "../../lib/types";

export const meta = {
  name: "modulename",
  command: "cmd",
  description: "What it does",
  requires: [],
  inputs: ["ip"],
  outputs: ["results"],
};

export async function run(
  mission: MissionManifest,
  ui: UI,
  args?: string[]
): Promise<ModuleResult> {
  // Resolve target
  const target = args?.[0] || resolveTarget(mission);
  if (!target) {
    ui.error("No target specified");
    return { success: false, data: { error: "No target" } };
  }

  // Execute (CLI wrapper pattern)
  const tmpFile = "./tmp/output.txt";
  await FileSystem.Mkdir("./tmp", { recursive: true });
  await Shell.Process.exec(`command ${target} > ${tmpFile}`);
  const output = await FileSystem.ReadFile(tmpFile, { absolute: false });

  // Parse and return
  const results = parseOutput(output);
  
  return {
    success: results.length > 0,
    data: { results },
    newAssets: results.map(r => ({ type: "ip", value: r, parent: target }))
  };
}

function resolveTarget(mission: MissionManifest): string | null {
  return mission.assets.ips.find(ip => ip.status === "discovered")?.value || null;
}

export default { meta, run };
```

## Checklist

- [ ] Module returns `{ success, data, newAssets }`
- [ ] No mock/fake data - real commands only
- [ ] Uses `ui.*` methods for output
- [ ] Target resolution from args or mission
- [ ] Registered in nine.ts MODULES map
- [ ] Added to showUsage()

## References

- `docs/architecture.md` - Full architecture overview
- `docs/hackhub-api.md` - API reference