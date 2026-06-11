-- 어린이집 설정 (단일 행)
CREATE TABLE IF NOT EXISTS center_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    director_name TEXT,
    business_number TEXT,
    address TEXT,
    phone TEXT,
    fiscal_year_start_month INTEGER DEFAULT 1,
    school_year_start_month INTEGER DEFAULT 3,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 직급
CREATE TABLE IF NOT EXISTS job_titles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    order_index INTEGER NOT NULL DEFAULT 0,
    can_manage_leave BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 직원
CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    employee_number TEXT,
    job_title_id UUID REFERENCES job_titles(id) ON DELETE SET NULL,
    monthly_salary NUMERIC,
    employment_type TEXT DEFAULT 'regular', -- regular, contract, part-time
    status TEXT DEFAULT 'active', -- active, inactive, leave, resigned
    hire_date DATE,
    resign_date DATE,
    leave_start_date DATE,
    memo TEXT,
    is_vacation_trigger_target BOOLEAN DEFAULT FALSE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 연차 기준 (근속연수별)
CREATE TABLE IF NOT EXISTS leave_standards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    months_service_from INTEGER NOT NULL,
    months_service_to INTEGER,
    annual_days NUMERIC NOT NULL,
    basis_type TEXT NOT NULL, -- 'fiscal', 'school', 'both'
    effective_from_year INTEGER NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 직원별 연차 집계 (연도별)
CREATE TABLE IF NOT EXISTS employee_annual_leave (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    basis_type TEXT NOT NULL, -- 'fiscal', 'school'
    base_days NUMERIC DEFAULT 0,
    additional_days NUMERIC DEFAULT 0,
    used_days NUMERIC DEFAULT 0,
    deducted_days NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(employee_id, year, basis_type)
);

-- 연차 사용 이력
CREATE TABLE IF NOT EXISTS leave_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    basis_type TEXT NOT NULL, -- 'fiscal', 'school'
    leave_type TEXT NOT NULL, -- 연차, 오전반차, 오후반차, 지각, 병가, 경조사, 출산휴가, 돌봄휴가
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days_consumed NUMERIC NOT NULL DEFAULT 1.0,
    reason TEXT,
    registered_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 특별 연차 이력 (원장/부원장 추가·차감)
CREATE TABLE IF NOT EXISTS special_leave_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    basis_type TEXT NOT NULL,
    days_delta NUMERIC NOT NULL,
    reason TEXT NOT NULL,
    registered_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 사용자 프로필
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    role TEXT DEFAULT 'staff', -- director, vice_director, staff
    employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_employees_job_title_id ON employees(job_title_id);
CREATE INDEX IF NOT EXISTS idx_employees_user_id ON employees(user_id);
CREATE INDEX IF NOT EXISTS idx_employee_annual_leave_employee_id ON employee_annual_leave(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_records_employee_id ON leave_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_records_start_date ON leave_records(start_date);
CREATE INDEX IF NOT EXISTS idx_special_leave_records_employee_id ON special_leave_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_profiles_employee_id ON profiles(employee_id);

-- RLS 정책
ALTER TABLE center_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_titles ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_standards ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_annual_leave ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE special_leave_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- center_config RLS (인증된 사용자는 읽기 가능)
CREATE POLICY "center_config_select_authenticated" ON center_config
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "center_config_update_authenticated" ON center_config
    FOR UPDATE USING (auth.role() = 'authenticated');

-- job_titles RLS
CREATE POLICY "job_titles_select_authenticated" ON job_titles
    FOR SELECT USING (auth.role() = 'authenticated');

-- employees RLS
CREATE POLICY "employees_select_authenticated" ON employees
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "employees_insert_authenticated" ON employees
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "employees_update_authenticated" ON employees
    FOR UPDATE USING (auth.role() = 'authenticated');

-- leave_standards RLS
CREATE POLICY "leave_standards_select_authenticated" ON leave_standards
    FOR SELECT USING (auth.role() = 'authenticated');

-- employee_annual_leave RLS
CREATE POLICY "employee_annual_leave_select_authenticated" ON employee_annual_leave
    FOR SELECT USING (auth.role() = 'authenticated');

-- leave_records RLS
CREATE POLICY "leave_records_select_authenticated" ON leave_records
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "leave_records_insert_authenticated" ON leave_records
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "leave_records_update_authenticated" ON leave_records
    FOR UPDATE USING (auth.role() = 'authenticated');

-- special_leave_records RLS
CREATE POLICY "special_leave_records_select_authenticated" ON special_leave_records
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "special_leave_records_insert_authenticated" ON special_leave_records
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- profiles RLS
CREATE POLICY "profiles_select_authenticated" ON profiles
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "profiles_insert_authenticated" ON profiles
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "profiles_update_self" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- 기본 직급 데이터 (초기 데이터)
INSERT INTO job_titles (name, order_index, can_manage_leave) VALUES
    ('원장', 1, TRUE),
    ('부원장', 2, TRUE),
    ('교사', 3, FALSE),
    ('보조교사', 4, FALSE)
ON CONFLICT DO NOTHING;

-- 기본 연차 기준 (근속 0개월~2년, 2년~5년, 5년 이상)
INSERT INTO leave_standards (months_service_from, months_service_to, annual_days, basis_type, effective_from_year) VALUES
    (0, 24, 11, 'fiscal', 2026),          -- 0개월 ~ 2년: 11일
    (24, 60, 15, 'fiscal', 2026),         -- 2년 ~ 5년: 15일
    (60, NULL, 20, 'fiscal', 2026)        -- 5년 이상: 20일
ON CONFLICT DO NOTHING;
