# 自律運用ガイドライン

Claude Code がこのリポジトリで自律的に作業を進める際のルール。`CLAUDE.md` のベースルールに対する補足で、矛盾した場合はこのファイルが優先される。

## 1. 作業の起点

自律ターンの最初に、以下を順に確認する。

1. **TaskList を読む** — 最優先タスクを特定する。`in_progress` のタスクが自分のものなら継続、未着手で `blockedBy` が空のタスクがあれば `TaskUpdate` で `in_progress` に切り替える。
2. **GitHub Issue を引く** — タスク本文に `#<number>` がある場合は `gh issue view <number> --comments` で受け入れ条件と背景を確認する。
3. **CONTEXT.md / 該当 ADR を読む** — 触る領域に関連する用語・決定事項を必ず確認する。

タスクも Issue も無い場合は、`docs/requirements.md` と `gh issue list --state open --label ready-for-agent` を比較し、次の縦スライスを選ぶ。

## 2. ワークフロー（1 スライス = 1 PR）

```
Issue 選択
  ↓
ブランチ作成 (slice-N-short-name)
  ↓
TDD: 失敗するテストを書く → 実装 → リファクタ
  ↓
ローカル品質ゲート (§4) すべて通す
  ↓
コミット → push → PR 作成
  ↓
Issue を close（PR の "Closes #N" で自動）
```

- **1 PR = 1 縦スライス**。複数スライスを 1 PR にまとめない。
- 縦スライス内の中間コミットは細かく刻んでよい（例: schema → repository → hook → component の各層で 1 コミット）。

## 3. テスト方針（TDD 必須）

- **新規ロジック・新規 UI は必ずテスト先行**。`src/domain/` と `src/schemas/` は coverage 100% を維持する。
- レイヤ別の置き場所:
  - 純関数 → `src/domain/*.test.ts`（unit project）
  - Zod スキーマ → `src/schemas/*.test.ts`（unit project）
  - Dexie 経由の Repository → `src/repositories/*.test.ts`（browser project）
  - TanStack Query フック → `src/hooks/*.test.tsx`（browser project）
  - React コンポーネント → `src/components/*.test.tsx`（browser project）
- ブラウザテストは **本物の IndexedDB** を使う。fake-indexeddb は導入しない。
- `vi` を使うブラウザテストでは `import { vi } from "vitest"` を明示する（ADR-0006）。
- 外部 API は MSW でモック。ハンドラは `src/test/mocks/handlers.ts` に集約。

## 4. Definition of Done

PR を作成する前にすべて満たすこと。

| ゲート | コマンド | 失敗時の対応 |
|--------|----------|--------------|
| Lint | `npm run lint:fix` | 自動修正で済まない違反は手で直す。`biome-ignore` は原則使わない |
| 型 | `npx tsc -b --noEmit` | `any` で逃げない。スキーマから派生させる |
| 依存関係ルール | `npm run arch:check` | 違反は構造の問題。レイヤ越境は必ず正規ルートへ直す |
| 単体テスト | `npm run test:unit` | 全 pass |
| ブラウザテスト | `npm run test:browser` | 全 pass |
| カバレッジ | `npm run test:coverage` | `src/domain/`・`src/schemas/` は 100% 維持 |

pre-commit hook（lefthook）は lint / tsc / arch を並列実行する。**`--no-verify` での回避は禁止**（`CLAUDE.md` 既定）。フック失敗時は原因を直して新しいコミットを作る（`--amend` しない）。

## 5. 自律判断の境界

### そのまま進めてよいこと

- `ready-for-agent` ラベル付き Issue の実装（受け入れ条件に沿う範囲）
- 既存パターン踏襲のコード追加（schema → repository → hook → component）
- バグ修正、テスト追加、リファクタ（同じスライス内）
- Lint / 型 / arch:check 違反の修正
- DoD を満たした PR の作成と Issue の close

### ユーザーに確認してから進めること

- **依存追加・バージョン更新**（`package.json` の `dependencies` / `devDependencies`）
- **ADR 新規作成 / 既存 ADR との矛盾**を発見した場合
- **`CONTEXT.md` のドメイン用語の追加・変更**
- **`docs/requirements.md` の変更**（仕様変更を伴う実装）
- **アーキテクチャ設定の変更**（`.dependency-cruiser.cjs`, `lefthook.yml`, `vite.config.ts` のレイヤ構成部分, `tsconfig`）
- **PR レビューや push 後のリベース**等、共有状態に影響する操作
- **スコープが Issue 受け入れ条件から外れる**変更が必要になった場合（先に Issue にコメントで提案）

判断に迷ったら手を止めて聞く。沈黙して進めない。

## 6. ブランチ・コミット規約

git log の慣習に合わせる。

- **ブランチ名**: `slice-N-<kebab-summary>`（例: `slice-3-bean-edit-delete`）
- **コミットメッセージ**:
  - 1 行目は英語の命令形 + 簡潔（例: `Add Bean detail page with edit/delete actions`）
  - TDD で進めた場合は `(TDD, ...)` などの補足を末尾に付けて構わない
  - `Co-Authored-By` は CLAUDE.md の規約に従う

## 7. PR 作成

- タイトル: `Slice N: <内容>` または短い英文（70 文字以内）
- 本文に必ず含める:
  - `## Summary` — 1〜3 行で何をしたか
  - `## Test plan` — 動作確認した内容のチェックリスト
  - `Closes #<issue-number>` — 対応する Issue
- ドラフト PR は使わない（このリポジトリは個人運用のため）

## 8. Issue tracker 運用

- **Triage**: `needs-triage` Issue を着手前に `ready-for-agent` / `ready-for-human` / `wontfix` のいずれかに振り分ける（`docs/agents/triage-labels.md`）。
- **着手時**: Issue にコメント（任意）。GH 上の assign は不要。
- **完了時**: PR の `Closes #N` で自動 close。手動 close する場合は `gh issue close <N> --comment "..."`。
- **情報不足**: 仕様が不明な点は `needs-info` を付けてユーザーへの質問をコメント。

## 9. ADR / CONTEXT.md 更新トリガ

新規 ADR を起こすべきサイン:

- 設計上の選択肢が 2 つ以上あり、どちらかに決め打つ場合
- 既存 ADR と矛盾する判断をする場合（→ 必ずユーザー確認）
- 「なぜこうしたか」を将来の自分が忘れそうな決定

`CONTEXT.md` に追記すべきサイン:

- requirements や ADR で出てこなかった用語が、コードの命名で必要になった場合
- 同じ概念に対して 2 通り以上の呼び方が混ざり始めた場合

どちらも**ユーザー確認を経てから**書く（§5）。

## 10. 失敗時の対応

- **テストが不安定**: 原因を特定するまで「リトライで直す」をしない。`afterEach` での DB 削除が漏れていないか、MSW の handler 衝突が無いかをまず疑う。
- **arch:check 違反**: コードを書き換える。設定（`.dependency-cruiser.cjs`）を緩めない。
- **型エラー**: スキーマを直すか、実装側を直す。`as` キャストや `any` で握り潰さない。
- **詰まった**: ユーザーに状況を簡潔に共有して止まる。勝手に方針を変えない。
