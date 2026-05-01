# TanStack Query + Repository パターン（useLiveQuery 不採用）

Dexie.js を使う場合の定石は `useLiveQuery` による IndexedDB のリアクティブ購読だが、v2 で Tauri 移行した際に `useLiveQuery` は使えなくなる（IndexedDB 専用の仕組みのため）。将来の差し替えコストを最小化するため、データアクセスを `repositories/` 層に集約し、TanStack Query 経由で非同期取得する構成を採用した。Tauri 移行時は `repositories/` の実装を `invoke()` ベースに差し替えるだけで `hooks/` 以上のレイヤーは無変更となる。

## Considered Options

- **useLiveQuery（不採用）**: PWA v1 には最適だが Tauri では使えず、移行時に hooks 層の全面書き直しが必要になる
- **TanStack Query + Repository（採用）**: PWA では `useLiveQuery` より若干冗長だが、Tauri 移行時のリプレース範囲を Repository 層に限定できる
