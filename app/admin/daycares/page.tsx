import { createClient } from '@/lib/supabase/server'
import {
  approveDaycare,
  rejectDaycare,
  suspendDaycare,
  reactivateDaycare,
  setValidUntil,
} from './actions'

export const dynamic = 'force-dynamic'

interface Kg {
  id: string
  name: string
  business_no: string | null
  phone: string | null
  address: string | null
  director_id: string | null
  status: string
  active: boolean
  valid_from: string | null
  valid_until: string | null
  rejected_reason: string | null
  created_at: string
}

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-warning-amber/15 text-warning-amber',
  active: 'bg-success-green/10 text-success-green',
  rejected: 'bg-error-red/10 text-error-red',
  suspended: 'bg-surface-container-high text-on-surface-variant',
}
const STATUS_LABEL: Record<string, string> = {
  pending: '승인대기',
  active: '사용중',
  rejected: '거절됨',
  suspended: '중지됨',
}

export default async function AdminDaycaresPage() {
  // 관리자는 is_admin() RLS 로 전체 조회 가능 → 서비스 롤 불필요
  const admin = await createClient()
  const { data: kgs } = await admin
    .from('kindergartens')
    .select('*')
    .order('created_at', { ascending: false })
  const { data: profiles } = await admin.from('profiles').select('id, email')
  const emailById = new Map((profiles ?? []).map((p) => [p.id as string, p.email as string]))

  const list = (kgs ?? []) as Kg[]
  const counts = list.reduce(
    (acc, k) => ((acc[k.status] = (acc[k.status] ?? 0) + 1), acc),
    {} as Record<string, number>
  )

  const cell = 'px-4 py-3 text-body-md text-on-surface align-top'
  const th = 'px-4 py-3 text-label-md font-bold text-on-surface text-left'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-headline-md font-bold text-on-surface">어린이집 관리</h1>
        <p className="mt-1 text-body-md text-on-surface-variant">
          전체 {list.length}곳 · 승인대기 {counts['pending'] ?? 0} · 사용중 {counts['active'] ?? 0} · 중지 {counts['suspended'] ?? 0} · 거절 {counts['rejected'] ?? 0}
        </p>
      </div>

      <div className="bg-surface-white rounded-2xl border border-outline-variant shadow-sm overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-surface-container-low border-b border-outline-variant">
              <th className={th}>어린이집</th>
              <th className={th}>원장</th>
              <th className={th}>상태</th>
              <th className={th}>사용기한</th>
              <th className={th}>관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant">
            {list.map((k) => (
              <tr key={k.id} className="hover:bg-surface-container-low/40">
                <td className={cell}>
                  <p className="font-semibold">{k.name}</p>
                  <p className="text-label-sm text-on-surface-variant">{k.business_no ?? '-'} · {k.phone ?? '-'}</p>
                  <p className="text-label-sm text-on-surface-variant">{k.address ?? ''}</p>
                </td>
                <td className={cell}>
                  <p>{k.director_id ? emailById.get(k.director_id) ?? '-' : '-'}</p>
                  <p className="text-label-sm text-on-surface-variant">{k.created_at.slice(0, 10)} 신청</p>
                </td>
                <td className={cell}>
                  <span className={`px-2.5 py-1 rounded-full text-label-sm font-bold ${STATUS_BADGE[k.status] ?? ''}`}>
                    {STATUS_LABEL[k.status] ?? k.status}
                  </span>
                  {k.status === 'rejected' && k.rejected_reason ? (
                    <p className="mt-1 text-label-sm text-error-red">{k.rejected_reason}</p>
                  ) : null}
                </td>
                <td className={cell}>
                  <form action={setValidUntil} className="flex items-center gap-1">
                    <input type="hidden" name="id" value={k.id} />
                    <input type="date" name="valid_until" defaultValue={k.valid_until ?? ''} className="rounded border border-outline-variant px-2 py-1 text-label-sm" />
                    <button className="text-label-sm text-primary hover:underline">저장</button>
                  </form>
                </td>
                <td className={cell}>
                  <div className="flex flex-col gap-2 min-w-[220px]">
                    {k.status === 'pending' ? (
                      <>
                        <form action={approveDaycare} className="flex items-center gap-1">
                          <input type="hidden" name="id" value={k.id} />
                          <input type="date" name="valid_until" className="rounded border border-outline-variant px-2 py-1 text-label-sm" title="사용기한(선택)" />
                          <button className="px-3 py-1 rounded-lg bg-success-green text-white text-label-sm font-semibold">승인</button>
                        </form>
                        <form action={rejectDaycare} className="flex items-center gap-1">
                          <input type="hidden" name="id" value={k.id} />
                          <input name="reason" placeholder="거절 사유" className="flex-1 rounded border border-outline-variant px-2 py-1 text-label-sm" />
                          <button className="px-3 py-1 rounded-lg bg-error-red text-white text-label-sm font-semibold">거절</button>
                        </form>
                      </>
                    ) : null}
                    {k.status === 'active' ? (
                      <form action={suspendDaycare}>
                        <input type="hidden" name="id" value={k.id} />
                        <button className="px-3 py-1 rounded-lg border border-outline-variant text-on-surface text-label-sm font-semibold hover:bg-surface-container">사용 중지</button>
                      </form>
                    ) : null}
                    {k.status === 'suspended' || k.status === 'rejected' ? (
                      <form action={reactivateDaycare}>
                        <input type="hidden" name="id" value={k.id} />
                        <button className="px-3 py-1 rounded-lg bg-primary text-on-primary text-label-sm font-semibold">사용 재개</button>
                      </form>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
            {list.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-on-surface-variant">등록된 어린이집이 없습니다.</td></tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  )
}
