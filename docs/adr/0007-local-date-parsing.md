# ドメイン層での日付パースはローカル時刻コンポーネントで行う

ドメイン関数で `YYYY-MM-DD` 形式の日付文字列を扱うときは、必ずローカル時刻のコンポーネントから `Date` を構築する。

```ts
// ✗ NG: UTC 深夜 0 時として解釈される。getMonth() 等と組み合わせるとタイムゾーンずれが発生
const d = new Date("2026-05-01");

// ✓ OK: ローカル時刻のコンポーネントで構築
const m = "2026-05-01".match(/^(\d{4})-(\d{2})-(\d{2})$/);
if (!m) return null;
const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
```

## なぜか

`new Date("YYYY-MM-DD")` は ECMAScript 仕様で **UTC 深夜 0 時** として解釈される。一方 `.getMonth()` / `.getFullYear()` 等はローカル時刻を返す。UTC マイナス圏（UTC-1〜UTC-12）のユーザーが月初日（例: `"2026-05-01"`）を保存すると、ローカル時刻では前月末扱いになり、月差・日数差の計算が 1 ずれる。

このアプリは `<input type="date">` から ISO date 文字列を直接保存するため、保存値はユーザーの暦上の日付であり、UTC との時差を含まない。**ドメイン関数はこの「暦上の日付」をそのまま扱うべき**で、UTC 解釈を経由してはならない。

## 適用範囲

- `src/domain/` 内のすべての日付計算関数
- 比較用には `today` 引数を取り、テストから固定 Date を渡せる形にする（`monthsSincePurchase(purchasedAt, today)`）

`src/domain/bean.ts` の `monthsSincePurchase` がこの規約の参考実装。

## Considered Options

- **`new Date(iso)` のまま使う（不採用）**: シンプルだが UTC- 圏で月初日にバグ。テストも `15` 日固定では検出できない
- **`Date.UTC()` で UTC 統一（不採用）**: ユーザーの暦上の日付と UTC 日付が一致しないため、`getUTCMonth()` 等への置換が必要になり波及範囲が広い
- **ローカル時刻コンポーネントで構築（採用）**: タイムゾーン非依存で「暦上の日付」をそのまま扱える

## 関連

- ADR-0004: ドメイン層を `src/domain/` に分離する
- PR #14（CodeRabbit 指摘で発覚）
