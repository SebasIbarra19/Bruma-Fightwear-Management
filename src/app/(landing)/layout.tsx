import { LandingHeader } from '@/components/layout/LandingHeader'
import { LandingFooter } from '@/components/layout/LandingFooter'

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <LandingHeader />
      {children}
      <LandingFooter />
    </>
  )
}
