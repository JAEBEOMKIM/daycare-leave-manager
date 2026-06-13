import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calcDaysConsumed } from '@/lib/utils/leave-calc'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    let query = supabase
      .from('leave_requests')
      .select('*, employees(name, position)')
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    const { data: requests, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(requests)
  } catch (error) {
    console.error('GET /api/leave-requests error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { employee_id, facility_id, leave_type, start_date, end_date, reason } = body

    // 소진 일수 계산
    const start = new Date(start_date)
    const end = new Date(end_date)
    const daysBetween = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
    const daysConsumed = calcDaysConsumed(leave_type) * daysBetween

    // 연차 신청 생성
    const { data: leaveRequest, error } = await supabase
      .from('leave_requests')
      .insert([
        {
          employee_id,
          facility_id,
          leave_type,
          start_date,
          end_date,
          days_consumed: daysConsumed,
          reason,
          status: 'pending',
        },
      ])
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(leaveRequest, { status: 201 })
  } catch (error) {
    console.error('POST /api/leave-requests error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
