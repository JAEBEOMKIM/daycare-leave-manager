'use client'

import { ReactNode } from 'react'

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">{children}</table>
    </div>
  )
}

export function TableHeader({ children }: { children: ReactNode }) {
  return (
    <thead>
      <tr className="border-b border-border-subtle bg-surface-variant/30">
        {children}
      </tr>
    </thead>
  )
}

export function TableBody({ children }: { children: ReactNode }) {
  return <tbody>{children}</tbody>
}

export function TableRow({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  return (
    <tr
      onClick={onClick}
      className="border-b border-border-subtle hover:bg-surface-container/50 transition-colors"
    >
      {children}
    </tr>
  )
}

export function TableHead({ children }: { children: ReactNode }) {
  return (
    <th className="text-left py-3 px-4 font-inter text-label-md text-on-surface-variant font-semibold">
      {children}
    </th>
  )
}

export function TableCell({ children, align = 'left' }: { children: ReactNode; align?: 'left' | 'center' | 'right' }) {
  const alignClass = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  }[align]

  return (
    <td className={`py-3 px-4 font-inter text-body-sm text-on-surface ${alignClass}`}>
      {children}
    </td>
  )
}
