import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { AudienceSection } from "@/components/landing/AudienceSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { WhySection } from "@/components/landing/WhySection";
import { CTASection } from "@/components/landing/CTASection";
import { Footer } from "@/components/landing/Footer";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <HeroSection />
        <AudienceSection />
        <FeaturesSection />
        <WhySection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
