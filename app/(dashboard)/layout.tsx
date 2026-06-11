import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'
import { MobileBottomNav } from '@/components/layout/MobileBottomNav'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  return (
    <div className="flex min-h-screen flex-col bg-surface-deep">
      <Sidebar />
      <TopBar />
      <main className="flex-1 md:ml-64 w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-gutter pb-32 md:pb-gutter flex flex-col gap-gutter">
        {children}
      </main>
      <MobileBottomNav />
    </div>
  )
}
