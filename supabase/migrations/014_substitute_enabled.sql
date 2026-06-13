-- ============================================================
-- 대체교사 지원 사용 여부를 직원별로 관리하기 위한 컬럼 추가
-- (substitute_balances.enabled: 기본 true = 사용 가능)
-- Supabase 대시보드 > SQL Editor 에 붙여넣어 1회 실행하세요.
-- ============================================================

alter table public.substitute_balances
  add column if not exists enabled boolean not null default true;
