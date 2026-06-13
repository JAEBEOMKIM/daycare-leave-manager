import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 사용자의 시설 조회
    const { data: userData } = await supabase
      .from('users')
      .select('facility_id')
      .eq('id', user.id)
      .single()

    if (!userData?.facility_id) {
      return NextResponse.json({ error: 'No facility found' }, { status: 404 })
    }

    // 시설의 직원 목록 조회
    const { data: employees, error } = await supabase
      .from('employees')
      .select('*')
      .eq('facility_id', userData.facility_id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(employees)
  } catch (error) {
    console.error('GET /api/employees error:', error)
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
    const { name, position, email, phone, hire_date, base_days } = body

    // 사용자의 시설 조회
    const { data: userData } = await supabase
      .from('users')
      .select('facility_id')
      .eq('id', user.id)
      .single()

    if (!userData?.facility_id) {
      return NextResponse.json({ error: 'No facility found' }, { status: 404 })
    }

    // 직원 생성
    const { data: employee, error } = await supabase
      .from('employees')
      .insert([
        {
          facility_id: userData.facility_id,
          name,
          position,
          email,
          phone,
          hire_date,
        },
      ])
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // 연차 기본 설정 생성
    const leaveYear = new Date().getFullYear()
    await supabase
      .from('annual_leave_balance')
      .insert([
        {
          employee_id: employee.id,
          leave_year: leaveYear,
          base_days: base_days || 15,
        },
      ])

    return NextResponse.json(employee, { status: 201 })
  } catch (error) {
    console.error('POST /api/employees error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
