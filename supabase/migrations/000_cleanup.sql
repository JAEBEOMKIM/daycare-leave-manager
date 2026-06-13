-- 기존 테이블 및 정책 제거 (초기화)
-- ⚠️ 주의: 이 스크립트는 모든 데이터를 삭제합니다!

-- CASCADE 옵션으로 의존 객체도 함께 삭제
drop table if exists public.facility_settings cascade;
drop table if exists public.leave_requests cascade;
drop table if exists public.leave_records cascade;
drop table if exists public.special_leave_records cascade;
drop table if exists public.annual_leave_balance cascade;
drop table if exists public.employee_annual_leave cascade;
drop table if exists public.leave_standards cascade;
drop table if exists public.employees cascade;
drop table if exists public.facilities cascade;
drop table if exists public.profiles cascade;
drop table if exists public.users cascade;
