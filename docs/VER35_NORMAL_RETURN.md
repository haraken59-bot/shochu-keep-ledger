# Ver.35 通常版復帰候補（未公開）

## 現在の公開候補：第1段階

- 先行候補6e09c73を未公開のまま維持し、自動同期だけを停止する最小フラグを追加。
- 表示Ver.35.1、JS35.1-stage1、SW shochu-keep-ledger-v35-normal-35.1-stage1。
- AUTOMATIC_CLOUD_SYNC_ENABLED=falseでscheduleCloudSyncを予約前に終了。起動/認証復元/画面復帰/通信復帰/ローカル変更から自動同期しない。
- 直接の手動復元・移行・取り消し等は既存仕様のまま。実機は表示確認のみとし、これらの操作は行わない。
- ローカル単体、来店分離/送信、隔離Edgeのイベント/タイマー停止・キャッシュ更新・回帰成功。DB操作なし。
- 第2段階は実機更新確認後にこの自動予約停止だけ解除（配信識別も更新）する別作業。以下は先行通常版候補の説明。

## 差分

- 表示Ver.35、配信識別35.1、SW shochu-keep-ledger-v35-normal-35.1。
- 起動時停止ラッチ、1回許可、再許可、診断UI、基準更新UI/一時移行処理、Auth後の検証UI再判定を撤去。
- 既存の通常競合確認inspectCloudUpdatesと通常自動同期/再試行/クラウド自動読込を再び使用する。検証中の「実質差0・未送信0だけ許可」は通常のユーザー編集を保存できないため検証処理とともに撤去。
- syncCloudSnapshot/ensureCloudStores/syncCloudBottles/syncCloudVisits/syncPendingCloudLabels、およびcloudRevision/cloudComparable/localComparableはc2f0116と一致を自動テスト。成功時の戻り値syncedを維持。
- bottles.last_visited_at/last_updated_at/updated_atはrevisionに含めない。店舗来店日はstore_visitsのみ。RPC/DBスキーマ/実データに変更なし。
- localStorageの旧試験記録とbaselineMigrationは削除しない。通常版の同期停止条件には使わない。保全データは既存レコードのspread保存で保持される。

## 検証

- node --check app.js
- node scripts/test-normal-sync.cjs：通常の複数回同期、予約、オフライン停止、競合時の書込み抑止、クラウド側変更の読込分岐、失敗後再試行、日付除外・実質値検知、成功経路主要関数同一。
- node scripts/test-visit-separation.cjs / test-visit-sync.cjs：実来店日分離と送信値。
- scripts/test-icons.cjs：隔離Edge/外部通信遮断、旧ラッチ保持とテストUI消失、PWAキャッシュ更新/オフライン、残量取消、バックアップ、GPS、定休日、OCR、参照切れ0/JS例外0。
- 全てローカル・合成通信。実DB同期・実端末の通常版動作は未確認。実機sync-test 5.1成功は利用者申告（この段階の新JSONは未受領）。
- 検証専用scripts/test-single-sync*、test-post-baseline-sync、test-baseline-migration、test-v35-baseline-proposalは旧検証版用資料として残す。撤去済み関数を前提にしているため通常版の回帰スイートには含めない。再現時は該当公開コミットのソースで実行する。

## 公開前の注意

まだ公開しない。承認後に公開すると通常の自動同期が再開する。今回既存の認証済みローカルブラウザは開いていない。公開版はsync-test 5.1のまま。
