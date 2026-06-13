# 어린이집 연차관리시스템 - 설정 가이드

## 1️⃣ Supabase 데이터베이스 설정

### 1-1. SQL 스크립트 실행 (순서 중요!)

Supabase 콘솔 → SQL Editor에서 **순서대로** 실행:

```sql
-- 1. 001_create_base_tables.sql
-- 2. 002_add_foreign_keys.sql  
-- 3. 003_indexes_and_rls.sql
```

⚠️ **순서를 지켜야 Foreign Key 순환 참조 에러가 발생하지 않습니다!**

### 1-2. Service Role Key 설정

1. Supabase 콘솔 → **Settings** → **API**
2. **Service Role Key** 복사
3. `.env.local`의 `SUPABASE_SERVICE_ROLE_KEY` 업데이트

```bash
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs... # 복사한 키
```

---

## 2️⃣ 소셜 로그인 설정

### 2-1. 카카오 OAuth

1. [카카오 개발자 센터](https://developers.kakao.com) 접속
2. 앱 생성 → REST API Key 복사
3. 리다이렉트 URI 설정:
   ```
   http://localhost:3000/api/auth/kakao/callback
   ```
4. `.env.local` 업데이트:
   ```bash
   NEXT_PUBLIC_KAKAO_CLIENT_ID=your-client-id
   KAKAO_CLIENT_SECRET=your-client-secret
   ```

### 2-2. 네이버 OAuth

1. [네이버 개발자 센터](https://developers.naver.com) 접속
2. 애플리케이션 생성 → Client ID, Secret 복사
3. 콜백 URI 설정:
   ```
   http://localhost:3000/api/auth/naver/callback
   ```
4. `.env.local` 업데이트:
   ```bash
   NEXT_PUBLIC_NAVER_CLIENT_ID=your-client-id
   NAVER_CLIENT_SECRET=your-client-secret
   ```

---

## 3️⃣ 개발 서버 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

접속: http://localhost:3000

---

## 4️⃣ 테스트 데이터 추가

### 원장 계정 생성 (Supabase 콘솔)

```sql
-- 1. Users 테이블에 원장 사용자 추가
insert into public.users (id, email, display_name, role)
select 
  auth.uid(),
  'director@example.com',
  '김지영',
  'director'
where auth.uid() is not null;

-- 2. Facilities 테이블에 어린이집 추가
insert into public.facilities (id, name, address, director_id, contact_email, contact_phone)
values (
  gen_random_uuid(),
  '하늘어린이집',
  '서울시 강남구',
  (select id from public.users where email = 'director@example.com'),
  'director@example.com',
  '02-123-4567'
);

-- 3. Users 테이블에 facility_id 업데이트
update public.users
set facility_id = (select id from public.facilities where name = '하늘어린이집')
where email = 'director@example.com';
```

---

## 5️⃣ 주요 API 엔드포인트

| 기능 | 메서드 | 경로 |
|------|--------|------|
| 직원 목록 | GET | `/api/employees` |
| 직원 추가 | POST | `/api/employees` |
| 직원 수정 | PUT | `/api/employees/[id]` |
| 직원 삭제 | DELETE | `/api/employees/[id]` |
| 연차 신청 | POST | `/api/leave-requests` |
| 연차 신청 목록 | GET | `/api/leave-requests` |
| 연차 승인 | POST | `/api/leave-requests/[id]/approve` |
| 연차 거절 | POST | `/api/leave-requests/[id]/reject` |
| 설정 조회 | GET | `/api/settings` |
| 설정 저장 | PUT | `/api/settings` |

---

## 6️⃣ 데이터베이스 스키마

### 주요 테이블

- **users**: 사용자 (원장, 직원)
- **facilities**: 어린이집
- **employees**: 직원 정보
- **annual_leave_balance**: 연차 잔액 (연차별)
- **leave_requests**: 연차 신청 기록
- **leave_standards**: 연차 정책 기준
- **facility_settings**: 시설별 설정

---

## 🆘 트러블슈팅

### "Column 'facility_id' does not exist" 에러
→ SQL 스크립트를 **순서대로** 실행했는지 확인

### 로그인 실패
→ 카카오/네이버 OAuth credentials 확인
→ 리다이렉트 URI가 정확한지 확인

### API 401 Unauthorized
→ 사용자가 로그인되어 있는지 확인
→ Supabase RLS 정책 확인

---

## 📚 참고 자료

- [Supabase 공식 문서](https://supabase.com/docs)
- [Next.js 공식 문서](https://nextjs.org/docs)
- [카카오 OAuth 문서](https://developers.kakao.com/docs/latest/ko/kakaologin/rest-api)
- [네이버 OAuth 문서](https://developers.naver.com/docs/login/overview)
