import { useState, type FormEvent } from 'react';
import { CheckCircle2, Mail, MapPin, Phone, Send } from 'lucide-react';
import { motion } from 'motion/react';
import { submitContactMessage } from '@/src/lib/api';
import type { PortfolioProfile, SocialLinkItem } from '@/src/types/portfolio';
import { renderSocialIcon } from './IconMap';

interface ContactSectionProps {
  profile: PortfolioProfile;
  socialLinks: SocialLinkItem[];
}

export function ContactSection({ profile, socialLinks }: ContactSectionProps) {
  const [senderName, setSenderName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (senderName.trim().length < 2) {
      setError('Please enter your full name.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(senderEmail.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    if (subject.trim().length < 2) {
      setError('Please enter a subject.');
      return;
    }
    if (message.trim().length < 10) {
      setError('Please write a message of at least 10 characters.');
      return;
    }

    setSubmitting(true);
    try {
      await submitContactMessage({
        sender_name: senderName.trim(),
        sender_email: senderEmail.trim(),
        subject: subject.trim(),
        message: message.trim(),
      });
      setSuccess(true);
      setSenderName('');
      setSenderEmail('');
      setSubject('');
      setMessage('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send message.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="contact" className="relative py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold tracking-wide text-cyan-300">Get In Touch</p>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl [text-wrap:balance]">
            Contact &amp; Inquiries
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-300 sm:text-base">
            Available for accounting roles, financial administration, ledger audits, and operational coordination.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Left animated contact cards */}
          <div className="space-y-4 lg:col-span-5">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.4 }}
              className="rounded-2xl border border-white/10 bg-[#0A132C]/70 p-6 backdrop-blur-xl transition-colors hover:border-cyan-400/35"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-500/10 text-cyan-300">
                    <Mail className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-400">Email Address</p>
                    <p className="mt-1 truncate text-sm font-semibold text-white">
                      {profile.contact_email}
                    </p>
                  </div>
                </div>
              </div>
              <a
                href={`mailto:${profile.contact_email}`}
                className="mt-4 inline-flex min-h-[40px] items-center gap-2 rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-xs font-semibold text-cyan-200 transition-colors hover:bg-cyan-500/20"
              >
                <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Send Email</span>
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.4, delay: 0.06 }}
              className="rounded-2xl border border-white/10 bg-[#0A132C]/70 p-6 backdrop-blur-xl transition-colors hover:border-blue-400/35"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-blue-400/20 bg-blue-500/10 text-blue-300">
                  <Phone className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-400">Direct Phone</p>
                  <p className="mt-1 font-mono text-sm font-semibold text-white tabular-nums">
                    {profile.contact_phone}
                  </p>
                </div>
              </div>
              <a
                href={`tel:${profile.contact_phone.replace(/\s+/g, '')}`}
                className="mt-4 inline-flex min-h-[40px] items-center gap-2 rounded-lg border border-blue-400/30 bg-blue-500/10 px-4 py-2 text-xs font-semibold text-blue-200 transition-colors hover:bg-blue-500/20"
              >
                <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Call Now</span>
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.4, delay: 0.12 }}
              className="rounded-2xl border border-white/10 bg-[#0A132C]/70 p-6 backdrop-blur-xl"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-indigo-400/20 bg-indigo-500/10 text-indigo-300">
                  <MapPin className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-400">Location</p>
                  <p className="mt-1 text-sm font-semibold text-white">{profile.contact_location}</p>
                </div>
              </div>

              {socialLinks.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-2.5 border-t border-white/10 pt-4">
                  {socialLinks.map((s) => (
                    <a
                      key={s.id}
                      href={s.url}
                      target={s.url.startsWith('http') ? '_blank' : undefined}
                      rel={s.url.startsWith('http') ? 'noopener noreferrer' : undefined}
                      className="inline-flex min-h-[38px] items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:border-cyan-400/40 hover:text-white"
                    >
                      <span className="text-cyan-300" aria-hidden="true">
                        {renderSocialIcon(s.platform, 'h-3.5 w-3.5')}
                      </span>
                      <span>{s.platform}</span>
                    </a>
                  ))}
                </div>
              )}
            </motion.div>
          </div>

          {/* Right contact form */}
          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.45, delay: 0.08 }}
            className="rounded-2xl border border-white/10 bg-[#0A132C]/75 p-7 backdrop-blur-xl sm:p-9 lg:col-span-7"
          >
            <h3 className="font-display text-xl font-bold text-white">Send a Message</h3>
            <p className="mt-1 text-sm text-slate-400">
              Messages are delivered directly to Morshed&apos;s portfolio inbox.
            </p>

            {error && (
              <div
                role="alert"
                className="mt-5 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200"
              >
                {error}
              </div>
            )}

            {success && (
              <div
                role="status"
                className="mt-5 flex items-center gap-2.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200"
              >
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" />
                <span>Thank you. Your message has been received and saved securely.</span>
              </div>
            )}

            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="contact-name" className="block text-xs font-semibold text-slate-300">
                  Your Name
                </label>
                <input
                  id="contact-name"
                  type="text"
                  required
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="Enter your name"
                  className="mt-2 w-full rounded-xl border border-white/12 bg-[#050A18]/80 px-4 py-3 text-sm text-white placeholder-slate-500 transition-colors focus:border-cyan-400 focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="contact-email" className="block text-xs font-semibold text-slate-300">
                  Email Address
                </label>
                <input
                  id="contact-email"
                  type="email"
                  required
                  value={senderEmail}
                  onChange={(e) => setSenderEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="mt-2 w-full rounded-xl border border-white/12 bg-[#050A18]/80 px-4 py-3 text-sm text-white placeholder-slate-500 transition-colors focus:border-cyan-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-5">
              <label htmlFor="contact-subject" className="block text-xs font-semibold text-slate-300">
                Subject
              </label>
              <input
                id="contact-subject"
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Role inquiry, accounting consultation, or interview"
                className="mt-2 w-full rounded-xl border border-white/12 bg-[#050A18]/80 px-4 py-3 text-sm text-white placeholder-slate-500 transition-colors focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div className="mt-5">
              <label htmlFor="contact-message" className="block text-xs font-semibold text-slate-300">
                Message
              </label>
              <textarea
                id="contact-message"
                rows={5}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your message here..."
                className="mt-2 w-full rounded-xl border border-white/12 bg-[#050A18]/80 px-4 py-3 text-sm text-white placeholder-slate-500 transition-colors focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div className="mt-6 flex items-center justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-950/50 transition-all hover:brightness-110 disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-cyan-400"
              >
                <Send className="h-4 w-4" aria-hidden="true" />
                <span>{submitting ? 'Sending...' : 'Send Message'}</span>
              </button>
            </div>
          </motion.form>
        </div>
      </div>
    </section>
  );
}
