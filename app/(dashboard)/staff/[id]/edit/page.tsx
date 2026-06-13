'use client'

import { use } from 'react'
import { StaffForm } from '@/components/staff/StaffForm'

export default function EditStaffPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  return <StaffForm staffId={id} />
}
