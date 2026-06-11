import { ReactNode } from 'react'
import { GlassCard } from './GlassCard'

interface StatCardProps {
  icon?: ReactNode
  label: string
  value: string | number
  subtext?: string
  className?: string
}

export function StatCard({
  icon,
  label,
  value,
  subtext,
  className = '',
}: StatCardProps) {
  return (
    <GlassCard className={className}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-label-md text-on-surface-variant uppercase mb-1">
            {label}
          </p>
          {subtext && <p className="text-body-sm text-on-surface/70">{subtext}</p>}
        </div>
        {icon && <div className="text-primary">{icon}</div>}
      </div>
      <div className="text-display-lg text-primary">{value}</div>
    </GlassCard>
  )
}
