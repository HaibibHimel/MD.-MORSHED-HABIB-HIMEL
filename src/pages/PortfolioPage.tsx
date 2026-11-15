import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { fetchPortfolio, trackVisit } from '@/src/lib/api';
import type { PortfolioData } from '@/src/types/portfolio';
import { Navbar } from '@/src/components/portfolio/Navbar';
import { HeroSection } from '@/src/components/portfolio/HeroSection';
import { AboutSection } from '@/src/components/portfolio/AboutSection';
import { SkillsSection } from '@/src/components/portfolio/SkillsSection';
import { ExperienceTimeline } from '@/src/components/portfolio/ExperienceTimeline';
import { CredentialsSection } from '@/src/components/portfolio/CredentialsSection';
import { ContactSection } from '@/src/components/portfolio/ContactSection';
import { Footer } from '@/src/components/portfolio/Footer';

export function PortfolioPage() {
  const [data, setData] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetchPortfolio()
      .then((res) => {
        if (active) {
          setData(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err instanceof Error ? err.message : 'Unable to load portfolio.');
          setLoading(false);
        }
      });

    // Record visit once per browser session
    let visitorId = '';
    try {
      visitorId = sessionStorage.getItem('mh_visitor_id') || '';
      if (!visitorId) {
        visitorId = crypto.randomUUID();
        sessionStorage.setItem('mh_visitor_id', visitorId);
      }
    } catch {
      visitorId = '';
    }
    trackVisit(visitorId).catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  const cgpaNumeric = useMemo(() => {
    const raw = data?.education?.[0]?.cgpa || '';
    const match = raw.match(/(\d+\.\d+)/);
    return match ? parseFloat(match[1]) : 3.18;
  }, [data]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050A18] text-slate-100">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="h-10 w-56 animate-pulse rounded-lg bg-white/10" />
          <div className="mt-14 grid grid-cols-1 gap-10 lg:grid-cols-12">
            <div className="space-y-4 lg:col-span-7">
              <div className="h-5 w-72 animate-pulse rounded bg-white/10" />
              <div className="h-14 w-3/4 animate-pulse rounded-lg bg-white/10" />
              <div className="h-8 w-2/3 animate-pulse rounded bg-white/10" />
              <div className="h-24 w-full animate-pulse rounded-xl bg-white/5" />
            </div>
            <div className="h-[420px] animate-pulse rounded-2xl bg-white/10 lg:col-span-5" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050A18] p-6 text-center">
        <div className="max-w-md rounded-2xl border border-rose-500/30 bg-[#0A132C] p-8">
          <h1 className="font-display text-xl font-bold text-white">Portfolio Unavailable</h1>
          <p className="mt-2 text-sm text-slate-300">{error || 'Unable to load content.'}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-6 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
      className="relative min-h-screen overflow-x-hidden bg-[#050A18] text-slate-100"
    >
      {/* Subtle animated gradient backdrop */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="animate-gradient-shift absolute -top-48 -left-32 h-[560px] w-[560px] rounded-full bg-blue-600/18 blur-[130px]" />
        <div className="animate-float-slow absolute top-1/3 -right-36 h-[520px] w-[520px] rounded-full bg-indigo-600/16 blur-[140px]" />
        <div className="animate-gradient-shift absolute bottom-0 left-1/3 h-[440px] w-[440px] rounded-full bg-cyan-500/12 blur-[130px]" />
      </div>

      <Navbar fullName={data.profile.full_name} />

      <main>
        <HeroSection
          profile={data.profile}
          socialLinks={data.socialLinks}
          experienceCount={data.experiences.length}
          skillsCount={data.skills.length}
          certificationsCount={data.certifications.length}
          cgpaValue={cgpaNumeric}
        />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>

        <AboutSection profile={data.profile} />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>

        <SkillsSection skills={data.skills} />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>

        <ExperienceTimeline experiences={data.experiences} />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>

        <CredentialsSection
          education={data.education}
          certifications={data.certifications}
        />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>

        <ContactSection profile={data.profile} socialLinks={data.socialLinks} />
      </main>

      <Footer fullName={data.profile.full_name} />
    </motion.div>
  );
}
