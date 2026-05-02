# マスターデータも Dexie（IndexedDB）に集約する

RoastLevel・FlavorTag・RoastDevice の 3 種マスターデータを localStorage ではなく Dexie（IndexedDB）に保存する。永続化先を IndexedDB 一本に統一する。

## なぜか

当初の `requirements.md` Rev 2.0 では「IndexedDB（ログ・豆データ）/ localStorage（設定・マスター）」と分担を分けていた。Slice 2（マスターデータ管理）の実装着手時に以下を再評価した。

- **Tauri 移行時の SQLite 一本化**: ADR-0001 で Tauri v2 への移行を見据え、`repositories/` で永続化を抽象化している。永続化先が IndexedDB と localStorage の 2 系統だと、Tauri 移行時にそれぞれ別経路で SQLite に寄せる必要があり、移行コストが増える。
- **テスト基盤の共通化**: ブラウザテストは「本物の IndexedDB を使う」方針で確立済み（`src/test/setup-browser.ts`）。localStorage 用に別のテスト基盤を導入する利得がない。
- **レイヤルールの統一**: `BaseRepository<T>` は Dexie の `Table` 前提。localStorage 用に並行実装を増やすとレイヤパターンが分岐する。
- **件数・性能の懸念なし**: マスターデータは 3 テーブル合計でも数十件規模。IndexedDB のオーバーヘッドは無視できる。

## 適用範囲

- `src/db/index.ts` に `roastLevels` / `flavorTags` / `roastDevices` テーブルを追加（Dexie schema version 2）
- 各リポジトリは `BaseRepository<T>` を継承
- 初回起動時のプリセットシード（RoastLevel 7 段階・FlavorTag 10 種・RoastDevice「weroast HOME ROASTER」）も Dexie トランザクション内で行う

## Considered Options

- **マスターは localStorage（不採用）**: requirements Rev 2.0 の元方針。Tauri 移行時に経路が 2 つに分岐する
- **マスターも IndexedDB（採用）**: 永続化先を 1 本化、`BaseRepository<T>` を流用、Tauri 移行も `repositories/` 差し替え 1 経路で済む

## シード失敗時の動作

`seedMasterData` はアプリ起動の前提条件ではなく補助処理として扱う。IndexedDB が利用不可（iOS プライベートブラウズ・ストレージクォータ超過）の環境でも UI は起動しなければならない。

```ts
// NG: reject → .then が実行されず画面が無応答になる
seedMasterData(db).then(renderApp);

// NG: .catch が renderApp の例外も捕捉し二重呼び出しになる
seedMasterData(db).then(renderApp).catch(() => renderApp());

// OK: .catch → .then の順で renderApp は必ず一度だけ呼ばれる
seedMasterData(db)
  .catch((err) => { console.error("seedMasterData failed:", err); })
  .then(renderApp);
```

同様のシード処理を追加するときは同じパターンに従うこと。

## 関連

- ADR-0001: TanStack Query + Repository パターン
- `docs/requirements.md` Rev 2.1（本 ADR と同時に更新）
- Issue #3 / Slice 2: マスターデータ管理
