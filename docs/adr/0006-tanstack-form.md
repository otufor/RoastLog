# TanStack Form 採用（@tanstack/zod-form-adapter 不使用）

フォーム管理に TanStack Form を採用した。React Hook Form も候補だったが、TanStack Query・Router との統一エコシステムと完全な型推論を優先した（ADR-0003 と同じ判断基準）。

## Zod v4 との統合

`@tanstack/zod-form-adapter` は Zod v3 専用のため使用しない。TanStack Form v1 は Standard Schema（https://standard-schema.dev/）を自動検出する仕組みを持っており、Zod v4 はこれを実装している。そのため `validatorAdapter` の指定なしにスキーマを直接 `validators` に渡せる。

```ts
const form = useForm({
  defaultValues: { name: "" },
  validators: { onSubmit: BeanSchema },  // アダプター不要
  onSubmit: ({ value }) => { ... },
});
```

## 全フォームへの適用義務

`src/components/` 内のすべてのフォームコンポーネントは TanStack Form + `validators: { onSubmit: Schema }` を使用しなければならない。

**理由**: リポジトリ層は書き込み時にバリデーションを行わない（ADR-0001「内部書き込みには TypeScript 型のみで十分」）。したがって、フォームレベルの Zod バリデーションが IndexedDB への不正データ流入を防ぐ唯一の防壁になる。`useState` + ネイティブ form で実装した場合、空文字や不正な hex カラーがそのまま保存され、次回 `repo.findAll()` の `Schema.parse()` で例外が発生する。

## 注意点

browser mode の Vitest テストでは `vi` はグローバルに注入されない。`import { vi } from "vitest"` を明示的に書く必要がある。
