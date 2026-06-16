import Link from 'next/link'

export function StatusCard({
  icon,
  title,
  desc,
  tone,
}: {
  icon: React.ReactNode
  title: string
  desc: string
  tone: 'info' | 'error' | 'warn'
}) {
  const tile =
    tone === 'error'
      ? 'bg-error-red/10 text-error-red'
      : tone === 'warn'
        ? 'bg-warning-amber/10 text-warning-amber'
        : 'bg-primary-container/30 text-primary'
  return (
    <div className="bg-surface-white rounded-2xl border border-outline-variant shadow-sm p-8 text-center">
      <div className={`mx-auto w-16 h-16 rounded-2xl flex items-center justify-center ${tile}`}>{icon}</div>
      <h1 className="mt-5 text-headline-md font-bold text-on-surface">{title}</h1>
      <p className="mt-2 text-body-md text-on-surface-variant whitespace-pre-line">{desc}</p>
      <div className="mt-6">
        <Link href="/auth/logout" className="text-body-sm text-on-surface-variant hover:underline">
          로그아웃
        </Link>
      </div>
    </div>
  )
}
