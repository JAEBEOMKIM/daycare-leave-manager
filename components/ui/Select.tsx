'use client'

import { SelectHTMLAttributes } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: Array<{ value: string; label: string }>
  placeholder?: string
}

export function Select({ label, error, options, placeholder, ...props }: SelectProps) {
  return (
    <div>
      {label && (
        <label className="block font-inter text-label-md text-on-surface mb-2">
          {label}
        </label>
      )}
      <select
        {...props}
        className={`w-full px-4 py-3 bg-surface-container border rounded-lg font-inter text-body-sm text-on-surface focus:outline-none focus:ring-1 transition-all ${
          error
            ? 'border-error-red focus:border-error-red focus:ring-error-red'
            : 'border-border-subtle focus:border-primary focus:ring-primary'
        }`}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-2 font-inter text-body-xs text-error-red">{error}</p>
      )}
    </div>
  )
}
