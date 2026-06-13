-- 대체교사 배치(날짜별 일정) — Supabase SQL Editor에서 1회 실행
create table if not exists public.substitute_deployments (
  id text primary key,
  covered_staff_id text not null,
  date date not null,
  substitute_name text,
  note text,
  created_at timestamptz default now()
);

alter table public.substitute_deployments enable row level security;
drop policy if exists substitute_deployments_all on public.substitute_deployments;
create policy substitute_deployments_all
  on public.substitute_deployments for all
  using (true) with check (true);

-- 시드 (이미 staff가 시드되어 앱 자동 시드가 재실행되지 않으므로 직접 삽입)
insert into public.substitute_deployments (id, covered_staff_id, date, substitute_name) values
  ('sub-dep-001','staff-002','2026-06-01','박지원'),
  ('sub-dep-002','staff-002','2026-06-02','박지원'),
  ('sub-dep-003','staff-003','2026-06-05','최은영'),
  ('sub-dep-004','staff-002','2026-06-10','박지원'),
  ('sub-dep-005','staff-002','2026-06-11','박지원'),
  ('sub-dep-006','staff-002','2026-06-12','박지원')
on conflict (id) do nothing;

-- (선택) facilities RLS 무한재귀 수정 + 시설명 헤더 표시용
do $$
declare p record;
begin
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='facilities') then
    for p in select policyname from pg_policies where schemaname='public' and tablename='facilities' loop
      execute format('drop policy if exists %I on public.facilities', p.policyname);
    end loop;
    execute 'create policy facilities_all on public.facilities for all using (true) with check (true)';
  end if;
end $$;
