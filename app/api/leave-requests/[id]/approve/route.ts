import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 승인 권한 확인 (원장만 가능)
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userData?.role !== 'director') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: leaveRequest, error } = await supabase
      .from('leave_requests')
      .update({
        status: 'approved',
        approved_by: user.id,
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // 연차 잔액 업데이트
    const { data: employee } = await supabase
      .from('leave_requests')
      .select('employee_id, days_consumed')
      .eq('id', params.id)
      .single()

    if (employee) {
      const leaveYear = new Date().getFullYear()
      const { data: balance } = await supabase
        .from('annual_leave_balance')
        .select('*')
        .eq('employee_id', employee.employee_id)
        .eq('leave_year', leaveYear)
        .single()

      if (balance) {
        await supabase
          .from('annual_leave_balance')
          .update({
            used_days: (balance.used_days || 0) + employee.days_consumed,
            updated_at: new Date().toISOString(),
          })
          .eq('id', balance.id)
      }
    }

    return NextResponse.json(leaveRequest)
  } catch (error) {
    console.error('POST /api/leave-requests/[id]/approve error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
