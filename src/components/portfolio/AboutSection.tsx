import { Globe2, Heart, MapPin, UserCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { defaultBackdropImage } from '@/src/lib/defaultAssets';
import type { PortfolioProfile } from '@/src/types/portfolio';

interface AboutSectionProps {
  profile: PortfolioProfile;
}

export function AboutSection({ profile }: AboutSectionProps) {
  return (
    <section id="about" className="relative py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-stretch"
        >
          {/* Left visual editorial panel */}
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#091229] lg:col-span-5">
            <img
              src={defaultBackdropImage}
              alt="Architectural dark navy financial geometry"
              referrerPolicy="no-referrer"
              className="h-full min-h-[260px] w-full object-cover opacity-80"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#050A18] via-[#050A18]/55 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
              <p className="text-xs font-medium tracking-wide text-cyan-300">Profile Snapshot</p>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <UserCheck className="mt-0.5 h-4 w-4 shrink-0 text-blue-400" aria-hidden="true" />
                  <div>
                    <dt className="text-xs text-slate-400">Name &amp; Profession</dt>
                    <dd className="font-medium text-white">
                      {profile.full_name} · {profile.profession}
                    </dd>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" aria-hidden="true" />
                  <div>
                    <dt className="text-xs text-slate-400">Location</dt>
                    <dd className="font-medium text-slate-200">{profile.about_location}</dd>
                  </div>
                </div>
              </dl>
            </div>
          </div>

          {/* Right narrative & languages/interests */}
          <div className="flex flex-col justify-between rounded-2xl border border-white/10 bg-[#0A132C]/70 p-7 backdrop-blur-xl sm:p-10 lg:col-span-7">
            <div>
              <p className="text-xs font-semibold tracking-wide text-cyan-300">About Me</p>
              <h2 className="mt-3 font-display text-2xl font-bold tracking-tight text-white sm:text-3xl [text-wrap:balance]">
                Disciplined Financial Operations &amp; Ledger Accuracy
              </h2>
              <p className="mt-5 text-base leading-[1.7] text-slate-300">
                {profile.about_description}
              </p>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-6 border-t border-white/10 pt-7 sm:grid-cols-2">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-indigo-300">
                  <Globe2 className="h-4 w-4" aria-hidden="true" />
                  <span>Languages</span>
                </div>
                <ul className="mt-3 space-y-2">
                  {profile.languages.map((lang, idx) => (
                    <li key={`${lang.language}-${idx}`} className="text-sm text-slate-200">
                      <span className="font-semibold text-white">{lang.language}</span>
                      <span className="mx-2 text-slate-500">–</span>
                      <span className="text-slate-300">{lang.level}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-cyan-300">
                  <Heart className="h-4 w-4" aria-hidden="true" />
                  <span>Personal Interests</span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-slate-200">
                  {profile.interests.join('  ·  ')}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
