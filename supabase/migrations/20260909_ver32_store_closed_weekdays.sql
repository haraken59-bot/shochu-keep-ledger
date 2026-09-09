-- Ver.32: 店舗ごとの基本定休日（0=日曜 ... 6=土曜）
-- 既存行は空配列のまま維持し、未設定として扱う。

alter table public.stores
  add column if not exists closed_weekdays smallint[] not null default '{}'::smallint[];

alter table public.stores
  drop constraint if exists stores_closed_weekdays_valid;

alter table public.stores
  add constraint stores_closed_weekdays_valid
  check (closed_weekdays <@ array[0, 1, 2, 3, 4, 5, 6]::smallint[]);

comment on column public.stores.closed_weekdays is
  '店舗の基本定休日。JavaScript Date#getDay と同じ 0=日曜 ... 6=土曜。空配列は未設定。';
