---
description: Nine CLI audit command - Validate architecture compliance before/after implementation
---

# /audit Command

Validate code against Nine CLI architecture rules.

## Usage

```bash
/audit <file>           # Audit specific file
/audit --pre <milestone> # Pre-implementation audit
/audit --post <milestone> # Post-implementation audit
/audit --full M1         # Full milestone validation
```

## Checklist (10 Points)

### 1. 6-Section Module Structure
```typescript
// ✓ 1. Imports
// ✓ 2. Module metadata (meta)
// ✓ 3. Core logic (run function)
// ✓ 4. Target resolution (resolveTargets)
// ✓ 5. Main processing
// ✓ 6. Return format
```

### 2. Native APIs Only
- ✅ `Networking.GetSubnet()`, `FileSystem.ReadFile()`
- ❌ `Shell.Process.exec('nmap')`, `Shell.Process.exec('whois')`
- ✅ Exception: Python wrappers only

### 3. Runner Writes Manifest
- ✅ `return { newAssets: [...] }` - Runner handles persistence
- ❌ `await FileSystem.WriteFile('manifest.json', ...)` in module

### 4. Absolute Paths
- ✅ `` `${cwd.absolutePath}/loot/${mission}` ``
- ❌ `loot/${mission}` (relative)

### 5. English Code
- ✅ `function resolveTargets()`
- ❌ `function resoudreCibles()`

### 6. UI Class for Output
- ✅ `ui.success()`, `ui.table()`, `ui.section()`
- ❌ `println()`, `console.log()`, `print()`

### 7. Types Defined/Imported
- ✅ All interfaces in `lib/types.ts`
- ✅ Proper imports in modules
- ✅ No `any` without justification

### 8. Error Handling
- ✅ Try/catch around API calls
- ✅ Graceful degradation
- ✅ Error messages via `ui.error()`

### 9. Logic Separated
- ✅ `core/` - Infrastructure only
- ✅ `lib/` - Shared utilities
- ✅ `modules/` - Business logic

### 10. Color Palette
| Element | Color |
|---------|-------|
| Targets/external IPs | `rgb(255, 0, 179)` pink |
| Shells/interactive | `rgb(30, 191, 255)` cyan |
| Success/open ports | `#22c55e` green |
| Warnings | `#f59e0b` orange |
| Errors/closed ports | `#ff4c4cff` red |
| Internal IPs/counts | `rgba(195, 105, 255, 0.86)` purple |

## Output Format

```
================================================================================
AUDIT: lib/types.ts
================================================================================

✅ 1. Module structure      - N/A (lib file)
✅ 2. Native APIs           - Pass
✅ 3. Runner writes manifest- N/A (lib file)
✅ 4. Absolute paths        - Pass
✅ 5. English code          - Pass
✅ 6. UI class              - N/A (types file)
✅ 7. Types defined         - Pass
✅ 8. Error handling        - N/A
✅ 9. Logic separated       - Pass
✅ 10. Color palette        - N/A

RESULT: 10/10 PASS
```

## Pre-Implementation Audit

Run before writing code:

1. Read existing test file
2. Validate API usage against `docs/hackhub-api.md`
3. Check dependencies on other files
4. Confirm file location (core/lib/modules)

## Post-Implementation Audit

Run after writing code:

1. Verify against test expectations
2. Check all 10 points
3. Validate on HackHub if possible
4. Update session memory

## Full Milestone Audit

```
/audit --full M1

Files to check:
- lib/types.ts
- lib/ui.ts
- lib/storage.ts
- lib/utils.ts
- core/mission.ts
- core/session.ts
- core/runner.ts
- nine.ts
- tests/test-milestone-1.ts

Per file: 10-point check
Overall: All files consistent?
```
