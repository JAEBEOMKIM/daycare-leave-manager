-- ============================================================
-- 앱 설정 (key-value, jsonb)
-- 대체교사 지정 활성화 여부 / 전체 기준 지원일 등 전역 설정 저장
-- Supabase 대시보드 > SQL Editor 에 붙여넣어 1회 실행하세요.
-- ============================================================

create table if not exists public.app_settings (
  key text primary key,
  value jsonb,
  updated_at timestamptz default now()
);

alter table public.app_settings enable row level security;

drop policy if exists "app_settings_all" on public.app_settings;
create policy "app_settings_all" on public.app_settings
  for all to anon, authenticated
  using (true) with check (true);

-- 기본값 시드 (이미 있으면 유지)
insert into public.app_settings (key, value) values
  ('substitute_enabled', 'true'::jsonb),
  ('substitute_default_days', '15'::jsonb)
on conflict (key) do nothing;
