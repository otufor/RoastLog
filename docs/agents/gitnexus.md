<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **RoastLog**. Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> If any GitNexus tool warns the index is stale, run `npx gitnexus analyze` in terminal first.

## Always Do

- **MUST run impact analysis before editing any symbol.** Run `gitnexus_impact({target: "symbolName", direction: "upstream"})` and report the blast radius before proceeding.
- **MUST run `gitnexus_detect_changes()` before committing** to verify changes only affect expected symbols.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk.
- NEVER rename symbols with find-and-replace — use `gitnexus_rename`.

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/RoastLog/context` | Codebase overview, index freshness |
| `gitnexus://repo/RoastLog/clusters` | All functional areas |
| `gitnexus://repo/RoastLog/processes` | All execution flows |
| `gitnexus://repo/RoastLog/process/{name}` | Step-by-step execution trace |

## CLI Skills

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->
