# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## GitNexus

See `docs/agents/gitnexus.md`.

## Commands

```bash
npm run dev           # Vite dev server (with TS + Biome overlay via vite-plugin-checker)
npm run build         # tsc + vite build
npm run test:run      # All tests (unit + browser)
npm run test:unit     # src/domain/** and src/schemas/** in Node
npm run test:browser  # src/repositories/**, src/components/**, src/hooks/** in Chromium
npm run test:coverage # Coverage report (thresholds enforced for domain/ and schemas/)
npm run lint:fix      # Biome auto-fix
npm run arch:check    # Enforce layer dependency rules (dependency-cruiser)
```

Run a single test file:
```bash
npx vitest run --project unit src/schemas/bean.test.ts
npx vitest run --project browser src/repositories/beanRepository.test.ts
```

Pre-commit hook (lefthook) runs `biome check`, `tsc --noEmit`, and `arch:check` in parallel automatically.

## Architecture

### Layer rules (enforced by dependency-cruiser, see `.dependency-cruiser.cjs`)

```
src/schemas/     ← Zod schemas. Single source of truth for all types.
                   z.infer<> generates TypeScript types. No framework deps.
src/domain/      ← Pure functions only (calcWeightLossRate, isCleanlinessWarning…).
                   Zero deps on repositories, hooks, components, or frameworks.
src/db/          ← Dexie DB instance (src/db/index.ts). Single singleton `db`.
src/repositories/← Data access. Validates output via Schema.parse() on every read.
                   Extends BaseRepository<T> (src/repositories/base.ts).
src/hooks/       ← TanStack Query hooks. Calls repositories, never DB directly.
src/components/  ← React UI. Calls hooks, never repositories directly.
src/routes/      ← TanStack Router file-based routes (auto-generates routeTree.gen.ts).
```

Violations of these rules fail the pre-commit hook.

### Key decisions (see `docs/adr/` for full rationale)

- **Zod v4 schemas** — `src/schemas/` is the only place types are defined. Use `BeanSchema.parse()` on reads from IndexedDB and API responses; the TypeScript type alone is sufficient for internal writes.
- **TanStack Query + Repository pattern** — Tauri migration only requires replacing `src/repositories/` implementations (ADR-0001).
- **TanStack Form** — Use `validators: { onSubmit: SomeZodSchema }` directly. No adapter needed; Zod v4 implements Standard Schema and is auto-detected (ADR-0006). In browser-mode Vitest tests, `vi` must be imported explicitly: `import { vi } from "vitest"`.
- **Stock decrement** — Only on RoastLog create, never on edit/delete (ADR-0002).
- **TanStack Router** — Routes live in `src/routes/`. `routeTree.gen.ts` is auto-generated; never edit it.

### Test harness

| Project | Environment | Covers |
|---------|------------|--------|
| `unit` | Node | `src/domain/`, `src/schemas/` |
| `browser` | Playwright/Chromium | `src/repositories/`, `src/components/`, `src/hooks/` |

Browser tests use real IndexedDB (no fake-indexeddb). Each test creates a uniquely-named Dexie DB and deletes it in `afterEach`. MSW mocks Open-Meteo API responses; handlers are in `src/test/mocks/handlers.ts`.

Coverage thresholds: `src/domain/**` and `src/schemas/**` must stay at 100%.

### Domain language

Read `CONTEXT.md` before naming anything. Key terms: **RoastLog** (not "session"), **Bean** (green/unroasted only), **Tasting**, **WeightLossRate** (derived, never stored), **Stock** (auto-decremented on create only), **Crack** (FirstCrack/SecondCrack).

## Agent skills

### Autonomous operation
Workflow, DoD, and decision boundaries when running between user turns. **Read this first** when picking up unattended work. See `docs/agents/autonomous-operation.md`.

### Issue tracker
Issues live in GitHub Issues. See `docs/agents/issue-tracker.md`.

### Triage labels
Default five-role vocabulary (needs-triage, needs-info, ready-for-agent, ready-for-human, wontfix). See `docs/agents/triage-labels.md`.

### Domain docs
Single-context layout — `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.
