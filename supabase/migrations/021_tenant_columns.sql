-- ============================================================
-- 멀티테넌트 전환 (2/4): 앱 테이블에 kindergarten_id 추가 + 기존 데이터 backfill
-- ============================================================

-- positions, staff 는 이미 kindergarten_id 컬럼 존재 → 나머지에 추가
alter table public.leave_tiers          add column if not exists kindergarten_id text;
alter table public.leave_balances       add column if not exists kindergarten_id text;
alter table public.leave_adjustments    add column if not exists kindergarten_id text;
alter table public.leave_history        add column if not exists kindergarten_id text;
alter table public.substitute_balances  add column if not exists kindergarten_id text;
alter table public.substitute_usages    add column if not exists kindergarten_id text;
alter table public.app_settings         add column if not exists kindergarten_id text;

-- 기존 단일 어린이집을 첫 실테넌트(kg-001)로 시드
insert into public.kindergartens (id, name, status, active, valid_from)
values ('kg-001', '기본 어린이집', 'active', true, current_date)
on conflict (id) do nothing;

-- 기존 모든 앱 데이터를 kg-001 로 backfill (idempotent)
update public.positions          set kindergarten_id = 'kg-001' where kindergarten_id is null;
update public.staff              set kindergarten_id = 'kg-001' where kindergarten_id is null;
update public.leave_tiers         set kindergarten_id = 'kg-001' where kindergarten_id is null;
update public.leave_balances      set kindergarten_id = 'kg-001' where kindergarten_id is null;
update public.leave_adjustments   set kindergarten_id = 'kg-001' where kindergarten_id is null;
update public.leave_history       set kindergarten_id = 'kg-001' where kindergarten_id is null;
update public.substitute_balances set kindergarten_id = 'kg-001' where kindergarten_id is null;
update public.substitute_usages   set kindergarten_id = 'kg-001' where kindergarten_id is null;
update public.app_settings        set kindergarten_id = 'kg-001' where kindergarten_id is null;

-- app_settings: 전역 싱글톤(PK=key) → 테넌트별 (PK = kindergarten_id, key)
alter table public.app_settings drop constraint if exists app_settings_pkey;
alter table public.app_settings add primary key (kindergarten_id, key);

-- leave_tiers: 전역 id(PK) → 테넌트별 (PK = kindergarten_id, id)
-- (테넌트마다 'tier-0' 등 동일 id 사용 가능하도록 복합키)
alter table public.leave_tiers drop constraint if exists leave_tiers_pkey;
alter table public.leave_tiers add primary key (kindergarten_id, id);

-- backfill 후 NOT NULL
alter table public.positions          alter column kindergarten_id set not null;
alter table public.staff             alter column kindergarten_id set not null;
alter table public.leave_tiers         alter column kindergarten_id set not null;
alter table public.leave_balances      alter column kindergarten_id set not null;
alter table public.leave_adjustments   alter column kindergarten_id set not null;
alter table public.leave_history       alter column kindergarten_id set not null;
alter table public.substitute_balances alter column kindergarten_id set not null;
alter table public.substitute_usages   alter column kindergarten_id set not null;

-- RLS 조건(kindergarten_id = current_tenant()) 성능용 인덱스
create index if not exists positions_tenant_idx          on public.positions(kindergarten_id);
create index if not exists staff_tenant_idx              on public.staff(kindergarten_id);
create index if not exists leave_tiers_tenant_idx        on public.leave_tiers(kindergarten_id);
create index if not exists leave_balances_tenant_idx     on public.leave_balances(kindergarten_id);
create index if not exists leave_adjustments_tenant_idx  on public.leave_adjustments(kindergarten_id);
create index if not exists leave_history_tenant_idx      on public.leave_history(kindergarten_id);
create index if not exists sub_balances_tenant_idx       on public.substitute_balances(kindergarten_id);
create index if not exists sub_usages_tenant_idx         on public.substitute_usages(kindergarten_id);
