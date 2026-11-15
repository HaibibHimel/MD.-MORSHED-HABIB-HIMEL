import { useState } from 'react';
import { Building2, Calendar, CheckCircle2, ChevronDown, MapPin } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type { ExperienceItem } from '@/src/types/portfolio';

interface ExperienceTimelineProps {
  experiences: ExperienceItem[];
}

export function ExperienceTimeline({ experiences }: ExperienceTimelineProps) {
  const [expandedId, setExpandedId] = useState<number | null>(experiences[0]?.id ?? null);

  return (
    <section id="experience" className="relative py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold tracking-wide text-cyan-300">Career Progression</p>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl [text-wrap:balance]">
            Work Experience Timeline
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-300 sm:text-base">
            Hands-on leadership across service operations, distribution accounting, sales register reconciliation, and corporate voucher workflows.
          </p>
        </div>

        <div className="relative mt-12">
          {/* Animated timeline spine */}
          <motion.div
            initial={{ scaleY: 0 }}
            whileInView={{ scaleY: 1 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            aria-hidden="true"
            className="absolute top-3 bottom-3 left-4 w-px origin-top bg-gradient-to-b from-cyan-400 via-blue-500 to-indigo-600/30 sm:left-6"
          />

          <div className="space-y-6">
            {experiences.map((exp, idx) => {
              const isOpen = expandedId === exp.id;
              return (
                <motion.article
                  key={exp.id}
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.45, delay: idx * 0.08, ease: [0.16, 1, 0.3, 1] }}
                  className="relative pl-12 sm:pl-16"
                >
                  {/* Timeline node */}
                  <div
                    aria-hidden="true"
                    className={`absolute top-6 left-[9px] flex h-4 w-4 items-center justify-center rounded-full border-2 sm:left-[17px] ${
                      exp.is_current
                        ? 'border-cyan-300 bg-cyan-500 shadow-[0_0_16px_rgba(34,211,238,0.6)]'
                        : 'border-blue-400 bg-[#050A18]'
                    }`}
                  />

                  <div
                    className={`rounded-2xl border backdrop-blur-xl transition-colors duration-200 ${
                      isOpen
                        ? 'border-cyan-400/40 bg-[#0C1736]/85'
                        : 'border-white/10 bg-[#0A132C]/65 hover:border-white/20'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedId(isOpen ? null : exp.id)}
                      aria-expanded={isOpen}
                      className="flex w-full flex-col justify-between gap-4 p-6 text-left sm:flex-row sm:items-center sm:p-7 focus-visible:outline-2 focus-visible:outline-cyan-400"
                    >
                      <div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                          <span className="inline-flex items-center gap-1.5 font-mono text-cyan-300">
                            <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                            {exp.period}
                          </span>
                          {exp.location && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="inline-flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5 text-indigo-300" aria-hidden="true" />
                                {exp.location}
                              </span>
                            </>
                          )}
                          {exp.is_current && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="font-semibold text-cyan-300">Current Role</span>
                            </>
                          )}
                        </div>

                        <h3 className="mt-2 font-display text-xl font-bold text-white">{exp.role}</h3>
                        <p className="mt-1 flex items-center gap-2 text-sm font-medium text-blue-200">
                          <Building2 className="h-4 w-4 shrink-0 text-blue-400" aria-hidden="true" />
                          <span>{exp.company}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-2 self-start text-xs font-medium text-slate-300 sm:self-center shrink-0">
                        <span>{isOpen ? 'Hide details' : 'View responsibilities'}</span>
                        <ChevronDown
                          className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180 text-cyan-300' : ''}`}
                          aria-hidden="true"
                        />
                      </div>
                    </button>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                          className="overflow-hidden"
                        >
                          <div className="border-t border-white/10 px-6 pt-5 pb-6 sm:px-7 sm:pb-7">
                            <p className="text-xs font-semibold tracking-wide text-slate-400">
                              Key Responsibilities
                            </p>
                            <ul className="mt-3.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                              {exp.responsibilities.map((item, rIdx) => (
                                <li
                                  key={rIdx}
                                  className="flex items-start gap-2.5 text-sm leading-relaxed text-slate-200"
                                >
                                  <CheckCircle2
                                    className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400"
                                    aria-hidden="true"
                                  />
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
