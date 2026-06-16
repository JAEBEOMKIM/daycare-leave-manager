import { XCircle } from 'lucide-react'
import { StatusCard } from '../_StatusCard'

export default function RejectedPage() {
  return (
    <StatusCard
      tone="error"
      icon={<XCircle size={30} />}
      title="등록이 거절되었습니다"
      desc={'어린이집 등록 요청이 거절되었습니다.\n자세한 사유는 관리자에게 문의해 주세요.'}
    />
  )
}
