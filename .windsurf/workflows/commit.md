# Commit Convention

Simple descriptive commits for Nine CLI.

## Format

```
<type>: <description>

[optional body]
```

## Types

| Type | Use for |
|------|---------|
| `feat` | New module, new command, new feature |
| `fix` | Bug fix, correction |
| `refactor` | Code reorganization, cleanup |
| `mock` | Remove fake/mock data |
| `docs` | Documentation updates |

## Examples

```
feat: add mxlookup module for MX record enumeration

fix: parse tab-separated output in dig module

refactor: simplify target resolution in scanner

mock: remove generateMockGeoData from geoip

docs: update architecture with CLI wrapper pattern
```

## Rules

1. **No scopes** - Don't use `feat(modules):` or `fix(core):`
2. **Describe the change** - What does this commit do?
3. **Keep first line under 50 chars**
4. **Optional body** for complex changes

## When Commits Happen

After each completed task, suggest a commit:
```
Proposed commit: fix: correct temp file path in lynx module
```
