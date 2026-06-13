interface BadgeProps {
  children: React.ReactNode
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'neutral'
  className?: string
}

const variantStyles = {
  primary: 'bg-primary-container text-primary',
  success: 'bg-success-container text-success',
  warning: 'bg-warning-container text-warning',
  error: 'bg-error-container text-error',
  neutral: 'bg-surface-container text-on-surface',
}

export function Badge({
  children,
  variant = 'neutral',
  className = '',
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-label-sm font-medium ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  )
}
