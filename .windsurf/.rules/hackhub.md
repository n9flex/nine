---
description: "HackHub API core principles - native TypeScript, no fake bash, no hallucination"
alwaysApply: true
globs:
  - "**/*.ts"
---

# HackHub API Rules

Core principles for HackHub TypeScript scripting environment.

## Required File Header

**ALWAYS** add `// @ts-nocheck` at the beginning of files using HackHub internal APIs to avoid lint errors:

```typescript
// @ts-nocheck
import { UI } from "../../lib/ui";
```

## Environment

- Native TypeScript with game-provided globals
- No standard Node.js modules (fs, path, process)
- Use HackHub APIs only

## API Categories

| Category | APIs |
|----------|------|
| **Core I/O** | `println()`, `prompt()`, `sleep()`, `newLine()` |
| **Shell** | `Shell.GetArgs()`, `Shell.Process.exec()` |
| **File System** | `FileSystem.cwd()`, `ReadDir()`, `ReadFile()`, `WriteFile()`, `Mkdir()`, `Remove()` |
| **Networking** | `Networking.IsIp()`, `GetSubnet()`, `GetPorts()`, `PingPort()`, `GetPortData()`, `Wifi.*` |
| **Crypto** | `Crypto.Hashcat.*`, `Crypto.Hash.*` |
| **HackDB** | `HackDB.ListExploits()`, `SearchExploits()`, `DownloadExploit()` |
| **Package Mgmt** | `checkLib()`, `installLib()` |
| **Debug** | `Debug.Log()`, `Debug.Error()` |

## Shell.Process.exec() - When to Use

**Always use for CLI wrapper modules:**
- DNS tools: `dig`, `nslookup`, `mxlookup`
- Enumeration: `subfinder`, `dirhunter`, `lynx`
- Python scripts: `nettree.py`, user enumeration scripts

**Pattern:**
```typescript
// Redirect output to temp file for capture
const tmpFile = "./tmp/output.txt";
await Shell.Process.exec(`command ${target} > ${tmpFile}`);
const output = await FileSystem.ReadFile(tmpFile, { absolute: false });
```

## Anti-Patterns

- ❌ `console.log()` → use `println()` or `UI.ctx()`
- ❌ `fetch()` → doesn't exist in HackHub
- ❌ Standard npm modules → not available
- ❌ `process.argv` → use `Shell.GetArgs()`

## Error Handling

Use try/catch with UI feedback:
```typescript
try {
  await Shell.Process.exec(`command ${target}`);
} catch (err) {
  ui.error(`Command failed: ${err}`);
  return { success: false };
}
```

## Mock Data Prohibition
- **NEVER** use mock data, fake responses, or hardcoded examples in real modules
- **NEVER** include sample/test data in production modules
- **ALWAYS** process only actual mission data from manifest.assets