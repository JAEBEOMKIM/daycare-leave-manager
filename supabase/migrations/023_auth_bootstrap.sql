-- ============================================================
-- 멀티테넌트 전환 (4/4): 회원가입 시 profiles 자동 생성 트리거
-- (Supabase 에선 ALTER DATABASE ... SET 권한이 없어 GUC 대신 테이블 사용)
-- ============================================================

-- 총괄관리자 이메일 허용목록 테이블
create table if not exists public.admin_allowlist (
  email text primary key
);
alter table public.admin_allowlist enable row level security;

-- 관리자만 조회 가능(트리거는 security definer 라 RLS 무관하게 읽음)
drop policy if exists admin_allowlist_sel on public.admin_allowlist;
create policy admin_allowlist_sel on public.admin_allowlist for select to authenticated
  using ( public.is_admin() );

-- ★ 실제 관리자 이메일을 등록하세요(소문자). 앱의 ADMIN_EMAILS 환경변수와 동일하게.
insert into public.admin_allowlist (email) values
  ('jboom825@gmail.com')
on conflict (email) do nothing;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  is_adm boolean;
begin
  is_adm := exists (
    select 1 from public.admin_allowlist
    where lower(email) = lower(coalesce(new.email, ''))
  );

  insert into public.profiles (id, email, role, status)
  values (
    new.id,
    new.email,
    case when is_adm then 'admin'  else 'director' end,
    case when is_adm then 'active' else 'pending'  end
  )
  on conflict (id) do nothing;

  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 이미 가입한 관리자가 있다면 1회 backfill:
-- update public.profiles set role='admin', status='active'
-- where lower(email) in (select lower(email) from public.admin_allowlist);
