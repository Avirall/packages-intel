import { Hero } from "@/components/landing/Hero"
import { ProblemSection } from "@/components/landing/ProblemSection"
import { SupportedFormats } from "@/components/landing/SupportedFormats"

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      <Hero />
      <ProblemSection />
      <SupportedFormats />
    </main>
  )
}
