# 어린이집 연차관리시스템 - 요구사항 명세서

## 1. 시스템 개요
어린이집 원장이 소속 선생님들의 연차 일정 및 소진 이력을 관리하는 시스템

## 2. 연차 정보
- **대체 연차**: 11개 (회계연도로 나라에서 지급)
- **연차 기준**: 회계연도(1월) & 학년연도(3월)
- **연차 종류**: 
  - 종일휴가
  - 오전반차 / 오후반차
  - 지각, 병가, 경조사, 춤산휴가, 돌봄휴가

## 3. 주요 기능

### 3.1 연차 관리
- 원장/부원장은 특별연차 추가/감소 가능
- 사유 등록 및 히스토리 관리
- 회계연도/학년연도 두 가지 기준 지원

### 3.2 화면별 기능

#### 1) 메인화면
- 이번주 연차사용 주달력 (팝업으로 상세 내역)
- "더이상보지않기" 기능
- 월달력 (해당월 연차 현황)
- 월별 연차사용 요약 내역
- 이전달/다음달, 특정연도/월 선택

#### 2) 통계 화면
- 원의 토탈 사용 휴가현황 (사용횟수/총횟수)
- 선생님별 휴가 사용/총갯수 그래프
- 월별 휴가 사용량
- 휴가 종류별 사용횟수

#### 3) 개인별 연차사용
- 개인정보 (이름, 직급, 근무기간, 입사일 등)
- 연도별 연차현황
- 사용내역 (상세목록)
- 지표: 발생연차, 총연차, 추가연차, 사용연차, 공제, 미사용

#### 4) 직원 관리
- 직원 등록/수정/삭제
- 연차 부여/차감 (원장/부원장만)

#### 5) 연차 기준 설정
- 직급별 연차 기준
- 급여연수별 연차 기준
- 회계일기준/입사일기준 선택

#### 6) 연차 등록
- 직원 지정
- 연차 유형/사유 등록
- 연차소진 갯수 및 남은 갯수 표시

## 4. 데이터베이스 스키마

### 4.1 테이블 설계

#### kindergarten (어린이집)
- id: UUID
- name: 어린이집명
- principal_id: 원장 ID (직원 ID 참조)
- business_number: 사업자번호
- location: 위치
- phone: 전화번호
- created_at, updated_at

#### staff (직원)
- id: UUID
- kindergarten_id: 어린이집 ID
- name: 이름
- staff_number: 직번
- position_id: 직급 ID
- salary: 월급
- employment_type: 고용형태 (정규직, 계약직)
- status: 재직상태 (재직, 휴직, 퇴사)
- hire_date: 입사일
- resignation_date: 퇴사일
- leave_date: 휴직일
- notes: 비고
- created_at, updated_at

#### position (직급)
- id: UUID
- kindergarten_id: 어린이집 ID
- name: 직급명 (원장, 부원장, 교사 등)
- created_at, updated_at

#### leave_standard (연차기준)
- id: UUID
- kindergarten_id: 어린이집 ID
- position_id: 직급 ID
- years_of_service: 근속년수
- base_days: 기본 연차일수
- fiscal_year_basis: 회계일 기준 (1월/3월)
- created_at, updated_at

#### staff_leave_balance (직원별연차)
- id: UUID
- staff_id: 직원 ID
- year: 연도
- total_days: 총연차갯수
- used_days: 사용연차갯수
- special_addition: 추가연차 (원장/부원장이 추가한 수치)
- special_deduction: 공제연차
- created_at, updated_at

#### leave_history (연차사용이력)
- id: UUID
- staff_id: 직원 ID
- year: 연도
- leave_type: 연차유형 (종일휴가, 오전반차, 오후반차 등)
- start_date: 시작일자
- end_date: 종료일자
- days_used: 소진일수
- reason: 사유
- created_by: 등록자 (원장/부원장 ID)
- created_at

#### special_leave_adjustment (특별연차 조정 이력)
- id: UUID
- staff_id: 직원 ID
- year: 연도
- adjustment_type: 조정유형 (추가/감소)
- days: 일수
- reason: 사유
- created_by: 등록자 (원장/부원장 ID)
- created_at

## 5. 기술 스택
- Frontend: React + Next.js 16
- Database: Supabase (PostgreSQL)
- Deployment: Vercel
- Version Control: GitHub (jboom825@gmail.com)

## 6. 주요 구현 고려사항
- 회계연도/학년연도 자동 변환 로직
- 반차 계산 (0.5일 처리)
- 연차 소진 계산 및 잔여 연차 표시
- 권한 관리 (원장/부원장 vs 일반 직원)
- 데이터 히스토리 관리
- 통계 데이터 집계 최적화
