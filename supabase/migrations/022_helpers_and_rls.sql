-- ============================================================
-- 멀티테넌트 전환 (3/4): RLS 헬퍼 함수 + 프로토타입 allow-all 정책 교체
-- ============================================================

-- 호출자의 테넌트(profiles.kindergarten_id). definer 로 profiles RLS 재귀 회피.
create or replace function public.current_tenant()
returns text language sql stable security definer set search_path = public as $$
  select kindergarten_id from public.profiles where id = auth.uid()
$$;

-- 호출자가 총괄관리자인지
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
$$;

-- 테넌트가 사용 가능한 상태(승인+활성+기한 내)인지
create or replace function public.tenant_usable(tid text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.kindergartens k
    where k.id = tid and k.status = 'active' and k.active = true
      and (k.valid_from  is null or k.valid_from  <= current_date)
      and (k.valid_until is null or k.valid_until >= current_date)
  )
$$;

-- ---- 9개 앱 테이블: 프로토타입 allow-all 정책 DROP 후 테넌트 정책 생성 ----
do $$
declare t text;
begin
  foreach t in array array[
    'positions','leave_tiers','staff','leave_balances','leave_adjustments',
    'leave_history','substitute_balances','substitute_usages','app_settings'
  ] loop
    execute format('alter table public.%I enable row level security;', t);

    -- 011/013 에서 만든 기존 정책 제거 (따옴표/비따옴표 두 형태 모두)
    execute format('drop policy if exists %I on public.%I;', t || '_all', t);
    execute format('drop policy if exists "%s" on public.%I;', t || '_all', t);
    execute format('drop policy if exists %I on public.%I;', t || '_sel', t);
    execute format('drop policy if exists %I on public.%I;', t || '_rw', t);

    -- 읽기: 관리자 전체 OR (본인 테넌트 & 사용가능)
    execute format($f$
      create policy %I on public.%I for select to authenticated
      using ( public.is_admin()
              or (kindergarten_id = public.current_tenant()
                  and public.tenant_usable(kindergarten_id)) );
    $f$, t || '_sel', t);

    -- 쓰기: 관리자 OR (본인 테넌트 & 사용가능)
    execute format($f$
      create policy %I on public.%I for all to authenticated
      using ( public.is_admin()
              or (kindergarten_id = public.current_tenant()
                  and public.tenant_usable(kindergarten_id)) )
      with check ( public.is_admin()
              or (kindergarten_id = public.current_tenant()
                  and public.tenant_usable(kindergarten_id)) );
    $f$, t || '_rw', t);
  end loop;
end $$;

-- ---- kindergartens 정책 ----
drop policy if exists kg_sel on public.kindergartens;
drop policy if exists kg_admin_write on public.kindergartens;
drop policy if exists kg_director_insert on public.kindergartens;

-- 원장은 본인 어린이집, 관리자는 전체 조회
create policy kg_sel on public.kindergartens for select to authenticated
  using ( public.is_admin() or id = public.current_tenant() or director_id = auth.uid() );

-- 원장은 본인 명의의 pending 어린이집만 등록(신청) 가능
create policy kg_director_insert on public.kindergartens for insert to authenticated
  with check ( director_id = auth.uid() and status = 'pending' );

-- 상태/사용여부/기한 변경(승인·거절·정지)은 관리자만
create policy kg_admin_write on public.kindergartens for update to authenticated
  using ( public.is_admin() ) with check ( public.is_admin() );

-- ---- profiles 정책 ----
drop policy if exists prof_self_sel on public.profiles;
drop policy if exists prof_self_upd on public.profiles;

create policy prof_self_sel on public.profiles for select to authenticated
  using ( id = auth.uid() or public.is_admin() );

-- 본인 프로필 수정 가능하되 role 은 director 로 고정(권한 상승 방지)
create policy prof_self_upd on public.profiles for update to authenticated
  using ( id = auth.uid() ) with check ( id = auth.uid() and role = 'director' );
