import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import type { SkillItem } from '@/src/types/portfolio';
import { renderSkillIcon } from './IconMap';

interface SkillsSectionProps {
  skills: SkillItem[];
}

export function SkillsSection({ skills }: SkillsSectionProps) {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [selectedSkillId, setSelectedSkillId] = useState<number | null>(null);

  const categories = useMemo(() => {
    const unique = Array.from(new Set(skills.map((s) => s.category)));
    return ['All', ...unique];
  }, [skills]);

  const filtered = useMemo(() => {
    if (activeCategory === 'All') return skills;
    return skills.filter((s) => s.category === activeCategory);
  }, [skills, activeCategory]);

  return (
    <section id="skills" className="relative py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-wide text-cyan-300">Core Capabilities</p>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl [text-wrap:balance]">
              Accounting &amp; Analytical Skills
            </h2>
          </div>

          {/* Interactive Filter Controls */}
          <div
            role="tablist"
            aria-label="Filter skills by category"
            className="flex flex-wrap items-center gap-1 rounded-xl border border-white/10 bg-[#0A132C]/80 p-1 backdrop-blur-md"
          >
            {categories.map((cat) => {
              const active = activeCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setActiveCategory(cat)}
                  className={`rounded-lg px-3.5 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-cyan-400 ${
                    active
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-sm'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((skill, idx) => {
            const isSelected = selectedSkillId === skill.id;
            return (
              <motion.button
                key={skill.id}
                type="button"
                onClick={() => setSelectedSkillId(isSelected ? null : skill.id)}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.4, delay: idx * 0.05, ease: [0.16, 1, 0.3, 1] }}
                className={`group flex flex-col justify-between rounded-2xl border p-6 text-left backdrop-blur-xl transition-all duration-200 focus-visible:outline-2 focus-visible:outline-cyan-400 ${
                  isSelected
                    ? 'border-cyan-400/50 bg-[#0F1C3F]/85 shadow-xl shadow-cyan-950/30'
                    : 'border-white/10 bg-[#0A132C]/65 hover:-translate-y-0.5 hover:border-blue-400/40 hover:bg-[#0D1736]/80'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-400/20 bg-gradient-to-br from-blue-500/20 to-cyan-500/10 text-cyan-300 transition-transform duration-200 group-hover:scale-105">
                      {renderSkillIcon(skill.icon_key, 'h-5 w-5')}
                    </div>
                    <span className="text-xs font-medium text-slate-400">{skill.category}</span>
                  </div>

                  <h3 className="mt-5 font-display text-lg font-bold text-white">{skill.name}</h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-slate-300">
                    {skill.description}
                  </p>
                </div>

                {/* Animated Progress Bar (GPU scaleX only, qualitative focus label — no invented percentages) */}
                <div className="mt-6 border-t border-white/10 pt-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-indigo-300">{skill.focus_label}</span>
                    <span className="font-mono text-slate-400">0{idx + 1}</span>
                  </div>
                  <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      initial={{ scaleX: 0 }}
                      whileInView={{ scaleX: 1 }}
                      viewport={{ once: true, amount: 0.4 }}
                      transition={{ duration: 0.75, delay: 0.1 + idx * 0.06, ease: [0.16, 1, 0.3, 1] }}
                      className="h-full w-full origin-left rounded-full bg-gradient-to-r from-blue-500 via-cyan-400 to-indigo-500"
                    />
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
