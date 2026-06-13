'use client'

import { createClient } from './client'

const BUCKET = 'staff-photos'
const TABLE = 'staff_photos'

// 브라우저 클라이언트는 1회만 생성
let _client: ReturnType<typeof createClient> | null = null
function client() {
  if (!_client) _client = createClient()
  return _client
}

function extOf(file: File): string {
  const m = /\.([a-zA-Z0-9]+)$/.exec(file.name)
  if (m) return m[1].toLowerCase()
  if (file.type === 'image/png') return 'png'
  if (file.type === 'image/webp') return 'webp'
  return 'jpg'
}

/**
 * 이미지를 Supabase Storage(staff-photos 버킷)에 업로드하고 public URL을 반환한다.
 * 버킷 미설정 등 실패 시 에러를 throw → 호출부에서 폴백 처리.
 */
export async function uploadStaffPhoto(file: File): Promise<string> {
  const path = `uploads/${crypto.randomUUID()}.${extOf(file)}`
  const { error } = await client()
    .storage.from(BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type })
  if (error) throw error
  const { data } = client().storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}

/** staff_photos 테이블에 (직원키 → 사진 URL) 매핑을 upsert */
export async function saveStaffPhoto(staffKey: string, photoUrl: string): Promise<void> {
  const { error } = await client()
    .from(TABLE)
    .upsert({ staff_key: staffKey, photo_url: photoUrl, updated_at: new Date().toISOString() }, { onConflict: 'staff_key' })
  if (error) throw error
}

/** 저장된 모든 직원 사진을 { staff_key: photo_url } 맵으로 조회 */
export async function fetchStaffPhotos(): Promise<Record<string, string>> {
  const { data, error } = await client().from(TABLE).select('staff_key, photo_url')
  if (error) throw error
  const map: Record<string, string> = {}
  for (const row of data ?? []) {
    if (row.staff_key && row.photo_url) map[row.staff_key] = row.photo_url
  }
  return map
}
