interface BadgeProps {
  children: string
  variant?: 'primary' | 'secondary' | 'error' | 'success' | 'warning'
  className?: string
}

const variantStyles = {
  primary: 'bg-primary/20 text-primary',
  secondary: 'bg-secondary-container/20 text-secondary',
  error: 'bg-error-red/20 text-error-red',
  success: 'bg-data-teal/20 text-data-teal',
  warning: 'bg-data-purple/20 text-data-purple',
}

export function Badge({
  children,
  variant = 'primary',
  className = '',
}: BadgeProps) {
  return (
    <span
      className={`inline-block px-3 py-1 rounded-full text-label-sm font-medium ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  )
}
