# 焼酎キープ帖：現在状態の正本

最終確認日：2026-10-11（日本時間）。このファイルは現在状態、過去履歴は `CHANGELOG.md` を参照する。

## Ver.35公開済み：店舗来店日とボトルの分離

- Ver.35公開反映確認済み。公開コミット6c3bd1732dcd2dcafa0a4ebad50aaf6f9029f3ba、Pages run 38051405077 success。未ログイン隔離Edge（390px）でVer.35、ホーム・ログイン・ボトル登録・データ管理表示、JS例外0を確認。Supabase通信は遮断設定かつ発生0件。ナビ本体の公開実体照合は未実施。
- 公開前PWA回帰試験成功：旧キャッシュ更新、localStorage保持、残量/取消、バックアップ往復、オフラインPWA/アイコン/OCR、GPS/定休日。JS例外0・参照切れ0。隔離合成データのみ使用し、実端末同期・実データ更新なし。
- 承認に基づき実DBのget_shochu_keep_navigation_reference / get_shochu_keep_referenceを変更済み。店舗来店日はstore_visitsの最新値のみ、履歴なしはNULL。ボトルlast_visited_at・kept_atへのフォールバックを撤去し、経過日数・並び順もボトル日付に不依存。invoker・既存EXECUTE権限は維持。再現SQLはdocs/ver35-store-visit-rpc.sql。
- 残量RPC update_bottle_remainingは本人の対象ボトルIDのみ更新し、同店舗のstore_visitsを追加。開始日・銘柄は更新しない。修正版アプリと上記2RPCは対象ボトル日付を店舗来店の根拠にしないため、旧日付書込み自体は今回の公開阻害要因としない。書込み廃止は互換性確認を含む残課題。get_hidaka_ai_contextにも当該ボトル日付の参照なし（先行確認）。
- 再汚染リスク：未修正版端末/PWAキャッシュは全ボトル日付コピーと再送を継続できる。修正版公開だけでは旧端末の書込みをサーバーで阻止できない。全端末の修正版反映確認までは同期を再開しない。既存競合は自動採用せず、双方向とも手動反映を保留する。
- 先行作業で2RPCの定義変更のみ実DBへ適用。bottlesとstore_visitsの変更前後の全行ハッシュは一致。今回の公開ではDB操作・実データ復旧・同期なし。
- 実DB上でSELECTのみの合成データ試験2件が成功（docs/ver35-store-visit-rpc-tests.sql）。履歴ありの最新日・履歴なしNULL・同店舗複数ボトルを検証。JS構文検査、test-visit-separation.cjs、test-visit-sync.cjs成功。実ユーザーのナビ画面操作試験とは区別する。
- ナビ本体再確認（10/10）：C:/Users/User/.codex/.chatgpt-projects/g-p-6a9873f4e65081918c0678d3f83d6e3a 配下を特定。outputs/navi-release-20261010 と outputs/navi-static に bottles.last_visited_at / lastVisitedAt の直接参照なし。api.jsは修正済みget_shochu_keep_navigation_referenceを呼び、hidaka-context.jsはRPCのlast_visited_on / days_since_last_visitをNULL維持で取得する。公開実体との今回の照合・実機確認は未実施。
- ナビ側の残課題：hidaka-context.jsの説明文に旧フォールバック由来（ボトル日付・開始日）の説明が残る。実際の日付補完処理ではない。他プロジェクトのため今回は変更せず。work/otp-app-patch内に旧焼酎アプリコピーがあり、再配布・再適用しないこと。
- 公開前再検査：node --check app.js、test-visit-separation.cjs、test-visit-sync.cjsが成功。旧端末が残る間は公開後も同期を再開しない（運用方針でありサーバーによる強制遮断ではない）。

- app.jsのみローカル修正。全ボトルへの来店日コピーを無効化。店舗表示はstoreVisitsのみ、ボトル側旧日付は比較・送信・来店履歴生成に不使用。
- 通常同期・初回クラウド移行のlast_visited_at送信を削除。読込・復元の互換フックは読取のみ。開始日の既存来店移行は維持し、旧lastVisitedAtは移行しない。
- 既存DBのlast_visited_atはnullable（読み取り確認）。テーブル変更不要。既存残量RPCは対象ボトルの日付も更新する既存仕様のままだが、修正版アプリ・修正済み外部RPCはその値を店舗来店の根拠にしない。
- 通信なしの合成データで来店登録・複数/飲み切りボトル不変・ID指定残量・復元・移行・クラウド読取をテスト。実データへの同期・復旧は未実施。全端末の更新確認は利用者確認待ち。
- Ver.35表示、app.js?v=35.0、SW shochu-keep-ledger-v35-visit-separationを公開済み。
対象：このディレクトリのコード、GitHub main、GitHub Pages。アプリの実際の画面タイトルは「焼酎キープ帳」。

**最終検証：** 来店日同期のCHECK制約違反を修正。10/9に修正版の認証済み来店日保存、残量変更/取り消し、Storage画像往復・表示、再読込後の認証維持を確認し公開可能と判断。スマホ実機通信断復帰は未確認。監査は `docs/VER34_AUDIT_20261009.md`、最新検証は `docs/VER34_FINAL_VERIFICATION_20261009.md`。SQLロール模擬試験と実ブラウザ試験を区別する。

## 1. 現在バージョン

| 項目 | 確認結果 |
|---|---|
| 表示 | `Ver. 35`（index.html、公開画面） |
| 内部更新の識別 | app.jsは `v=35.0`、未変更styles.cssは `v=34.0` |
| PWAキャッシュ | `shochu-keep-ledger-v35-visit-separation` |
| manifest参照 | `manifest.webmanifest?v=22`。これを現在のアプリ版番号と解釈しない |
| 公開URL | https://haraken59-bot.github.io/shochu-keep-ledger/ |
| アプリ修正の公開コミット | `6c3bd1732dcd2dcafa0a4ebad50aaf6f9029f3ba` |
| ローカルHEAD / リモートmain | 上記修正＋公開結果の文書記録。文書コミット自身のSHAは自己参照させず `git rev-parse HEAD` / `git ls-remote origin refs/heads/main` で確認 |
| Pages検証 | run `38051405077` success、10/11公開画面Ver.35・主要4画面・JS例外0確認 |

監査修正は公開済み。DBスキーマ・Policy・RPC・Auth・Storage設定変更なし。監査用テスト行・画像の作成/削除あり（後片付け済み）。ZIP・展開ソース・`.codex-remote-attachments/` は公開コミットに含めていない。AGENTS.mdは今回変更していない。

## 2. 現在のアーキテクチャ

- ビルド不要のHTML / CSS / JavaScript。中心は `index.html`、`styles.css`、`app.js`。このプロジェクト直下に package.json はない。
- PWA：`manifest.webmanifest`、`service-worker.js`、`icons/`。GitHub Pagesで静的配信。
- localStorageを基本保存先とし、移行・認証後にSupabaseへ同期する。クラウド同期未設定でも端末内機能を利用する構造。
- 保存対象：ボトル、銘柄別ラベル画像、店舗座標、店舗設定、来店日、残量履歴。同期待ち・移行状態・所有者情報も別キーで保持。
- 主キー群：`shochu-keep-ledger-v1`、`shochu-keep-ledger-label-images-v1`、`shochu-keep-ledger-store-locations-v1`、`shochu-keep-ledger-store-settings-v1`、`shochu-keep-ledger-store-visits-v1`、`shochu-keep-ledger-remaining-history-v1`。
- Supabase JavaScript SDK v2をCDNから利用。設定は `supabase-config.js`。秘密の管理者キーは文書に転記しない。
- 現在の認証UIはメールの認証コード（OTP）送信・確認。既存セッション維持、URLからのセッション検出、パスワード設定・変更フォームも存在する。パスワードログインUIや再設定メール送信機能まで実装済みとは扱わない。
- OCRは同梱Tesseract.js 7.0.0と日本語データをブラウザ内で使用する。
- SWは画面遷移をネット優先・失敗時キャッシュ、manifestもネット優先、他のGETをキャッシュ優先で扱う。同一オリジンのアセットを保存する。初回取得前の完全オフライン起動やクラウド操作は保証しない。

## 3. 使用中のSupabase構成

接続先：`https://vflxbadvyilfjoypnhtx.supabase.co`。以下の項目はコードの取得・保存処理、SQLに基づく一覧で、DBの全カラム一覧ではない。

| テーブル | コード・SQLで使用する主な項目と用途 |
|---|---|
| `stores` | `id`, `user_id`, `name`, `latitude`, `longitude`, `location_updated_at`, `closed_weekdays`。店舗・座標・基本定休日。`area` はナビ参照SQLで利用するが現在の店舗入力・同期には入力処理なし |
| `bottles` | `id`, `user_id`, `legacy_id`, `store_id`, `brand`, `volume_ml`, `current_remaining`, `kept_at`, `last_visited_at`, `status`, `notes`, `last_updated_at`。ボトル本体・移行対応 |
| `store_visits` | `id`, `user_id`, `store_id`, `visited_on`。店舗別来店日 |
| `remaining_updates` | `id`, `user_id`, `bottle_id`, `updated_at`, `previous_remaining`, `new_remaining`, `image_path`, `notes`。変更履歴・取り消し判断 |
| `brand_labels` | `id`, `user_id`, `brand`, `image_path`。銘柄と画像パスの対応 |

### RPC

| 名前 | 用途・読み書き | 認証と利用状態 |
|---|---|---|
| `get_shochu_keep_reference` | 参照専用、7項目のAI向けボトル情報 | 現行DBは invoker・本人限定・authenticatedのみ。アプリ本体から呼出なし。DBロール模擬試験成功 |
| `get_shochu_keep_navigation_reference` | 参照専用、店舗位置・定休日を含む14項目 | 現行DBは上記と同じ。外部利用向け。DBロール模擬試験成功 |
| `update_bottle_remaining` | 残量・状態・最終来店・更新日時、変更履歴、来店日を更新 | 現行定義確認済み。invoker・authenticatedのみ・本人行をロック。通常同期に使用 |
| `undo_latest_bottle_remaining` | 逆向き履歴を記録、残量・状態・更新日時を更新。来店日は変更しない | 現行定義確認済み。invoker・authenticatedのみ・本人/最新/整合性/0%/二重取消を検査。DBロール模擬試験成功 |

### RLS・Storageの確認範囲

- 5テーブルすべてRLS有効。各 `<table>_owner_access` はauthenticatedへのALL、USING/WITH CHECKとも `auth.uid() = user_id`。SELECT/INSERT/UPDATE/DELETEを本人に制限。10/8のROLLBACK試験で別ユーザーSELECT/UPDATE/DELETEを拒否。
- 4RPCはinvoker、PUBLIC/anonにEXECUTEなし、authenticatedにEXECUTEあり。10/7の未認証Data API拒否に加え10/8現行ACL確認。模擬JWTクレームでのDB試験は実トークンHTTP試験とは区別する。
- `brand-labels` はprivate、5MiB、JPEG/PNG/WebP。`brand_labels_storage_select/insert/update/delete` はauthenticatedのみ、bucket一致かつパス先頭がauth.uid()。storage.objects/bucketsのRLS有効。
- アプリはユーザーID/ランダムUUIDのパスへuploadし、image_pathを認証付きdownloadしてdata URL化する。signed/public URLは使用しない。10/9に認証済み画像Storage往復・再表示成功。
- AuthはEmail有効、匿名ログイン無効。メールテンプレートはToken（8桁、3600秒）、コードverifyOtp方式。プロジェクトのsignup有効とは別に、アプリはshouldCreateUser:false。認証済みPCでログイン・再読込維持・クラウド読込を確認。
- authenticatedにCRUD以外のTRUNCATE/REFERENCES/TRIGGER付与も確認。通常Data API経由の実行経路は確認しておらず最小権限化は別途検討。共有DBの他アプリ関数にもAdvisor警告あり、今回変更せず。
- migrationsにはVer.28 / 32 / 33 / 34の追加SQLがある。初期の全テーブル・RLS・通常残量更新RPCを再構築できる完全な基底スキーマは確認できていない。

## 4. 現在実装済み機能

以下は現行コード上の実装。実機・本番動作確認済みという意味ではない。主な実装ファイルは `app.js`、画面は `index.html`、装飾は `styles.css`。

| 画面・分野 | 実装内容 |
|---|---|
| ホーム・店舗 | 店舗別グループ表示、キープがなくても店舗を残す、店名から履歴を開く、全体のキープ中本数、最終来店からの経過表示 |
| 店舗入力・設定 | 登録済み店名選択と新規入力、基本定休日の曜日指定、店名を残した「休」マーク、位置登録 |
| GPS | 現在地取得、登録済み店舗の距離計算、近隣候補表示・選択。1km内・最大5件の候補。近い順ソート |
| ボトル | 新規・過去キープ登録、編集・削除、メモ、銘柄選択、新規銘柄入力、同一店舗・銘柄の回数と前回キープ情報、日付順の番号付け |
| 残量・クイック画面 | スライダー、±10%操作、保存、飲み切り、飲み切りから同店舗で次の銘柄入力へ。残量変更時の来店日登録 |
| 残量履歴 | ボトル別、新しい順、最新10件表示、変更前後・日時。条件を満たす直前通常変更の確認付き取り消し |
| 取り消しの制約 | 0%・飲み切り・古い変更・再取り消し・残量不一致・競合中を除外。クラウド利用中のオフライン取り消しを制限。履歴を消さず逆変更を残し、来店日は維持 |
| 来店履歴 | 店舗別月間カレンダー、キープ日の区別、日付追加・削除、追加確認、同店舗同日の重複防止、過去キープ日の反映処理 |
| 写真・ラベル | カメラ指定の画像選択、銘柄への紐付け、表示・拡大、旧画像と新画像の比較・差し替え。端末保存とStorage同期 |
| OCR | 写真の文字認識、既存銘柄との文字列近似照合、最大3候補、選択または手入力。画像比較画面はあるが画像特徴による自動照合とは異なる |
| 並び替え | 最終来店が古い順、現在地に近い順、残量が少ない順、新しいキープ順 |
| データ保護 | JSONバックアップ、確認付き復元、旧形式への対応、初回クラウド移行、クラウド読込 |
| 同期 | 自動送信・同期待ち・再試行、利用者切替の扱い、クラウド更新検知、安全条件付き自動読込、競合時の送信停止、変更前後の比較表示 |
| PWA | インストール設定、オフライン用キャッシュ、版表示、正式アイコンとmaskable / Apple / favicon設定 |
| 外部参照 | Ver.28 / 34参照SQL・利用資料。アプリの通常操作から外部ナビを呼ぶ機能ではない |

容量データは保持するが通常登録で容量入力を要求する構成ではない。基本定休日は営業時間・臨時休業を含めた営業判定ではない。

## 5. 現在のハラケンナビ連携状態

保存SQL：`supabase/migrations/20260922_ver34_haraken_navigation_reference.sql`。

`get_shochu_keep_navigation_reference(p_include_finished boolean default false)` は以下の14項目を返す定義：

`bottle_id`, `store_id`, `store_name`, `area`, `latitude`, `longitude`, `closed_weekdays`, `is_basic_closed_today`, `brand`, `remaining_percent`, `kept_at`, `last_visited_on`, `days_since_last_visit`, `status`。

- 店舗とボトルをIDおよび所有者で結合し、`auth.uid()` の本人分だけを返す。
- 標準取得は `active` かつ残量 > 0。`p_include_finished=true` は過去状態も含める。ボトル起点なので、標準取得でボトルのない店舗一覧は返さない。
- 最終来店日は店舗ごとの `max(store_visits.visited_on)`、なければボトルの `last_visited_at`、さらに `kept_at` の順。
- 本日・曜日・経過日数は日本時間基準。定休日配列は日曜0～土曜6。空なら基本定休日判定はfalse。
- 呼出先は `/rest/v1/rpc/get_shochu_keep_navigation_reference`。Supabase SDKの `rpc`、またはPOSTにJSONパラメータ、publishable keyと本人の認証Bearerを使用する。管理者キーを渡さない。
- 焼酎キープ帖側にはSQLと利用資料があり、10/8–9に現行DBのauthenticatedロール/本人クレーム模擬試験成功。外部ナビ本体から実JWTでの取得・判断連携は未確認。
- ハラケンナビ本体のリポジトリ・稼働コードは今回調べていない。実際の取得・判断ロジックへの組み込み状態は**わからない**。「未実装」と断定しない。
- 公開クライアントキー＋通常の本人セッションは既存アプリの書込権限も持ち得る。参照RPC自体がSELECT専用であることと、外部アプリが保有する認証情報全体が読取専用であることは別。外部へのセッション受渡し設計は別途確認が必要。

## 6. 現在のテスト状態

### 最新実行（2026-10-08〜09）

- 最終検証：PCテスト用既存アカウントで修正版へOTPログイン。来店日source=importの実保存、残量変更・取り消し・履歴、画像upload/DB記録/download/32px画像表示、再読み込みの認証維持、クラウド自動反映成功。検証画像/店舗/ボトル/付随履歴は承認後に削除し元の4店舗/4ボトル/13来店/24履歴/0ラベルへ復旧。
- 自動回帰にGPS計算、OCR候補、基本定休日、オフラインOCRを追加してPASS。スマホの実通信断復帰は未確認。

- `scripts/test-visit-sync.cjs`：実関数を隔離実行、許可source・既存日/重複日の除外PASS。実DBでもsource=importの本人INSERTを確認してROLLBACK。
- 実DBロール模擬試験30/30 PASS（5テーブル本人分離・4RPC・取り消し拒否等）。全ROLLBACK、試験用SQL行残存なし。
- 初期監査の旧公開版では新規テストボトル後に不正sourceで同期停止。上記最終検証で修正版の認証済み同期成功を確認し公開済み（初期監査の未確認事項を解消）。
- 監査用クラウド店舗/ボトル削除済み。画像はStorage保存前に停止し対象アカウントのオブジェクト0件を確認。利用者承認後にPCをクラウドへ戻し、4店舗/4ボトル/13来店/24残量履歴/0ラベルを画面確認。
- 10/9に下記の既存自動回帰を再実行してPASS。初回sandbox内Edge起動は失敗、承認された通常実行で成功。

### 自動回帰と公開確認（公開照合は2026-10-07）

- `node --check app.js` / `node --check service-worker.js`：成功。
- `scripts/test-icons.cjs`：PASS。アイコン参照7件、192/512サイズ、キャッシュ更新、localStorage維持、ローカル残量変更・取り消し、バックアップ変換往復、オフラインPWA・アイコン、pageerror / 参照切れ0件。
- この試験は独立したEdgeテスト環境・外部通信代替を使用する。Supabase本番の認証済み同期を試したものではない。
- 公開URLを独立した未ログインのheadless Edgeで表示：HTTP 200、タイトル「焼酎キープ帳」、Ver.34、pageerror 0件。
- 公開主要13ファイル：すべてHTTP 200、ローカル一致（テキスト改行差は正規化）。

### 過去資料（今回の再試験ではない）

- `docs/VER31_TEST_REPORT.md`、`docs/VER32_TEST_REPORT.md`：OCR・GPS候補・クイック画面・写真・定休日等の試験と実機未確認事項。
- `docs/VER33_TEST_REPORT.md`（2026-09-21）：残量履歴・取り消し・DB・本人分離等の試験。認証済み実機の通信断復帰、2端末等は未確認と記載。
- `docs/VER34_TEST_REPORT.md`（2026-09-22）：ナビ参照RPC・返却・本人分離等のDB試験記録。
- `docs/ICON_UPDATE_20261006.md`：アイコン変更の検証記録。

### 今回未確認

スマホ実機のGPS・カメラ・OCR精度、インストール済みホーム画面アイコン更新、実トークンによる別ユーザーStorageアクセス試験、2実端末競合・認証済み通信断復帰、ナビ本体利用。過去会話だけでは現在の試験済みにしない。

## 7. 現在の公開状態

GitHub Pagesへ10/9修正版公開済み。URL・アプリ修正コミット・Pages実行番号は第1章。公開後index.html/app.js/service-worker.jsがHTTP 200かつローカルと一致。認証済み公開ブラウザでVer.34とapp.js?v=34.0-audit1を確認、JS errorログ0件。既存4ボトル維持。
初期監査での旧HTML混在疑い・不正source同期エラーは過去記録として監査文書に残す。現在の修正版検証結果とは区別する。公開結果を記録する後続文書コミットはアプリ実行ファイルを変更しない。

## 8. 未実装・保留項目

### このリポジトリで実装を確認できない機能

- 店舗専用の名前変更・統合管理画面。
- 店名・銘柄の一覧検索、店舗別消費分析画面（既存の回数・本数表示とは別）。
- 祝日・臨時休業・営業時間を含めた高度な営業判定。
- 写真の切り抜きUI、過去ラベル画像の履歴閲覧UI、画像特徴での自動類似検索。
- エリアの入力・同期UI（参照SQLにはareaがある）。
- 競合する各項目を任意に選択してマージするUI（比較表示とは別）。

### 未確認・保留（未実装とは別）

- 外部参照RPCの実HTTP利用・ナビ本体連携確認（DBロール試験は成功）。
- 2実端末の競合と通信断復帰、スマホの各権限・アイコン更新。
- ハラケンナビ本体の利用状態・認証情報の権限境界。
- 初期DBスキーマを含めた再構築資料の充足確認。

## 9. 今後作業時の注意

- 作業開始時は本書を読み、必要箇所だけ現行コード・DB・公開版と再照合する。差異があれば実状態を優先し本書を修正する。
- 既存データ、RLS、localStorage、同期、オフライン、既存RPC互換性を壊さない。管理者キーやDBパスワードをブラウザ・公開GitHub・文書へ置かない。
- 追加料金0円方針。不要な機能追加・大規模リファクタリングはしない。公開はユーザーの依頼範囲に従う。
- 完了時は本書を更新し、変更履歴はCHANGELOGへ。公開時は版番号・公開内容対応コミット・検証範囲を記録する。未確認項目を安易に消さない。
- READMEとアプリ内の古いメールリンク案内をOTPへ修正・公開済み。
- 根拠は現行コード、migrations、上記テスト資料、Git履歴、今回HTTP/ブラウザ/API試験。保存SQLだけを根拠に現行DB適用済み・RLS安全確認済みとは書かない。

## アイコン余白調整・公開済み
- 正式原画像の外周余白を整理し、通常用は絵柄を約94%、maskable用は半径39.5%以内へ配置。デザイン・manifest・機能は変更なし。192/512 PNGとSWキャッシュ版を公開済み。公開コミット bd95b70、Pages run 37943166979 success。公開アイコンのローカル一致・HTTP 200、秘密パス404を確認。Androidホーム画面の更新は未確認。


