import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { AudienceSection } from "@/components/landing/AudienceSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { WhySection } from "@/components/landing/WhySection";
import { CTASection } from "@/components/landing/CTASection";
import { Footer } from "@/components/landing/Footer";
import { supabase } from "@/integrations/supabase/client";
import { getDashboardRoute } from "@/lib/getDashboardRoute";

export default function Landing() {
  const navigate = useNavigate();

  // Handle OAuth redirect — if user lands here with a session, route them
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        const meta = session.user.user_metadata;
        if (!meta?.profile_completed && !meta?.user_type) {
          navigate("/complete-profile", { replace: true });
        } else {
          navigate(getDashboardRoute(meta), { replace: true });
        }
      }
    });
  }, [navigate]);

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
