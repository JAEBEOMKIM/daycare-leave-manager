-- ============================================================
-- 멀티테넌트 (보강): 로그인 시 admin_allowlist 기반 자동 승격
-- allowlist 에 있는 이메일이 로그인하면 profiles.role 을 admin 으로 동기화.
-- (트리거는 신규 가입 시점에만 동작하므로, 기존 계정·타이밍 문제를 해결)
-- ============================================================

create or replace function public.sync_my_role()
returns text language plpgsql security definer set search_path = public as $$
declare
  em text;
  is_adm boolean;
begin
  select email into em from auth.users where id = auth.uid();
  if em is null then
    return null;
  end if;

  is_adm := exists (
    select 1 from public.admin_allowlist where lower(email) = lower(em)
  );

  if is_adm then
    insert into public.profiles (id, email, role, status)
    values (auth.uid(), em, 'admin', 'active')
    on conflict (id) do update set role = 'admin', status = 'active', updated_at = now();
    return 'admin';
  end if;

  -- 관리자가 아니면 프로필만 보장(없으면 director/pending 생성)
  insert into public.profiles (id, email, role, status)
  values (auth.uid(), em, 'director', 'pending')
  on conflict (id) do nothing;
  return 'director';
end $$;

grant execute on function public.sync_my_role() to authenticated;
