import { Award, GraduationCap } from 'lucide-react';
import { motion } from 'motion/react';
import type { CertificationItem, EducationItem } from '@/src/types/portfolio';

interface CredentialsSectionProps {
  education: EducationItem[];
  certifications: CertificationItem[];
}

export function CredentialsSection({ education, certifications }: CredentialsSectionProps) {
  return (
    <section id="credentials" className="relative py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold tracking-wide text-cyan-300">Academic &amp; Technical</p>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl [text-wrap:balance]">
            Education &amp; Certifications
          </h2>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Education column */}
          <div className="space-y-5 lg:col-span-5">
            {education.map((edu, idx) => (
              <motion.div
                key={edu.id}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: 0.45, delay: idx * 0.08 }}
                className="flex h-full flex-col justify-between rounded-2xl border border-white/10 bg-gradient-to-br from-[#0D1A3C]/85 via-[#0A132C]/80 to-[#0E1330]/85 p-7 backdrop-blur-xl"
              >
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-blue-400/25 bg-blue-500/15 text-blue-300">
                      <GraduationCap className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <span className="font-mono text-xs text-slate-400">{edu.period}</span>
                  </div>

                  <p className="mt-6 text-xs font-semibold tracking-wide text-cyan-300">Academic Degree</p>
                  <h3 className="mt-1.5 font-display text-2xl font-bold text-white">{edu.degree}</h3>
                  <p className="mt-3 text-base font-semibold text-slate-100">{edu.institution}</p>
                  {edu.university && (
                    <p className="mt-1 text-sm text-slate-300">{edu.university}</p>
                  )}
                </div>

                {edu.cgpa && (
                  <div className="mt-8 border-t border-white/10 pt-5">
                    <p className="font-mono text-lg font-semibold text-cyan-300 tabular-nums">
                      {edu.cgpa}
                    </p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {/* Certifications column */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:col-span-7">
            {certifications.map((cert, idx) => (
              <motion.div
                key={cert.id}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: 0.45, delay: 0.08 + idx * 0.08 }}
                className="group flex flex-col justify-between rounded-2xl border border-white/10 bg-[#0A132C]/70 p-7 backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-400/40 hover:bg-[#0D1736]/85"
              >
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-indigo-400/25 bg-indigo-500/15 text-indigo-300 transition-transform duration-200 group-hover:scale-105">
                      <Award className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <span className="font-mono text-xs text-cyan-300">{cert.period}</span>
                  </div>

                  <h3 className="mt-6 font-display text-xl font-bold leading-snug text-white">
                    {cert.title}
                  </h3>
                  <p className="mt-2.5 text-sm font-medium text-blue-200">{cert.issuer}</p>
                  {cert.credential_note && (
                    <p className="mt-4 text-sm leading-relaxed text-slate-300">
                      {cert.credential_note}
                    </p>
                  )}
                </div>

                <div className="mt-6 border-t border-white/10 pt-4 text-xs text-slate-400">
                  Verified Certificate
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
