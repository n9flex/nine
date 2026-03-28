---
description: Nine CLI audit - Quick validation checklist
---

# /audit

Quick validation of module compliance.

## 5-Point Checklist

### 1. Return Format
```typescript
// ✅ Correct
return { success: boolean, data: any, newAssets: Array<Asset> }

// ❌ Wrong - missing newAssets or wrong structure
return { results: [...] }
```

### 2. No Mock Data
- ✅ Real command execution with `Shell.Process.exec()`
- ✅ Parse actual output
- ❌ Never fake/hardcoded results

### 3. Target Resolution
- ✅ Uses `args?.[0]` OR mission assets
- ✅ Handles "no target" case gracefully

### 4. UI Output
- ✅ Uses `ui.info()`, `ui.success()`, `ui.error()`
- ❌ No direct `println()` or `console.log()`

### 5. NewAssets Format
```typescript
// ✅ Correct
newAssets: [
  { type: "ip", value: "1.2.3.4", parent: "target" },
  { type: "domain", value: "sub.example.com", parent: "example.com" }
]
```

## Quick Audit Output

```
================================================================================
AUDIT: modules/recon/dig.ts
================================================================================
✅ Return format      - Pass
✅ No mock data       - Pass  
✅ Target resolution   - Pass
✅ UI output           - Pass
✅ NewAssets format    - Pass

RESULT: 5/5 PASS
```

## Usage

```bash
/audit <file>        # Audit specific module
/audit --all         # Audit all modules
```
