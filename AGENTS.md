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

Pre-commit hook (lefthook) runs `biome check`, `tsc --noEmit`, `arch:check`, and `gitleaks protect --staged` in parallel automatically.

### Local setup: gitleaks

gitleaks はシークレット漏洩を検知する pre-commit ツールです。初回セットアップ時にインストールしてください。

```bash
# WSL / Linux（推奨）— /usr/local/bin に配置（hooks の最小 PATH で確実に見つかる）
GITLEAKS_VERSION=$(curl -s "https://api.github.com/repos/gitleaks/gitleaks/releases/latest" \
  | grep -Po '"tag_name": "v\K[0-9.]+')
wget -qO gitleaks.tar.gz \
  "https://github.com/gitleaks/gitleaks/releases/latest/download/gitleaks_${GITLEAKS_VERSION}_linux_x64.tar.gz"
tar -xzf gitleaks.tar.gz gitleaks
sudo mv gitleaks /usr/local/bin/
rm gitleaks.tar.gz
gitleaks version

# macOS
brew install gitleaks

# Windows
winget install gitleaks.gitleaks

# その他 (Go が入っている場合)
go install github.com/gitleaks/gitleaks/v8@latest

# バイナリ直接ダウンロード
# https://github.com/gitleaks/gitleaks/releases
```

> **WSL 注意**: git hooks は最小 PATH で実行されるため、`lefthook.yml` では絶対パス `/usr/local/bin/gitleaks` を使っています。`which gitleaks` で確認してください。

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
- **TanStack Query + Repository pattern** — Tauri migration only requires replacing `src/repositories/` implementations (ADR-0001). When a component derives data from multiple queries (maps or sets), OR **all** their `isLoading` flags before rendering: `if (q1.isLoading || q2.isLoading || q3.isLoading) return null`. Checking only the "primary" query allows empty maps to flash on screen before secondary queries resolve.
- **React Compiler** — `babel-plugin-react-compiler` is enabled globally. Do **not** write `useMemo` / `useCallback` / `React.memo` — the compiler memoizes automatically. Plain inline expressions and functions are preferred.
- **TanStack Form** — Use `validators: { onSubmit: SomeZodSchema }` directly. No adapter needed; Zod v4 implements Standard Schema and is auto-detected (ADR-0006). In browser-mode Vitest tests, `vi` must be imported explicitly: `import { vi } from "vitest"`. All form components in `src/components/` must use TanStack Form with `validators: { onSubmit: Schema }`. Plain `useState` forms bypass Zod validation — repositories do not validate on write, so the form is the sole guard against invalid data entering IndexedDB.
- **Stock decrement** — Only on RoastLog create, never on edit/delete (ADR-0002).
- **TanStack Router** — Routes live in `src/routes/`. `routeTree.gen.ts` is auto-generated; never edit it.
- **Date parsing in domain** — Never `new Date("YYYY-MM-DD")`; it is parsed as UTC midnight and breaks `.getMonth()` etc. for users west of UTC. Build dates from local components (ADR-0007).

### Test harness

| Project | Environment | Covers |
|---------|------------|--------|
| `unit` | Node | `src/domain/`, `src/schemas/` |
| `browser` | Playwright/Chromium | `src/repositories/`, `src/components/`, `src/hooks/` |

Browser tests use real IndexedDB (no fake-indexeddb). MSW mocks Open-Meteo API responses; handlers are in `src/test/mocks/handlers.ts`.

**DB isolation by layer:**
- `src/repositories/` tests — create a uniquely-named Dexie in `beforeEach` (`new Dexie(\`test-${crypto.randomUUID()}\`)`), delete it in `afterEach` (`Dexie.delete(db.name)`). Repositories accept a `Table` via constructor so a fresh Dexie can be injected.
- `src/components/` and `src/hooks/` tests — hooks bind to the global `db` singleton at module scope (`const repo = new Repo(db.table)`), making per-test DB injection infeasible without a full DI refactor. Use `beforeEach` to clear **all** tables via `Promise.all`. Do not clear only the table under test — other tables may hold stale data from a previously failed test.

```ts
beforeEach(async () => {
  await Promise.all([
    db.roastLevels.clear(), db.flavorTags.clear(), db.roastDevices.clear(),
    db.beans.clear(), db.roastLogs.clear(),
  ]);
});
```

Coverage thresholds: `src/domain/**` and `src/schemas/**` must stay at 100%.

### Accessibility conventions

- `role="dialog"` must always have `aria-labelledby` pointing to a visible heading (`<h3 id="...">`) within it. Without it, screen readers announce only "dialog" with no context.
- Do not use `role="img"` on a container with interactive children (`<button>` etc.) — browsers implicitly apply `role="presentation"` to all descendants, hiding them from the accessibility tree. Use `role="group"` + `aria-label` for interactive composite widgets; `role="img"` for display-only. See `StarRating` for the reference pattern (switches role based on whether `onChange` is provided).

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
