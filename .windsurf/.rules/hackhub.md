---
description: "HackHub API core principles - native TypeScript, no fake bash, no hallucination"
alwaysApply: true
globs:
  - "**/*.ts"
---

# HackHub Core Principles

## Environment & Syntax
- **ALWAYS** write standard **TypeScript**.
- **ALWAYS** target the HackHub native API environment (global objects).
- **NEVER** use standard Node.js modules (like `fs`, `path`, `child_process`).
- **NEVER** keep cosmetic `sleep()` calls or fake loading screens.
- **ALWAYS** add `// @ts-nocheck` at the beginning of files using HackHub internal APIs to avoid lint errors.

## The "No Fake Bash" Rule
- **NEVER** use `Shell.Process.exec()`, `safeExec()`, or any bash command wrapper (e.g., `whois`, `dig`, `python3`, `nmap`).
- **ALWAYS** map OSINT and hacking actions to native HackHub API objects.

## No Hallucination Rule
- **NEVER** invent or guess HackHub API classes, methods, or properties.
- **NEVER** assume standard library functions exist in the game.
- **ALWAYS** stop and write **"API UNKNOWN"** if you lack the exact syntax.
- **ALWAYS** ask the user to search the game's code or documentation to provide the missing API function.

## API Refactoring Mapping
| Fake Terminal Command | Native HackHub API Equivalent |
|-----------------------|-------------------------------|
| `cat <file>`          | `FileSystem.ReadFile(path)`   |
| `ls <dir>`            | `FileSystem.ReadDir(path)`    |
| `wget / git clone`    | `HackDB.DownloadExploit()`    |
| `dig / whois`         | `Networking.Resolve()`        |
| `ip checking`         | `Networking.IsIp()`           |

## Writing Tone
- **ALWAYS** write clean, pragmatic code.
- **ALWAYS** handle errors directly.
- **NEVER** use empty `catch {}` blocks just to force execution.