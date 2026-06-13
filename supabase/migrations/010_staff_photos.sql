-- 직원 사진 저장용 Storage 버킷 + 매핑 테이블 + RLS
-- Supabase 대시보드 > SQL Editor에 붙여넣어 1회 실행하세요.
-- (anon 키로는 버킷/테이블 생성이 불가하여 SQL Editor에서 실행해야 합니다)

-- 1) Storage 버킷 (public read)
insert into storage.buckets (id, name, public)
values ('staff-photos', 'staff-photos', true)
on conflict (id) do nothing;

-- 2) Storage RLS 정책 (staff-photos 버킷에 대해 익명 업로드/조회 허용)
drop policy if exists "staff_photos_read" on storage.objects;
create policy "staff_photos_read"
  on storage.objects for select
  using (bucket_id = 'staff-photos');

drop policy if exists "staff_photos_insert" on storage.objects;
create policy "staff_photos_insert"
  on storage.objects for insert
  with check (bucket_id = 'staff-photos');

drop policy if exists "staff_photos_update" on storage.objects;
create policy "staff_photos_update"
  on storage.objects for update
  using (bucket_id = 'staff-photos')
  with check (bucket_id = 'staff-photos');

-- 3) 직원 사진 매핑 테이블 (직원키 -> 사진 URL)
create table if not exists public.staff_photos (
  staff_key  text primary key,
  photo_url  text not null,
  updated_at timestamptz not null default now()
);

alter table public.staff_photos enable row level security;

-- 익명 클라이언트(anon)에서 조회/등록/수정 허용 (프로토타입 기준)
drop policy if exists "staff_photos_all" on public.staff_photos;
create policy "staff_photos_all"
  on public.staff_photos for all
  using (true)
  with check (true);
