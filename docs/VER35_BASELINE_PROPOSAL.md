# Ver.35 比較基準仕様案（未適用）

2026-10-11。アプリ・DB・保存基準・公開版は変更しない。

## cloudRevision: v35-r2

- stores: id, name, latitude, longitude, location_updated_at, closed_weekdays（既存維持）。
- bottles: id, legacy_id, store_id, brand, volume_ml, current_remaining, kept_at, status, notes。
- store_visits: id, store_id, visited_on。
- brand_labels: id, brand, image_path。
- bottles.last_visited_at / last_updated_at / updated_at / created_at は対象外。現行コードはlast_visited_atを既に除外しているがlast_updated_atが残っている。
- 配列を既存順序で正規化しJSON文字列化。容量は既存互換でNumber(value)||900（NULLと900の違いを検出しない既存制約）。定休日も既存正規化を使用。

## cloudComparable: v35-c2

- stores: 店名、緯度、経度、位置更新日時、基本定休日。
- bottles: legacy_id、店名、銘柄、容量、残量、開始日、状態、メモ。lastVisitedAtは含めない。
- visits: 店名、実来店日。labels: 銘柄一覧。
- ラベル画像パスはrevisionで検出。画像バイナリの同一パス上書きはこの仕様だけでは検出できない。既存画像同期処理は別途保護する。
- remaining_updatesは両基準の対象外（現行維持）。変更履歴は別途最新読取りして保護。エリア等、既存比較対象外の列を全項目競合検知済みと扱わない。

## 安全な移行案（今回は実行しない）

1. 停止ガードを維持。元の基準文字列と取得時端末比較値を読取り専用で保全。
2. 本人の現在クラウドを読み取り。認証一致、未送信キュー0、同期中なしを確認。
3. 旧配列の長さ・各項目の位置を旧コード/実基準で特定。既知形式だけ変換し、不明・欠損・重複ID・対応不明は停止。単純な末尾削除を未知形式へ適用しない。
4. 旧基準から許可したボトル来店日/ボトル更新日時だけを除外。現在クラウド値で旧基準を埋めない。新規項目が旧基準にない場合は自動一致扱いにしない。
5. 変換済み旧revisionと新revision、変換済み旧comparableと新comparable、端末comparableとクラウドcomparableをすべて照合。実質差が1つでもあれば停止し項目別表示。
6. 差分0の確認と利用者承認後に限り、将来の別作業で基準のみを保存。バージョン識別と元基準バックアップを残す。保存直前にクラウド/端末/基準が変化していないことを再確認。保存失敗は停止維持。自動同期は再開しない。

現仕様のリビジョン不一致だけでinspectCloudUpdatesは書込み前停止する。更新日時を除いても実質値変更は検出する。ただし変更後に元の値へ戻った操作（ABA）や、読取後の他クライアント書込みを防ぐ原子的制御ではない。

## テスト結果

scripts/test-v35-baseline-proposal.cjs を既存提出JSONのafterに対して実行、PASS。
56本へ旧来店日列を付けた再現基準は変換後一致。ボトル来店日/更新日時だけの変更は差分なし。ID・店舗・銘柄・容量・残量・開始日・状態・メモ・店舗名・来店日・ラベルパス・削除など16変異は差分検出。入力不変、外部通信なし。

実機sync-test 4 JSON（2026-10-11 18:33 JST）受領後の検証：旧コード5aa1939で列位置確認。revisionは11列のindex7/index10を除外、comparableは9列のindex6を除外（末尾削除ではない）。56本すべて新仕様クラウド記録/端末比較値と一致。店舗3・実来店73・ラベル3も一致。旧revision差は13本の来店日2026-10-07→2026-10-09とlast_updated_atだけ、26項目。実質差0。入力ファイル不変、DB通信なし。更新日時変更の因果関係は断定しない。クラウド記録は13:28 JST取得分のため、実保存前には最新再照合が必要。
