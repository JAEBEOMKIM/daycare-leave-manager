import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'primary': 'var(--primary)',
        'primary-container': 'var(--primary-container)',
        'on-primary': 'var(--on-primary)',
        'secondary': 'var(--secondary)',
        'secondary-container': 'var(--secondary-container)',
        'on-secondary': 'var(--on-secondary)',
        'tertiary': 'var(--tertiary)',
        'tertiary-container': 'var(--tertiary-container)',
        'on-tertiary': 'var(--on-tertiary)',
        'surface-deep': 'var(--surface-deep)',
        'surface-container': 'var(--surface-container)',
        'surface-container-low': 'var(--surface-container-low)',
        'surface-bright': 'var(--surface-bright)',
        'on-surface': 'var(--on-surface)',
        'on-surface-variant': 'var(--on-surface-variant)',
        'outline': 'var(--outline)',
        'border-subtle': 'var(--border-subtle)',
        'data-teal': 'var(--data-teal)',
        'data-purple': 'var(--data-purple)',
        'error-red': 'var(--error-red)',
      },
      fontFamily: {
        'hanken': ['Hanken Grotesk', 'sans-serif'],
        'inter': ['Inter', 'sans-serif'],
        'mono': ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        'display-lg': ['48px', { lineHeight: '56px', letterSpacing: '-0.02em', fontWeight: '700' }],
        'headline-lg': ['32px', { lineHeight: '40px', fontWeight: '700' }],
        'headline-md': ['28px', { lineHeight: '36px', fontWeight: '700' }],
        'title-lg': ['22px', { lineHeight: '28px', fontWeight: '500' }],
        'body-lg': ['18px', { lineHeight: '28px', fontWeight: '400' }],
        'body-md': ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'body-sm': ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'label-md': ['12px', { lineHeight: '16px', letterSpacing: '0.5px', fontWeight: '500' }],
        'label-sm': ['11px', { lineHeight: '16px', letterSpacing: '0.5px', fontWeight: '500' }],
      },
      spacing: {
        'base': '8px',
        'gutter': '24px',
        'margin-mobile': '16px',
        'margin-desktop': '40px',
        'container-max': '1440px',
      },
      borderRadius: {
        'DEFAULT': '0.25rem',
        'lg': '0.5rem',
        'xl': '0.75rem',
      },
    },
  },
  plugins: [],
}
export default config
