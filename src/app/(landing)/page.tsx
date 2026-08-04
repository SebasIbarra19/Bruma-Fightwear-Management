import { HomeHero } from '@/components/marketing/HomeHero'
import { PhilosophySection } from '@/components/marketing/PhilosophySection'
import { EmblemSection } from '@/components/marketing/EmblemSection'
import { RaicesSection } from '@/components/marketing/RaicesSection'
import { ContactSection } from '@/components/marketing/ContactSection'

export default function HomePage() {
  return (
    <div className="relative z-10">
      <HomeHero />
      <PhilosophySection />
      <EmblemSection />
      <RaicesSection />
      <ContactSection />
    </div>
  )
}
