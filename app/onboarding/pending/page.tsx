import { Clock } from 'lucide-react'
import { StatusCard } from '../_StatusCard'

export default function PendingPage() {
  return (
    <StatusCard
      tone="info"
      icon={<Clock size={30} />}
      title="승인 대기 중"
      desc={'어린이집 등록이 접수되었습니다.\n관리자 승인이 완료되면 서비스를 이용할 수 있습니다.'}
    />
  )
}
