# TanStack Router 採用（AI ファースト開発において）

AI ファースト開発では AI モデルの学習データが豊富な React Router の方がコード生成精度が高いが、TanStack Router を採用した。理由は TanStack Query との統一されたエコシステムと、ルートパラメータ・クエリパラメータが TypeScript で完全に型付けされる点を優先したため。型安全性により AI が生成するコードの型エラーを抑制できると判断した。

## Considered Options

- **React Router v7（不採用）**: 学習データが豊富で AI 生成コードの精度が高い。型安全性は Zod で部分的に補完可能
- **TanStack Router（採用）**: TanStack Query と同一エコシステム。ファイルベースのルーティングで型が完全に推論される
