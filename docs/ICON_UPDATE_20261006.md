# 正式アイコン変更（2026-10-06）

添付の `02_shochu_keep.png` を改変せず `icons/source-20261006.png` として保存。729×729 RGBA、元ファイルとのSHA-256一致を確認。

## 生成物と設定

- 通常PNG: 16、32、48、192、512px。縦横比・透過を維持。
- ICO: 16、32、48pxを同梱。
- Apple touch icon: 180px。不透明な既存背景色 `#fcfaf6`。
- Maskable: 192、512px。同背景色で安全円（中心半径40%）内に全描画を収める。画像全体を縮小し、切り抜きなし。
- manifest: 通常アイコンとmaskableを分離。アプリ名、start_url、表示方式、テーマ色、manifest URLは維持。
- index.html: favicon、Apple用参照を更新。画面本体と表示バージョンは変更なし。
- Service Worker: 新キャッシュ名と画像ファイル名で更新。manifestはオンライン時に最新取得、通信不可なら保存済みを使用。
- 旧 `icon.svg` は旧クライアントの参照切れ防止用に残す。現在のmanifest・HTML・事前キャッシュからは参照しない。

## 確認結果

既存の自動テストスイート／package.jsonは見つからなかったため、関連回帰を `scripts/test-icons.cjs` に追加。インストール済みのPlaywrightとEdgeを使用し、依存関係は追加していない。

- 旧リリース `bb02ba1` からのService Worker更新、旧キャッシュから新manifest・新画像への切替: 成功。
- 7つの使用アイコン参照のHTTP 200、manifest記載4画像の寸法・種別: 成功。
- 元画像一致、通常PNGの透過、ICO内3サイズ、maskable安全領域: 成功。
- localStorage維持、残量20→30%と履歴、取り消し30→20%、バックアップ生成・読込変換: 成功。
- PWAと全使用アイコンのオフライン読込: 成功。
- JavaScript構文、ブラウザpageerror 0、参照先404なし、差分空白検査: 成功。
- 旧workerから新workerへの切替完了を待たず読む試験条件を修正し、最終試験は成功。

試験は隔離ブラウザ・ローカル配信のみ。Supabaseなど外部サービスへの通信はテスト中遮断。`app.js`、CSS、Supabase設定・DB・登録済みデータは変更していない。

## 実機確認と公開

公開前テストは成功。利用者の公開指示によりGitHub Pagesへ反映する。公開先の画像・manifest・Service Workerの配信確認結果は作業完了時に報告する。

公開後はAndroidの既存インストールと新規インストール、iPhoneホーム画面、ブラウザタブ、円形／角丸マスク、オフライン再起動を確認する。OSによるインストール済みアイコン更新は即時・一律ではなく、自動切替の時期は保証できない。iPhoneではホーム画面アイコンの追加し直しが必要な場合がある。サイトデータ・保存履歴の削除はしない。

`scripts/generate-icons.py` は開発用の既存Pillowで再生成可能。アプリ実行時の依存関係は増えていない。
