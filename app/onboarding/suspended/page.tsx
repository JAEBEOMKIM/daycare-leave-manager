import { PauseCircle } from 'lucide-react'
import { StatusCard } from '../_StatusCard'

export default function SuspendedPage() {
  return (
    <StatusCard
      tone="warn"
      icon={<PauseCircle size={30} />}
      title="이용이 일시 중지되었습니다"
      desc={'어린이집 이용이 중지되었거나 사용 기한이 만료되었습니다.\n관리자에게 문의해 주세요.'}
    />
  )
}
