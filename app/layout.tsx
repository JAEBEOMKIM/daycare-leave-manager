import type { Metadata } from 'next'
import { Hanken_Grotesk, Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/ui/ThemeProvider'

const hankenGrotesk = Hanken_Grotesk({
  variable: '--font-hanken-grotesk',
  subsets: ['latin'],
  weight: ['400', '600', '700'],
})

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
})

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains-mono',
  subsets: ['latin'],
  weight: ['400', '500'],
})

export const metadata: Metadata = {
  title: '어린이집 연차관리시스템',
  description: '어린이집 원장님을 위한 선생님 연차 관리 시스템',
  viewport: 'width=device-width, initial-scale=1',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="ko"
      className={`${hankenGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body className="antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
