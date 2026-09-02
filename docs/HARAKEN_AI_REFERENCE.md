# ハラケンAI参照連携（Ver.28）

## 参照窓口

- Supabase RPC: `get_shochu_keep_reference`
- URL: `https://vflxbadvyilfjoypnhtx.supabase.co/rest/v1/rpc/get_shochu_keep_reference`
- HTTPメソッド: `POST`
- 認証: Supabase Authでログインした本人のアクセストークン
- 権限: `authenticated` のみ実行可能。`anon` と未認証アクセスは不可
- 標準取得: `active` かつ残量1%以上のボトルだけ
- 履歴を含める場合: `p_include_finished: true`

RPCはデータを読み取るSQL関数で、追加・変更・削除処理を持ちません。既存テーブルのRLSも有効なまま動作し、ログイン中の `auth.uid()` と一致するデータだけを返します。

## 返却項目

| 項目 | 内容 |
| --- | --- |
| `bottle_id` | ボトルID |
| `store_id` | 店舗ID |
| `store_name` | 店舗名 |
| `brand` | 焼酎の銘柄 |
| `remaining_percent` | 現在の残量（0〜100） |
| `last_visited_on` | 店舗の最新来店日。来店履歴がない場合はボトルの最終来店日、さらにない場合はキープ日 |
| `status` | `active` または `finished` |

## Supabase JavaScriptからの呼び出し

焼酎キープ帖と同じSupabase Authでログイン済みのクライアントを使います。Service Role key、Secret key、データベースパスワードは不要です。

```js
async function getCurrentShochuKeeps(supabaseClient) {
  const { data, error } = await supabaseClient.rpc(
    "get_shochu_keep_reference",
    { p_include_finished: false },
  );

  if (error) throw error;
  return data;
}
```

## RESTからの呼び出し

```js
async function getCurrentShochuKeeps({ supabaseUrl, publishableKey, accessToken }) {
  const response = await fetch(
    `${supabaseUrl}/rest/v1/rpc/get_shochu_keep_reference`,
    {
      method: "POST",
      headers: {
        apikey: publishableKey,
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ p_include_finished: false }),
    },
  );

  if (!response.ok) throw new Error(`参照に失敗しました: ${response.status}`);
  return response.json();
}
```

`publishableKey` は公開用キーですが、`accessToken` はログイン中の本人を表すため、ログやURLへ出さず安全に扱います。

## セキュリティ境界

このRPCは参照専用で、書き込み用パラメータや処理を持ちません。ハラケンAI側にはこのRPCだけを呼ぶ小さな参照モジュールを用意し、`stores`、`bottles`、`store_visits` などの汎用テーブル操作を実装しません。

なお、焼酎キープ帖本体は同じユーザー認証で既存テーブルへ自動保存するため、認証トークン自体には既存RLSの範囲で本人データを書き込める権限があります。Ver.28で保証するのは「追加した参照RPCからは書き込めない」ことです。アプリごとにデータベースレベルで完全に異なる権限を持たせる場合は、将来、ハラケンAI専用バックエンドまたは専用署名トークンを追加します。

## 元に戻す方法

Supabase SQL Editorで次を実行すると、Ver.28の参照窓口だけを削除できます。既存テーブルとデータには触れません。

```sql
drop function if exists public.get_shochu_keep_reference(boolean);
```

画面表示をVer.27.1へ戻す場合は、`index.html` と `service-worker.js` のバージョン表記・キャッシュ番号だけをVer.27.1へ戻します。
