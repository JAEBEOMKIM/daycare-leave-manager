import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 사용자의 시설 정보 조회
    const { data: userData } = await supabase
      .from('users')
      .select('facility_id')
      .eq('id', user.id)
      .single()

    if (!userData?.facility_id) {
      return NextResponse.json({ error: 'No facility found' }, { status: 404 })
    }

    const { data: facility, error } = await supabase
      .from('facilities')
      .select('*')
      .eq('id', userData.facility_id)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(facility)
  } catch (error) {
    console.error('GET /api/settings error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, address, contact_email, contact_phone, fiscal_year_start, annual_days_base } = body

    // 사용자의 시설 정보 조회
    const { data: userData } = await supabase
      .from('users')
      .select('facility_id')
      .eq('id', user.id)
      .single()

    if (!userData?.facility_id) {
      return NextResponse.json({ error: 'No facility found' }, { status: 404 })
    }

    // 원장만 설정 수정 가능
    const { data: facility } = await supabase
      .from('facilities')
      .select('director_id')
      .eq('id', userData.facility_id)
      .single()

    if (facility?.director_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: updatedFacility, error } = await supabase
      .from('facilities')
      .update({
        name,
        address,
        contact_email,
        contact_phone,
        fiscal_year_start,
        annual_days_base,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userData.facility_id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(updatedFacility)
  } catch (error) {
    console.error('PUT /api/settings error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
