---
description: Quick debug workflow for Nine CLI modules
---
# Debug Workflow

Use this workflow when a module is failing silently or returning unexpected results.

## Steps

1. **Add debug logging** at key points:
   - Before command execution: `ui.info("Executing: <command>")`
   - After getting output: `ui.info("Output type: " + typeof output)`
   - Raw content: `ui.info("Raw: " + JSON.stringify(output).substring(0, 200))`

2. **Check Shell.Process.exec behavior**:
   - May return a function that needs to be called
   - May write to stdout directly instead of returning
   - Check if redirection `> file` works or use temp file pattern

3. **Verify output parsing**:
   - Log raw output before any parsing
   - Check for ANSI codes, tabs, newlines
   - Use simple `match()` instead of `matchAll()` if needed

4. **Common fixes**:
   - Function return: `const result = await Shell.Process.exec(cmd); const output = typeof result === 'function' ? await result() : result;`
   - Temp file pattern: `await Shell.Process.exec(cmd + ' > ' + tempFile); const output = await FileSystem.ReadFile(tempFile);`

5. **Clean up** after fixing - remove all debug logs
