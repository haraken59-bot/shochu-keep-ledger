# ハラケンナビ参照連携（Ver.34）

焼酎キープ帳へログインしている本人の店舗・ボトル情報を、参照専用RPCから取得します。Ver.28の `get_shochu_keep_reference` とVer.33の `undo_latest_bottle_remaining` は変更していません。

## RPC

- 関数名: `get_shochu_keep_navigation_reference`
- HTTP: `POST /rest/v1/rpc/get_shochu_keep_navigation_reference`
- 引数: `p_include_finished`（boolean、省略時 `false`）
- 認証: Supabase Authのログインで得た利用者本人のアクセストークン
- 追加料金: なし（既存のSupabase Data APIと無料枠を利用）

標準取得では `status = active` かつ `remaining_percent > 0` の現在キープ中だけを返します。`p_include_finished: true` では飲み切りを含む本人のボトル履歴も返します。

## 返却項目

| 項目 | 型 | 内容 |
| --- | --- | --- |
| `bottle_id` | UUID | ボトルID |
| `store_id` | UUID | 店舗ID |
| `store_name` | text | 店名 |
| `area` | text / null | エリア |
| `latitude` | number / null | 店舗緯度 |
| `longitude` | number / null | 店舗経度 |
| `closed_weekdays` | number[] | 基本定休日。日曜0〜土曜6 |
| `is_basic_closed_today` | boolean | 日本時間の今日が基本定休日か |
| `brand` | text | 焼酎銘柄 |
| `remaining_percent` | number | 現在残量（0〜100%） |
| `kept_at` | date | キープ日 |
| `last_visited_on` | date / null | 店舗の最終来店日 |
| `days_since_last_visit` | number / null | 日本時間の今日から最終来店日までの経過日数 |
| `status` | text | `active`、`finished` などの状態 |

`last_visited_on` は、同じ店舗の `store_visits.visited_on` の最新日を最優先し、履歴がなければ `bottles.last_visited_at`、さらに `bottles.kept_at` の順で補います。3項目すべてがない場合だけ `null` です。

## JavaScript（Supabase SDK）

アプリのログインセッションで初期化済みの `supabaseClient` を使います。Secret keyやService Role keyは使用しません。

```js
const { data, error } = await supabaseClient.rpc(
  "get_shochu_keep_navigation_reference",
  { p_include_finished: false },
);

if (error) throw error;
console.log(data);
```

飲み切りを含める場合だけ、引数を `true` にします。

```js
const { data, error } = await supabaseClient.rpc(
  "get_shochu_keep_navigation_reference",
  { p_include_finished: true },
);
```

## REST呼び出し例

`SUPABASE_URL`、公開用Publishable key、現在ログイン中の利用者のアクセストークンは、実行時に安全な設定やログインセッションから渡してください。

```js
const response = await fetch(
  `${SUPABASE_URL}/rest/v1/rpc/get_shochu_keep_navigation_reference`,
  {
    method: "POST",
    headers: {
      apikey: SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ p_include_finished: false }),
  },
);

if (!response.ok) {
  throw new Error(`焼酎キープ情報を取得できませんでした (${response.status})`);
}

const bottles = await response.json();
```

返却例（現在キープ中）:

```json
[
  {
    "bottle_id": "00000000-0000-0000-0000-000000000000",
    "store_id": "00000000-0000-0000-0000-000000000000",
    "store_name": "友志",
    "area": "藤崎",
    "latitude": 35.000001,
    "longitude": 139.000001,
    "closed_weekdays": [1],
    "is_basic_closed_today": false,
    "brand": "麗月",
    "remaining_percent": 50,
    "kept_at": "2026-09-01",
    "last_visited_on": "2026-09-20",
    "days_since_last_visit": 2,
    "status": "active"
  }
]
```

`p_include_finished: true` では、例えば次の履歴も同じ配列に含まれます。

```json
{
  "brand": "黒霧島",
  "remaining_percent": 0,
  "status": "finished"
}
```

## 認証・エラー処理

- 未ログイン、期限切れトークン: Data APIは通常401または403を返します。再ログインまたはセッション更新後に再試行してください。
- 通信エラー: ハラケンナビ側で「取得できませんでした」と表示し、焼酎キープ帳のローカルデータを書き換えないでください。
- 別利用者: `auth.uid()` と各テーブルの `user_id` の両方で絞り込み、既存RLSも適用されるため取得できません。
- 参照専用: このRPCは `SELECT` だけで構成し、`anon` と `public` の実行権限を外しています。ハラケンナビ側でも、このRPC以外の更新処理を実装しないでください。

アクセストークンは本人の通常権限を持つため、ログやGitHub、URLへ保存しないでください。Service Role key、Secret key、データベースパスワードはブラウザ側へ置かないでください。

## Supabase変更

`supabase/migrations/20260922_ver34_haraken_navigation_reference.sql` がRPCの追加、権限の制限、説明コメントを行います。テーブル、RLSポリシー、Storage、既存RPCは変更しません。
