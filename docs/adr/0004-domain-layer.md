# ドメイン層を src/domain/ に分離する

ビジネスルールをフレームワーク依存ゼロの純粋な関数・型として `src/domain/` に集約する。

対象となるロジックの例:
- `WeightLossRate` の計算（`(1 − after / before) × 100`）
- `Cleanliness` の警告判定（値 ≤ 2 で警告）
- `DiffSummary` の生成（同一 Bean の直前 RoastLog との差分）
- `Stock` デクリメント量の算出

`src/domain/` 内はフレームワーク・IndexedDB・TanStack Query のいずれにも依存しない。`repositories/` や `hooks/` から `domain/` を呼び出す方向のみ許可し、逆方向の依存は禁止。

## Considered Options

- **domain 層なし（不採用）**: 3層（repositories / hooks / UI）で割り切る。シンプルだがビジネスロジックが hooks に散在し、テストが書きにくくなる
- **src/domain/ を設ける（採用）**: ビジネスルールが一か所に集まり、純粋関数として単体テストが書ける。Tauri 移行時も domain 層は無変更のまま残せる
