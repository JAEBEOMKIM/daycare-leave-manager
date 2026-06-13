export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl bg-surface-container-low shadow-sm border border-border-subtle ${className}`}>
      {children}
    </div>
  )
}
