-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 어린이집 테이블
CREATE TABLE kindergarten (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  principal_id UUID,
  business_number TEXT,
  location TEXT,
  phone TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 직급 테이블
CREATE TABLE position (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kindergarten_id UUID NOT NULL REFERENCES kindergarten(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 직원 테이블
CREATE TABLE staff (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kindergarten_id UUID NOT NULL REFERENCES kindergarten(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  staff_number TEXT,
  position_id UUID REFERENCES position(id),
  salary INTEGER,
  employment_type TEXT, -- 정규직, 계약직
  status TEXT DEFAULT '재직', -- 재직, 휴직, 퇴사
  hire_date DATE NOT NULL,
  resignation_date DATE,
  leave_date DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 연차기준 테이블
CREATE TABLE leave_standard (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kindergarten_id UUID NOT NULL REFERENCES kindergarten(id) ON DELETE CASCADE,
  position_id UUID REFERENCES position(id),
  years_of_service INTEGER, -- 근속년수
  base_days DECIMAL(3,1) NOT NULL, -- 기본 연차일수 (반차 0.5 포함)
  fiscal_year_basis INTEGER DEFAULT 1, -- 1=1월, 3=3월
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 직원별 연차 테이블
CREATE TABLE staff_leave_balance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  total_days DECIMAL(4,1) NOT NULL, -- 총연차갯수
  used_days DECIMAL(4,1) DEFAULT 0, -- 사용연차갯수
  special_addition DECIMAL(4,1) DEFAULT 0, -- 추가연차
  special_deduction DECIMAL(4,1) DEFAULT 0, -- 공제
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(staff_id, year)
);

-- 연차사용이력 테이블
CREATE TABLE leave_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  leave_type TEXT NOT NULL, -- 종일휴가, 오전반차, 오후반차, 지각, 병가, 경조사, 춤산휴가, 돌봄휴가
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days_used DECIMAL(4,1) NOT NULL,
  reason TEXT,
  created_by UUID REFERENCES staff(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 특별연차 조정이력 테이블
CREATE TABLE special_leave_adjustment (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  adjustment_type TEXT NOT NULL, -- 추가, 감소
  days DECIMAL(4,1) NOT NULL,
  reason TEXT,
  created_by UUID REFERENCES staff(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_staff_kindergarten ON staff(kindergarten_id);
CREATE INDEX idx_staff_position ON staff(position_id);
CREATE INDEX idx_leave_balance_staff ON staff_leave_balance(staff_id);
CREATE INDEX idx_leave_balance_year ON staff_leave_balance(year);
CREATE INDEX idx_leave_history_staff ON leave_history(staff_id);
CREATE INDEX idx_leave_history_year ON leave_history(year);
CREATE INDEX idx_special_adjustment_staff ON special_leave_adjustment(staff_id);
CREATE INDEX idx_position_kindergarten ON position(kindergarten_id);
CREATE INDEX idx_leave_standard_kindergarten ON leave_standard(kindergarten_id);

-- 초기 데이터 (테스트용)
INSERT INTO kindergarten (name, business_number, location, phone)
VALUES ('해맑은 어린이집', '123-45-67890', '서울시 강남구', '02-1234-5678');

-- 직급 초기화
INSERT INTO position (kindergarten_id, name)
SELECT id, '원장' FROM kindergarten WHERE name = '해맑은 어린이집'
UNION ALL
SELECT id, '부원장' FROM kindergarten WHERE name = '해맑은 어린이집'
UNION ALL
SELECT id, '교사' FROM kindergarten WHERE name = '해맑은 어린이집';
