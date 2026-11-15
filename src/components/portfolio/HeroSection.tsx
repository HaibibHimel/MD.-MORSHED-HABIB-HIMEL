import { useState } from 'react';
import { ArrowDownRight, Download, Mail, User } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { resolveProfileImage } from '@/src/lib/defaultAssets';
import type { PortfolioProfile, SocialLinkItem } from '@/src/types/portfolio';
import { AnimatedCounter } from './AnimatedCounter';
import { renderSocialIcon } from './IconMap';

interface HeroSectionProps {
  profile: PortfolioProfile;
  socialLinks: SocialLinkItem[];
  experienceCount: number;
  skillsCount: number;
  certificationsCount: number;
  cgpaValue: number;
}

export function HeroSection({
  profile,
  socialLinks,
  experienceCount,
  skillsCount,
  certificationsCount,
  cgpaValue,
}: HeroSectionProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const prefersReduced = useReducedMotion();
  const portraitSrc = resolveProfileImage(profile.profile_image_url);

  const nameWords = profile.full_name.trim().split(/\s+/);

  const kpis = [
    {
      value: experienceCount,
      decimals: 0,
      padZero: true,
      label: 'Organizations Served',
      detail: 'Accounting & Service Operations',
    },
    {
      value: skillsCount,
      decimals: 0,
      padZero: true,
      label: 'Core Competencies',
      detail: 'Ledgers, Excel & Reconciliation',
    },
    {
      value: cgpaValue,
      decimals: 2,
      padZero: false,
      label: 'BBA Accounting CGPA',
      detail: 'Out of 4.00 · National University',
    },
    {
      value: certificationsCount,
      decimals: 0,
      padZero: true,
      label: 'Verified Certifications',
      detail: 'Technical Excel & AI Literacy',
    },
  ];

  return (
    <section id="top" className="relative overflow-hidden pt-12 pb-16 sm:pt-16 sm:pb-24">
      {/* Subtle floating geometric ambient accents in Hero */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          animate={
            prefersReduced
              ? undefined
              : {
                  y: [0, -18, 0],
                  rotate: [0, 4, 0],
                  opacity: [0.35, 0.55, 0.35],
                }
          }
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-12 right-[12%] h-64 w-64 rounded-full border border-cyan-400/15 bg-gradient-to-br from-cyan-500/10 to-blue-600/5 blur-xl"
        />
        <motion.div
          animate={
            prefersReduced
              ? undefined
              : {
                  y: [0, 14, 0],
                  x: [0, -10, 0],
                  opacity: [0.25, 0.45, 0.25],
                }
          }
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          className="absolute bottom-24 left-[6%] h-48 w-48 rounded-full border border-indigo-400/15 bg-gradient-to-tr from-indigo-600/10 to-purple-500/5 blur-xl"
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-12">
          {/* Left column: Animated typographic hierarchy & primary actions */}
          <div className="flex flex-col justify-center lg:col-span-7">
            <motion.div
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="w-fit"
            >
              <p className="text-xs sm:text-sm font-medium tracking-wide text-cyan-300/95">
                {profile.title_line}
              </p>
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="mt-2 h-px w-full origin-left bg-gradient-to-r from-cyan-400 via-blue-500 to-transparent"
              />
            </motion.div>

            {/* Staggered word-by-word reveal on Hero Name */}
            <h1 className="mt-5 font-display text-4xl font-extrabold tracking-tight text-white sm:text-5xl xl:text-[3.5rem] xl:leading-[1.08] [text-wrap:balance]">
              {nameWords.map((word, index) => (
                <motion.span
                  key={`${word}-${index}`}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.55,
                    delay: 0.08 + index * 0.09,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="mr-[0.26em] inline-block"
                >
                  {word}
                </motion.span>
              ))}
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="mt-4 max-w-2xl font-display text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-sky-200 via-cyan-300 to-indigo-300 sm:text-2xl [text-wrap:balance]"
            >
              &ldquo;{profile.headline}&rdquo;
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.36, ease: [0.16, 1, 0.3, 1] }}
              className="mt-5 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-[17px]"
            >
              {profile.short_intro}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.44, ease: [0.16, 1, 0.3, 1] }}
              className="mt-8 flex flex-wrap items-center gap-3.5"
            >
              <motion.a
                whileHover={prefersReduced ? undefined : { y: -2, scale: 1.02 }}
                whileTap={prefersReduced ? undefined : { scale: 0.98 }}
                transition={{ duration: 0.16 }}
                href="/api/cv/download"
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 px-6 py-3 text-sm font-semibold text-white shadow-xl shadow-blue-950/60 transition-all duration-200 hover:brightness-110 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400"
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                <span>Download CV</span>
              </motion.a>

              <motion.a
                whileHover={prefersReduced ? undefined : { y: -2 }}
                whileTap={prefersReduced ? undefined : { scale: 0.98 }}
                transition={{ duration: 0.16 }}
                href="#experience"
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-white/15 bg-white/[0.05] px-5 py-3 text-sm font-semibold text-slate-100 backdrop-blur-md transition-colors duration-200 hover:border-cyan-400/50 hover:bg-white/[0.09] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400"
              >
                <span>View My Work</span>
                <ArrowDownRight className="h-4 w-4 text-cyan-300" aria-hidden="true" />
              </motion.a>

              <motion.a
                whileHover={prefersReduced ? undefined : { y: -2 }}
                whileTap={prefersReduced ? undefined : { scale: 0.98 }}
                transition={{ duration: 0.16 }}
                href="#contact"
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-white/10 bg-transparent px-5 py-3 text-sm font-semibold text-slate-300 transition-colors hover:border-white/25 hover:text-white whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400"
              >
                <Mail className="h-4 w-4 text-indigo-300" aria-hidden="true" />
                <span>Contact Me</span>
              </motion.a>
            </motion.div>

            {/* Staggered social links row */}
            {socialLinks.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.52 }}
                className="mt-8 flex flex-wrap items-center gap-5 border-t border-white/10 pt-6"
              >
                <span className="text-xs font-medium text-slate-400">Direct Channels</span>
                <div className="flex flex-wrap items-center gap-3">
                  {socialLinks.map((link, idx) => (
                    <motion.a
                      key={link.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, delay: 0.56 + idx * 0.06 }}
                      whileHover={prefersReduced ? undefined : { y: -2 }}
                      href={link.url}
                      target={link.url.startsWith('http') ? '_blank' : undefined}
                      rel={link.url.startsWith('http') ? 'noopener noreferrer' : undefined}
                      className="inline-flex min-h-[40px] items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs font-medium text-slate-200 transition-colors hover:border-cyan-400/40 hover:bg-white/[0.08] hover:text-white whitespace-nowrap shrink-0"
                    >
                      <span className="text-cyan-300" aria-hidden="true">
                        {renderSocialIcon(link.platform, 'h-3.5 w-3.5')}
                      </span>
                      <span>{link.platform}</span>
                    </motion.a>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Right column: Animated Portrait Showcase */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex justify-center lg:col-span-5 lg:justify-end"
          >
            {/* Ambient breathing halo behind portrait */}
            <motion.div
              aria-hidden="true"
              animate={
                prefersReduced
                  ? undefined
                  : {
                      scale: [1, 1.06, 1],
                      opacity: [0.45, 0.7, 0.45],
                    }
              }
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -inset-3 rounded-3xl bg-gradient-to-tr from-blue-600/30 via-cyan-400/20 to-indigo-500/30 blur-2xl"
            />

            <motion.div
              animate={prefersReduced ? undefined : { y: [0, -8, 0] }}
              transition={{ duration: 6.5, repeat: Infinity, ease: 'easeInOut' }}
              whileHover={prefersReduced ? undefined : { scale: 1.015 }}
              className="relative w-full max-w-[440px] overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-b from-[#0E1A3D] to-[#070E22] p-2 shadow-2xl shadow-blue-950/70 backdrop-blur-xl"
            >
              <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-[#0A132C]">
                {!imgFailed ? (
                  <img
                    src={portraitSrc}
                    alt={`${profile.full_name} — ${profile.profession}`}
                    referrerPolicy="no-referrer"
                    onError={() => setImgFailed(true)}
                    className="h-full w-full object-cover object-top transition-transform duration-500"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-[#0D1A3B] via-[#09122B] to-[#050A18] p-8 text-center">
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-500/10 text-cyan-300">
                      <User className="h-10 w-10" />
                    </div>
                    <p className="mt-4 font-display text-lg font-semibold text-white">
                      {profile.full_name}
                    </p>
                    <p className="mt-1 text-sm text-slate-400">{profile.profession}</p>
                  </div>
                )}

                {/* Measured scrim for crisp legible caption */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#050A18]/92 via-[#050A18]/50 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5">
                  <div>
                    <p className="text-sm font-semibold text-white">{profile.full_name}</p>
                    <p className="text-xs text-slate-200">
                      {profile.profession} · {profile.contact_location}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Full-width 4-column animated KPI strip below hero split */}
        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((item, idx) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.35 + idx * 0.08, ease: [0.16, 1, 0.3, 1] }}
              whileHover={prefersReduced ? undefined : { y: -4 }}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#0A132C]/75 p-6 backdrop-blur-xl transition-colors hover:border-cyan-400/35"
            >
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.7, delay: 0.45 + idx * 0.08, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-x-0 top-0 h-px origin-left bg-gradient-to-r from-cyan-400/70 via-blue-500/70 to-transparent"
              />
              <div className="font-mono text-3xl font-semibold tracking-tight text-white tabular-nums">
                <AnimatedCounter
                  value={item.value}
                  decimals={item.decimals}
                  padZero={item.padZero}
                />
              </div>
              <p className="mt-2 text-sm font-semibold text-slate-100">{item.label}</p>
              <p className="mt-1 text-xs text-slate-400">{item.detail}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
