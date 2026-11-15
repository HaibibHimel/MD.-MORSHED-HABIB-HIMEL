import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Plus, RotateCcw, Save, Trash2, Upload } from 'lucide-react';
import { updateAdminProfile, uploadProfileImage } from '@/src/lib/api';
import { resolveProfileImage } from '@/src/lib/defaultAssets';
import type { LanguageItem, PortfolioData, PortfolioProfile } from '@/src/types/portfolio';

interface AdminProfileEditorProps {
  profile: PortfolioProfile;
  onUpdated: (data: PortfolioData) => void;
  onNotify: (msg: string, type?: 'success' | 'error') => void;
  onRefreshOverview: () => void;
}

export function AdminProfileEditor({
  profile,
  onUpdated,
  onNotify,
  onRefreshOverview,
}: AdminProfileEditorProps) {
  const [form, setForm] = useState({
    full_name: profile.full_name,
    title_line: profile.title_line,
    headline: profile.headline,
    short_intro: profile.short_intro,
    profession: profile.profession,
    about_location: profile.about_location,
    about_description: profile.about_description,
    profile_image_url: profile.profile_image_url,
    contact_email: profile.contact_email,
    contact_phone: profile.contact_phone,
    contact_location: profile.contact_location,
  });

  const [languages, setLanguages] = useState<LanguageItem[]>(profile.languages);
  const [interests, setInterests] = useState<string[]>(profile.interests);
  const [newInterest, setNewInterest] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const handlePhotoUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      onNotify('Please select a JPG, PNG, or WebP image.', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      onNotify('Image must be smaller than 5 MB.', 'error');
      return;
    }

    setUploadingPhoto(true);
    try {
      const dataBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error('Failed to read image file.'));
        reader.readAsDataURL(file);
      });
      const res = await uploadProfileImage({
        filename: file.name,
        mimeType: file.type,
        dataBase64,
      });
      setForm((prev) => ({ ...prev, profile_image_url: res.profile_image_url }));
      onNotify('Profile photo updated successfully.');
      onRefreshOverview();
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Photo upload failed.', 'error');
    } finally {
      setUploadingPhoto(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await updateAdminProfile({
        ...form,
        languages: languages.filter((l) => l.language.trim() && l.level.trim()),
        interests: interests.map((i) => i.trim()).filter(Boolean),
      });
      onUpdated(updated);
      onRefreshOverview();
      onNotify('Profile, About, and Contact details saved.');
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Failed to save profile.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Profile Photo Card */}
      <div className="rounded-xl border border-white/10 bg-[#0A132C]/80 p-6">
        <h3 className="font-display text-base font-bold text-white">Profile Portrait</h3>
        <p className="mt-1 text-xs text-slate-400">
          Upload a new JPG, PNG, or WebP portrait (max 5 MB) or restore the default studio portrait.
        </p>

        <div className="mt-5 flex flex-col items-start gap-6 sm:flex-row sm:items-center">
          <img
            src={resolveProfileImage(form.profile_image_url)}
            alt="Profile preview"
            referrerPolicy="no-referrer"
            className="h-28 w-24 rounded-xl border border-white/15 object-cover object-top"
          />
          <div className="flex flex-wrap items-center gap-3">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-blue-500">
              <Upload className="h-4 w-4" aria-hidden="true" />
              <span>{uploadingPhoto ? 'Uploading...' : 'Upload New Photo'}</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePhotoUpload}
                disabled={uploadingPhoto}
                className="sr-only"
              />
            </label>

            {form.profile_image_url !== 'default:portrait' && (
              <button
                type="button"
                onClick={() => setForm((p) => ({ ...p, profile_image_url: 'default:portrait' }))}
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 px-3.5 py-2.5 text-xs font-semibold text-slate-300 hover:bg-white/5 hover:text-white"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Restore Default</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Hero & Personal Info */}
      <div className="rounded-xl border border-white/10 bg-[#0A132C]/80 p-6">
        <h3 className="font-display text-base font-bold text-white">Hero &amp; Personal Information</h3>
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-slate-300">Full Name</label>
            <input
              type="text"
              required
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              className="mt-1.5 w-full rounded-xl border border-white/12 bg-[#050A18] px-3.5 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300">Profession</label>
            <input
              type="text"
              required
              value={form.profession}
              onChange={(e) => setForm({ ...form, profession: e.target.value })}
              className="mt-1.5 w-full rounded-xl border border-white/12 bg-[#050A18] px-3.5 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-300">Title Line</label>
            <input
              type="text"
              required
              value={form.title_line}
              onChange={(e) => setForm({ ...form, title_line: e.target.value })}
              className="mt-1.5 w-full rounded-xl border border-white/12 bg-[#050A18] px-3.5 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-300">Hero Headline</label>
            <input
              type="text"
              required
              value={form.headline}
              onChange={(e) => setForm({ ...form, headline: e.target.value })}
              className="mt-1.5 w-full rounded-xl border border-white/12 bg-[#050A18] px-3.5 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-300">Short Introduction</label>
            <textarea
              rows={3}
              required
              value={form.short_intro}
              onChange={(e) => setForm({ ...form, short_intro: e.target.value })}
              className="mt-1.5 w-full rounded-xl border border-white/12 bg-[#050A18] px-3.5 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* About Me, Languages & Interests */}
      <div className="rounded-xl border border-white/10 bg-[#0A132C]/80 p-6">
        <h3 className="font-display text-base font-bold text-white">About Me, Languages &amp; Interests</h3>
        <div className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300">Full Address / Location</label>
            <input
              type="text"
              required
              value={form.about_location}
              onChange={(e) => setForm({ ...form, about_location: e.target.value })}
              className="mt-1.5 w-full rounded-xl border border-white/12 bg-[#050A18] px-3.5 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300">About Me Description</label>
            <textarea
              rows={4}
              required
              value={form.about_description}
              onChange={(e) => setForm({ ...form, about_description: e.target.value })}
              className="mt-1.5 w-full rounded-xl border border-white/12 bg-[#050A18] px-3.5 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 gap-6 pt-2 md:grid-cols-2">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">Languages</span>
                <button
                  type="button"
                  onClick={() => setLanguages((prev) => [...prev, { language: '', level: '' }])}
                  className="inline-flex items-center gap-1 text-xs font-medium text-cyan-300 hover:text-cyan-200"
                >
                  <Plus className="h-3.5 w-3.5" /> Add
                </button>
              </div>
              <div className="mt-2.5 space-y-2">
                {languages.map((lang, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Language"
                      value={lang.language}
                      onChange={(e) => {
                        const copy = [...languages];
                        copy[idx] = { ...copy[idx], language: e.target.value };
                        setLanguages(copy);
                      }}
                      className="w-1/3 rounded-lg border border-white/12 bg-[#050A18] px-3 py-2 text-xs text-white"
                    />
                    <input
                      type="text"
                      placeholder="Proficiency"
                      value={lang.level}
                      onChange={(e) => {
                        const copy = [...languages];
                        copy[idx] = { ...copy[idx], level: e.target.value };
                        setLanguages(copy);
                      }}
                      className="flex-1 rounded-lg border border-white/12 bg-[#050A18] px-3 py-2 text-xs text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setLanguages((prev) => prev.filter((_, i) => i !== idx))}
                      aria-label="Remove language"
                      className="rounded-lg p-2 text-slate-400 hover:bg-rose-500/10 hover:text-rose-300"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-300">Interests</span>
              <div className="mt-2.5 flex gap-2">
                <input
                  type="text"
                  value={newInterest}
                  onChange={(e) => setNewInterest(e.target.value)}
                  placeholder="Add an interest"
                  className="flex-1 rounded-lg border border-white/12 bg-[#050A18] px-3 py-2 text-xs text-white"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!newInterest.trim()) return;
                    setInterests((prev) => [...prev, newInterest.trim()]);
                    setNewInterest('');
                  }}
                  className="rounded-lg border border-cyan-400/30 bg-cyan-500/15 px-3 py-2 text-xs font-semibold text-cyan-200 hover:bg-cyan-500/25"
                >
                  Add
                </button>
              </div>
              <div className="mt-3 space-y-1.5">
                {interests.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-lg border border-white/10 bg-[#050A18]/60 px-3 py-1.5 text-xs text-slate-200"
                  >
                    <span>{item}</span>
                    <button
                      type="button"
                      onClick={() => setInterests((prev) => prev.filter((_, i) => i !== idx))}
                      aria-label={`Remove ${item}`}
                      className="text-slate-400 hover:text-rose-300"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Info */}
      <div className="rounded-xl border border-white/10 bg-[#0A132C]/80 p-6">
        <h3 className="font-display text-base font-bold text-white">Public Contact Details</h3>
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300">Contact Email</label>
            <input
              type="email"
              required
              value={form.contact_email}
              onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
              className="mt-1.5 w-full rounded-xl border border-white/12 bg-[#050A18] px-3.5 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300">Contact Phone</label>
            <input
              type="text"
              required
              value={form.contact_phone}
              onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
              className="mt-1.5 w-full rounded-xl border border-white/12 bg-[#050A18] px-3.5 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300">Contact Location</label>
            <input
              type="text"
              required
              value={form.contact_location}
              onChange={(e) => setForm({ ...form, contact_location: e.target.value })}
              className="mt-1.5 w-full rounded-xl border border-white/12 bg-[#050A18] px-3.5 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg hover:brightness-110 disabled:opacity-60"
        >
          <Save className="h-4 w-4" aria-hidden="true" />
          <span>{saving ? 'Saving Changes...' : 'Save Profile Changes'}</span>
        </button>
      </div>
    </form>
  );
}
