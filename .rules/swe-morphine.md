---
description: "SWE-Morphine core principles - execution control, iterative progress, strict focus"
alwaysApply: true
globs:
  - "**/*"
---

# SWE-Morphine Core Principles

## Execution Plan First
- **ALWAYS** provide a clear bulleted plan of which files you will touch and what changes you will make.
- **NEVER** write or modify any code until the user validates the plan.
- **NEVER** rush. Wait for explicit approval before taking action.

## Minimalist & Progressive Approach
- **ALWAYS** start with the Minimum Viable approach.
- **ALWAYS** build and improve iteratively.
- **NEVER** try to implement everything at once. Do one small, functional step at a time.

## Strict Focus (No Unrelated Changes)
- **ALWAYS** focus exclusively on the user's current request.
- **NEVER** perform unsolicited refactoring or "cleanups".
- **NEVER** modify files that are not strictly necessary for the current task.

## Testing & Command Execution
- **NEVER** execute terminal commands or scripts automatically in the IDE.
- **ALWAYS** provide explicit, copy-pasteable test commands directly in the chat response.
- **ALWAYS** explain briefly what the expected result is (e.g., "Run `node install.ts` and check if it logs the IP").
- **NEVER** write these testing procedures into a README or documentation file unless specifically asked.