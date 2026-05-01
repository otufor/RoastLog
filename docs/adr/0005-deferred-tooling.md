# Knip と vite-plugin-pwa は段階的に導入する

テストハーネス整備時に検討したが、現時点では導入しない。導入タイミングを明示する。

## Knip（デッドコード検出）

**導入タイミング**: Repository 層・hooks 層の実装がひと通り揃った後。  
コードが少ない段階では検出対象がなく、効果が薄い。

```bash
npm install -D knip
npx knip
```

## vite-plugin-pwa（PWA 化）

**導入タイミング**: v1 の全画面が完成し、動作確認が済んだ後。  
理由: MSW が Service Worker を使っており、PWA の Service Worker と競合するリスクがある。  
動作が安定した状態で追加しないと、テスト環境と本番環境の Service Worker 設定が混乱する。

```bash
npm install -D vite-plugin-pwa
```

## 見送ったもの

**Storybook**: チームが1人で画面数が少ない v1 には不要。story ファイルの維持コストが恩恵を上回る。チームが増えるか、デザインシステムが必要になった段階で再検討する。
