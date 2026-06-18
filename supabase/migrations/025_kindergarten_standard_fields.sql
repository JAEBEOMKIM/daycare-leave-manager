-- ============================================================
-- 어린이집 표준데이터(전국어린이집표준데이터) 필드 저장용 컬럼 추가
-- 출처: data.go.kr 전국어린이집표준데이터 / 어린이집정보공개포털
-- 날짜류는 API 포맷(YYYYMMDD 등) 편차가 있어 text 로 저장(파싱 실패 방지)
-- ============================================================

alter table public.kindergartens
  add column if not exists sido             text,  -- 시도
  add column if not exists sigungu          text,  -- 시군구
  add column if not exists facility_type    text,  -- 어린이집유형구분 (국공립/민간/가정 등)
  add column if not exists operation_status text,  -- 운영현황 (정상/휴지/폐지)
  add column if not exists zipcode          text,  -- 우편번호
  add column if not exists fax              text,  -- 팩스번호
  add column if not exists homepage         text,  -- 홈페이지주소
  add column if not exists capacity         int,   -- 정원수
  add column if not exists current_count    int,   -- 현원수
  add column if not exists classroom_count  int,   -- 보육실수
  add column if not exists classroom_area   numeric, -- 보육실면적
  add column if not exists playground_count int,   -- 놀이터수
  add column if not exists cctv_count       int,   -- CCTV설치수
  add column if not exists staff_count      int,   -- 보육교직원수
  add column if not exists latitude         numeric,
  add column if not exists longitude        numeric,
  add column if not exists commute_vehicle  text,  -- 통학차량운영여부 (Y/N)
  add column if not exists approval_date    text,  -- 인가일자
  add column if not exists rest_start_date  text,  -- 휴지시작일자
  add column if not exists rest_end_date    text,  -- 휴지종료일자
  add column if not exists close_date       text,  -- 폐지일자
  add column if not exists data_std_date    text,  -- 데이터기준일자
  add column if not exists stcode           text;  -- 어린이집코드(외부 식별자, 있으면)
