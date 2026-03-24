---
description: "Nine CLI Module Creation Protocol - Plan, audit, build independently, strict UI"
alwaysApply: false
globs:
  - "**/modules/**/*.ts"
  - "nine.ts"
---

# Module Creation Protocol

## 1. Discovery & Scavenging (BEFORE CODING)
- **ALWAYS** ask the user to explicitly define the exact need before doing anything.
- **ALWAYS** audit existing functional scripts in the folder `repo/` (e.g., `sora.ts`, `kraken.ts`, `scanx.ts`, `find.ts`, `install-example.ts`, `efx.ts`, `SimpleExploit.ts`, `hackdb.ts`) to see if logic can be reused, adapted, or used as inspiration.
- **NEVER** write a single line of code without a validated Implementation Plan.

## 2. Independence & Architecture
- **ALWAYS** design the module to be as independent and standalone as possible. It should ideally be usable outside of the main CLI.
- **ALWAYS** explicitly justify to the user if a module *must* be tightly coupled to `nine.ts` or other core files.
- **NEVER** duplicate code. If a utility function exists (like recursive search in `find.ts`), import it. If it doesn't, propose adding it to a shared `utils.ts`.

## 3. The Implementation Plan
Before creating or modifying files, output a strict plan for user approval containing:
- **Scope**: What exactly is being built.
- **Target Files**: Which files will be created/modified (e.g., `modules/new.ts`, `nine.ts` for routing, `install.ts`).
- **Inspiration**: Which existing repo/script we are leveraging (e.g., `kraken.ts` for UI, `install-example.ts` for setup).
- **Independence Status**: Can this run standalone? (Yes / No + Reason).

## 4. UI & Output Protocol (SORA STRICT)
- **NEVER** use `print()`, `println()`, or `console.log()` directly.
- **ALWAYS** import and instantiate `Sora.ctx()` for all terminal outputs.
- **ALWAYS** set consistent block and table widths (e.g., `out.setBlockWidth(60)`) at the start of the module, inspired by `kraken.ts` and `scanx.ts`.
- **ALWAYS** use Sora's built-in methods (`out.success`, `out.error`, `out.printTable`, `out.promptText`) to maintain a unified CLI experience.

## 5. Execution, Installation & Testing
- **ALWAYS** keep the logic clean, minimal, and native to HackHub.
- **ALWAYS** leverage the `.dat` config generation and absolute path resolution from `install-example.ts` when building installation scripts or standalone modules.
- **NEVER** make a massive monolithic commit. Build the module, test it standalone, then integrate it into the CLI routing.
- **ALWAYS** provide copy-pasteable test procedures in the chat so the user can verify the module directly in the game.