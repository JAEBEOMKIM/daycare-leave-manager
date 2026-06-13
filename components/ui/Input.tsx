'use client'

import { InputHTMLAttributes, ReactNode } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: ReactNode
}

export function Input({ label, error, icon, ...props }: InputProps) {
  return (
    <div>
      {label && (
        <label className="block font-inter text-label-md text-on-surface mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-on-surface-variant">
            {icon}
          </div>
        )}
        <input
          {...props}
          className={`w-full ${icon ? 'pl-10' : 'pl-4'} pr-4 py-3 bg-surface-container border rounded-lg font-inter text-body-sm text-on-surface placeholder-on-surface-variant focus:outline-none focus:ring-1 transition-all ${
            error
              ? 'border-error-red focus:border-error-red focus:ring-error-red'
              : 'border-border-subtle focus:border-primary focus:ring-primary'
          }`}
        />
      </div>
      {error && (
        <p className="mt-2 font-inter text-body-xs text-error-red">{error}</p>
      )}
    </div>
  )
}
