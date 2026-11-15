import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Download, Edit3, FileText, Plus, RotateCcw, Trash2, Upload } from 'lucide-react';
import { adminMutate, downloadCvFile, resetCvToAuto, uploadCvPdf } from '@/src/lib/api';
import { SKILL_ICON_OPTIONS, renderSkillIcon } from '@/src/components/portfolio/IconMap';
import type {
  CertificationItem,
  EducationItem,
  ExperienceItem,
  PortfolioData,
  SkillItem,
  SocialLinkItem,
} from '@/src/types/portfolio';

interface ManagerProps {
  data: PortfolioData;
  onReloadPortfolio: () => Promise<void>;
  onRefreshOverview: () => void;
  onNotify: (msg: string, type?: 'success' | 'error') => void;
  onRequestConfirm: (title: string, description: string, action: () => Promise<void>) => void;
}

// ============================================================================
// SKILLS MANAGER
// ============================================================================
export function SkillsManager({
  data,
  onReloadPortfolio,
  onRefreshOverview,
  onNotify,
  onRequestConfirm,
}: ManagerProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Core Accounting');
  const [focusLabel, setFocusLabel] = useState('Core Competency');
  const [iconKey, setIconKey] = useState<string>('Landmark');
  const [description, setDescription] = useState('');
  const [sortOrder, setSortOrder] = useState(data.skills.length + 1);
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setCategory('Core Accounting');
    setFocusLabel('Core Competency');
    setIconKey('Landmark');
    setDescription('');
    setSortOrder(data.skills.length + 1);
  };

  const startEdit = (skill: SkillItem) => {
    setEditingId(skill.id);
    setName(skill.name);
    setCategory(skill.category);
    setFocusLabel(skill.focus_label);
    setIconKey(skill.icon_key);
    setDescription(skill.description);
    setSortOrder(skill.sort_order);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name,
        category,
        focus_label: focusLabel,
        icon_key: iconKey,
        description,
        sort_order: sortOrder,
      };
      if (editingId) {
        await adminMutate(`/api/admin/skills/${editingId}`, 'PUT', payload);
        onNotify('Skill updated.');
      } else {
        await adminMutate('/api/admin/skills', 'POST', payload);
        onNotify('Skill added.');
      }
      resetForm();
      await onReloadPortfolio();
      onRefreshOverview();
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Failed to save skill.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-xl border border-white/10 bg-[#0A132C]/80 p-6 lg:col-span-5"
      >
        <h3 className="font-display text-base font-bold text-white">
          {editingId ? 'Edit Skill' : 'Add New Skill'}
        </h3>
        <div>
          <label className="block text-xs font-semibold text-slate-300">Skill Name</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Financial Accounting"
            className="mt-1.5 w-full rounded-xl border border-white/12 bg-[#050A18] px-3.5 py-2.5 text-sm text-white"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300">Category</label>
            <input
              type="text"
              required
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-white/12 bg-[#050A18] px-3.5 py-2.5 text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300">Focus Label</label>
            <input
              type="text"
              required
              value={focusLabel}
              onChange={(e) => setFocusLabel(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-white/12 bg-[#050A18] px-3.5 py-2.5 text-sm text-white"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300">Icon</label>
            <select
              value={iconKey}
              onChange={(e) => setIconKey(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-white/12 bg-[#050A18] px-3 py-2.5 text-sm text-white"
            >
              {SKILL_ICON_OPTIONS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300">Sort Order</label>
            <input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
              className="mt-1.5 w-full rounded-xl border border-white/12 bg-[#050A18] px-3.5 py-2.5 text-sm text-white"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-300">Description</label>
          <textarea
            rows={3}
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-white/12 bg-[#050A18] px-3.5 py-2.5 text-sm text-white"
          />
        </div>

        <div className="flex items-center gap-3 pt-1">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
          >
            <Plus className="h-4 w-4" />
            <span>{saving ? 'Saving...' : editingId ? 'Update Skill' : 'Add Skill'}</span>
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-xl border border-white/15 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-white/5"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="space-y-3 lg:col-span-7">
        {data.skills.map((skill) => (
          <div
            key={skill.id}
            className="flex items-start justify-between gap-4 rounded-xl border border-white/10 bg-[#0A132C]/80 p-5"
          >
            <div className="flex items-start gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-cyan-400/20 bg-cyan-500/10 text-cyan-300">
                {renderSkillIcon(skill.icon_key, 'h-4 w-4')}
              </div>
              <div>
                <h4 className="font-display text-sm font-bold text-white">{skill.name}</h4>
                <p className="text-xs text-cyan-300">
                  {skill.category} · {skill.focus_label}
                </p>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-300">{skill.description}</p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              <button
                type="button"
                onClick={() => startEdit(skill)}
                aria-label={`Edit ${skill.name}`}
                className="rounded-lg border border-white/10 p-2 text-slate-300 hover:bg-white/10 hover:text-white"
              >
                <Edit3 className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() =>
                  onRequestConfirm('Delete Skill', `Remove "${skill.name}" from your portfolio?`, async () => {
                    await adminMutate(`/api/admin/skills/${skill.id}`, 'DELETE');
                    await onReloadPortfolio();
                    onRefreshOverview();
                    onNotify('Skill deleted.');
                  })
                }
                aria-label={`Delete ${skill.name}`}
                className="rounded-lg border border-rose-500/20 p-2 text-rose-300 hover:bg-rose-500/15"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// EXPERIENCE MANAGER
// ============================================================================
export function ExperienceManager({
  data,
  onReloadPortfolio,
  onRefreshOverview,
  onNotify,
  onRequestConfirm,
}: ManagerProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [role, setRole] = useState('');
  const [company, setCompany] = useState('');
  const [period, setPeriod] = useState('');
  const [location, setLocation] = useState('');
  const [isCurrent, setIsCurrent] = useState(false);
  const [responsibilitiesText, setResponsibilitiesText] = useState('');
  const [sortOrder, setSortOrder] = useState(1);
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setEditingId(null);
    setRole('');
    setCompany('');
    setPeriod('');
    setLocation('');
    setIsCurrent(false);
    setResponsibilitiesText('');
    setSortOrder(1);
  };

  const startEdit = (exp: ExperienceItem) => {
    setEditingId(exp.id);
    setRole(exp.role);
    setCompany(exp.company);
    setPeriod(exp.period);
    setLocation(exp.location);
    setIsCurrent(exp.is_current);
    setResponsibilitiesText(exp.responsibilities.join('\n'));
    setSortOrder(exp.sort_order);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        role,
        company,
        period,
        location,
        is_current: isCurrent,
        sort_order: sortOrder,
        responsibilities: responsibilitiesText
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean),
      };
      if (editingId) {
        await adminMutate(`/api/admin/experiences/${editingId}`, 'PUT', payload);
        onNotify('Work experience updated.');
      } else {
        await adminMutate('/api/admin/experiences', 'POST', payload);
        onNotify('Work experience added.');
      }
      resetForm();
      await onReloadPortfolio();
      onRefreshOverview();
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Failed to save experience.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-xl border border-white/10 bg-[#0A132C]/80 p-6 lg:col-span-5"
      >
        <h3 className="font-display text-base font-bold text-white">
          {editingId ? 'Edit Work Experience' : 'Add Work Experience'}
        </h3>
        <div>
          <label className="block text-xs font-semibold text-slate-300">Role / Job Title</label>
          <input
            type="text"
            required
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="e.g. Accountant"
            className="mt-1.5 w-full rounded-xl border border-white/12 bg-[#050A18] px-3.5 py-2.5 text-sm text-white"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-300">Organization</label>
          <input
            type="text"
            required
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-white/12 bg-[#050A18] px-3.5 py-2.5 text-sm text-white"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300">Period</label>
            <input
              type="text"
              required
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              placeholder="May 2026 – Aug 2026"
              className="mt-1.5 w-full rounded-xl border border-white/12 bg-[#050A18] px-3.5 py-2.5 text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300">Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-white/12 bg-[#050A18] px-3.5 py-2.5 text-sm text-white"
            />
          </div>
        </div>
        <div className="flex items-center justify-between gap-4">
          <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-300">
            <input
              type="checkbox"
              checked={isCurrent}
              onChange={(e) => setIsCurrent(e.target.checked)}
              className="h-4 w-4 rounded border-white/20 bg-[#050A18]"
            />
            <span>Current Position</span>
          </label>
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400">Order</label>
            <input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
              className="w-16 rounded-lg border border-white/12 bg-[#050A18] px-2.5 py-1.5 text-xs text-white"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-300">
            Responsibilities (one per line)
          </label>
          <textarea
            rows={5}
            required
            value={responsibilitiesText}
            onChange={(e) => setResponsibilitiesText(e.target.value)}
            placeholder="Managed daily cash collections&#10;Reconciled sales registers"
            className="mt-1.5 w-full rounded-xl border border-white/12 bg-[#050A18] px-3.5 py-2.5 text-sm text-white"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
          >
            <Plus className="h-4 w-4" />
            <span>{saving ? 'Saving...' : editingId ? 'Update Role' : 'Add Role'}</span>
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-xl border border-white/15 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-white/5"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="space-y-4 lg:col-span-7">
        {data.experiences.map((exp) => (
          <div key={exp.id} className="rounded-xl border border-white/10 bg-[#0A132C]/80 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-xs text-cyan-300">
                  {exp.period} {exp.location ? `· ${exp.location}` : ''}
                </p>
                <h4 className="mt-1 font-display text-base font-bold text-white">{exp.role}</h4>
                <p className="text-xs font-medium text-blue-200">{exp.company}</p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => startEdit(exp)}
                  aria-label={`Edit ${exp.role}`}
                  className="rounded-lg border border-white/10 p-2 text-slate-300 hover:bg-white/10 hover:text-white"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onRequestConfirm(
                      'Delete Experience',
                      `Remove "${exp.role}" at ${exp.company}?`,
                      async () => {
                        await adminMutate(`/api/admin/experiences/${exp.id}`, 'DELETE');
                        await onReloadPortfolio();
                        onRefreshOverview();
                        onNotify('Experience entry removed.');
                      }
                    )
                  }
                  aria-label={`Delete ${exp.role}`}
                  className="rounded-lg border border-rose-500/20 p-2 text-rose-300 hover:bg-rose-500/15"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <ul className="mt-3 list-disc space-y-1 pl-4 text-xs text-slate-300">
              {exp.responsibilities.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// EDUCATION & CERTIFICATES MANAGER
// ============================================================================
export function CredentialsManager({
  data,
  onReloadPortfolio,
  onRefreshOverview,
  onNotify,
  onRequestConfirm,
}: ManagerProps) {
  const [eduEditId, setEduEditId] = useState<number | null>(null);
  const [eduForm, setEduForm] = useState({
    degree: '',
    institution: '',
    university: '',
    period: '',
    cgpa: '',
  });

  const [certEditId, setCertEditId] = useState<number | null>(null);
  const [certForm, setCertForm] = useState({
    title: '',
    issuer: '',
    period: '',
    credential_note: '',
  });

  const startEditEdu = (edu: EducationItem) => {
    setEduEditId(edu.id);
    setEduForm({
      degree: edu.degree,
      institution: edu.institution,
      university: edu.university,
      period: edu.period,
      cgpa: edu.cgpa,
    });
  };

  const submitEdu = async (e: FormEvent) => {
    e.preventDefault();
    try {
      if (eduEditId) {
        await adminMutate(`/api/admin/education/${eduEditId}`, 'PUT', eduForm);
        onNotify('Education updated.');
      } else {
        await adminMutate('/api/admin/education', 'POST', eduForm);
        onNotify('Education added.');
      }
      setEduEditId(null);
      setEduForm({ degree: '', institution: '', university: '', period: '', cgpa: '' });
      await onReloadPortfolio();
      onRefreshOverview();
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Failed to save education.', 'error');
    }
  };

  const startEditCert = (cert: CertificationItem) => {
    setCertEditId(cert.id);
    setCertForm({
      title: cert.title,
      issuer: cert.issuer,
      period: cert.period,
      credential_note: cert.credential_note,
    });
  };

  const submitCert = async (e: FormEvent) => {
    e.preventDefault();
    try {
      if (certEditId) {
        await adminMutate(`/api/admin/certifications/${certEditId}`, 'PUT', certForm);
        onNotify('Certificate updated.');
      } else {
        await adminMutate('/api/admin/certifications', 'POST', certForm);
        onNotify('Certificate added.');
      }
      setCertEditId(null);
      setCertForm({ title: '', issuer: '', period: '', credential_note: '' });
      await onReloadPortfolio();
      onRefreshOverview();
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Failed to save certificate.', 'error');
    }
  };

  return (
    <div className="space-y-8">
      {/* Education Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <form
          onSubmit={submitEdu}
          className="space-y-3.5 rounded-xl border border-white/10 bg-[#0A132C]/80 p-6 lg:col-span-5"
        >
          <h3 className="font-display text-base font-bold text-white">
            {eduEditId ? 'Edit Education' : 'Add Education'}
          </h3>
          <input
            type="text"
            required
            placeholder="Degree (e.g. BBA – Accounting)"
            value={eduForm.degree}
            onChange={(e) => setEduForm({ ...eduForm, degree: e.target.value })}
            className="w-full rounded-xl border border-white/12 bg-[#050A18] px-3.5 py-2.5 text-sm text-white"
          />
          <input
            type="text"
            required
            placeholder="Institution"
            value={eduForm.institution}
            onChange={(e) => setEduForm({ ...eduForm, institution: e.target.value })}
            className="w-full rounded-xl border border-white/12 bg-[#050A18] px-3.5 py-2.5 text-sm text-white"
          />
          <input
            type="text"
            placeholder="University / Board"
            value={eduForm.university}
            onChange={(e) => setEduForm({ ...eduForm, university: e.target.value })}
            className="w-full rounded-xl border border-white/12 bg-[#050A18] px-3.5 py-2.5 text-sm text-white"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              required
              placeholder="Period"
              value={eduForm.period}
              onChange={(e) => setEduForm({ ...eduForm, period: e.target.value })}
              className="rounded-xl border border-white/12 bg-[#050A18] px-3.5 py-2.5 text-sm text-white"
            />
            <input
              type="text"
              placeholder="CGPA"
              value={eduForm.cgpa}
              onChange={(e) => setEduForm({ ...eduForm, cgpa: e.target.value })}
              className="rounded-xl border border-white/12 bg-[#050A18] px-3.5 py-2.5 text-sm text-white"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500"
            >
              {eduEditId ? 'Update Education' : 'Add Education'}
            </button>
            {eduEditId && (
              <button
                type="button"
                onClick={() => {
                  setEduEditId(null);
                  setEduForm({ degree: '', institution: '', university: '', period: '', cgpa: '' });
                }}
                className="rounded-xl border border-white/15 px-4 py-2 text-xs text-slate-300"
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        <div className="space-y-3 lg:col-span-7">
          {data.education.map((edu) => (
            <div
              key={edu.id}
              className="flex items-start justify-between gap-4 rounded-xl border border-white/10 bg-[#0A132C]/80 p-5"
            >
              <div>
                <h4 className="font-display text-sm font-bold text-white">{edu.degree}</h4>
                <p className="mt-1 text-xs text-slate-200">
                  {edu.institution} {edu.university ? `· ${edu.university}` : ''}
                </p>
                <p className="mt-1 font-mono text-xs text-cyan-300">
                  {edu.period} {edu.cgpa ? `· ${edu.cgpa}` : ''}
                </p>
              </div>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => startEditEdu(edu)}
                  aria-label={`Edit ${edu.degree}`}
                  className="rounded-lg border border-white/10 p-2 text-slate-300 hover:bg-white/10"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onRequestConfirm('Delete Education', `Remove "${edu.degree}"?`, async () => {
                      await adminMutate(`/api/admin/education/${edu.id}`, 'DELETE');
                      await onReloadPortfolio();
                      onRefreshOverview();
                      onNotify('Education record deleted.');
                    })
                  }
                  aria-label={`Delete ${edu.degree}`}
                  className="rounded-lg border border-rose-500/20 p-2 text-rose-300 hover:bg-rose-500/15"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Certifications Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <form
          onSubmit={submitCert}
          className="space-y-3.5 rounded-xl border border-white/10 bg-[#0A132C]/80 p-6 lg:col-span-5"
        >
          <h3 className="font-display text-base font-bold text-white">
            {certEditId ? 'Edit Certificate' : 'Add Certificate'}
          </h3>
          <input
            type="text"
            required
            placeholder="Certificate Title"
            value={certForm.title}
            onChange={(e) => setCertForm({ ...certForm, title: e.target.value })}
            className="w-full rounded-xl border border-white/12 bg-[#050A18] px-3.5 py-2.5 text-sm text-white"
          />
          <input
            type="text"
            required
            placeholder="Issuing Organization"
            value={certForm.issuer}
            onChange={(e) => setCertForm({ ...certForm, issuer: e.target.value })}
            className="w-full rounded-xl border border-white/12 bg-[#050A18] px-3.5 py-2.5 text-sm text-white"
          />
          <input
            type="text"
            required
            placeholder="Period (e.g. Oct 2026 – Nov 2026)"
            value={certForm.period}
            onChange={(e) => setCertForm({ ...certForm, period: e.target.value })}
            className="w-full rounded-xl border border-white/12 bg-[#050A18] px-3.5 py-2.5 text-sm text-white"
          />
          <textarea
            rows={3}
            placeholder="Summary / Credential notes"
            value={certForm.credential_note}
            onChange={(e) => setCertForm({ ...certForm, credential_note: e.target.value })}
            className="w-full rounded-xl border border-white/12 bg-[#050A18] px-3.5 py-2.5 text-sm text-white"
          />
          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500"
            >
              {certEditId ? 'Update Certificate' : 'Add Certificate'}
            </button>
            {certEditId && (
              <button
                type="button"
                onClick={() => {
                  setCertEditId(null);
                  setCertForm({ title: '', issuer: '', period: '', credential_note: '' });
                }}
                className="rounded-xl border border-white/15 px-4 py-2 text-xs text-slate-300"
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        <div className="space-y-3 lg:col-span-7">
          {data.certifications.map((cert) => (
            <div
              key={cert.id}
              className="flex items-start justify-between gap-4 rounded-xl border border-white/10 bg-[#0A132C]/80 p-5"
            >
              <div>
                <h4 className="font-display text-sm font-bold text-white">{cert.title}</h4>
                <p className="mt-1 text-xs text-blue-200">{cert.issuer}</p>
                <p className="mt-1 font-mono text-xs text-cyan-300">{cert.period}</p>
                {cert.credential_note && (
                  <p className="mt-1.5 text-xs text-slate-300">{cert.credential_note}</p>
                )}
              </div>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => startEditCert(cert)}
                  aria-label={`Edit ${cert.title}`}
                  className="rounded-lg border border-white/10 p-2 text-slate-300 hover:bg-white/10"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onRequestConfirm('Delete Certificate', `Remove "${cert.title}"?`, async () => {
                      await adminMutate(`/api/admin/certifications/${cert.id}`, 'DELETE');
                      await onReloadPortfolio();
                      onRefreshOverview();
                      onNotify('Certificate removed.');
                    })
                  }
                  aria-label={`Delete ${cert.title}`}
                  className="rounded-lg border border-rose-500/20 p-2 text-rose-300 hover:bg-rose-500/15"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SOCIAL LINKS & CV PDF MANAGER
// ============================================================================
export function SocialsAndCvManager({
  data,
  onReloadPortfolio,
  onRefreshOverview,
  onNotify,
  onRequestConfirm,
}: ManagerProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [platform, setPlatform] = useState('');
  const [label, setLabel] = useState('');
  const [url, setUrl] = useState('');
  const [uploadingCv, setUploadingCv] = useState(false);

  const handleSocialSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const payload = { platform, label, url };
      if (editingId) {
        await adminMutate(`/api/admin/socials/${editingId}`, 'PUT', payload);
        onNotify('Social link updated.');
      } else {
        await adminMutate('/api/admin/socials', 'POST', payload);
        onNotify('Social link added.');
      }
      setEditingId(null);
      setPlatform('');
      setLabel('');
      setUrl('');
      await onReloadPortfolio();
      onRefreshOverview();
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Failed to save link.', 'error');
    }
  };

  const startEditSocial = (s: SocialLinkItem) => {
    setEditingId(s.id);
    setPlatform(s.platform);
    setLabel(s.label);
    setUrl(s.url);
  };

  const handleCvUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      onNotify('Please select a PDF document (.pdf).', 'error');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      onNotify('PDF must be smaller than 10 MB.', 'error');
      return;
    }

    setUploadingCv(true);
    try {
      const dataBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error('Unable to read PDF file.'));
        reader.readAsDataURL(file);
      });
      await uploadCvPdf({
        filename: file.name,
        mimeType: file.type,
        dataBase64,
      });
      await onReloadPortfolio();
      onRefreshOverview();
      onNotify('CV PDF uploaded and published.');
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'CV upload failed.', 'error');
    } finally {
      setUploadingCv(false);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-8">
      {/* CV PDF Management */}
      <div className="rounded-xl border border-white/10 bg-[#0A132C]/80 p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-cyan-400/25 bg-cyan-500/15 text-cyan-300">
              <FileText className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-white">CV / Resume PDF Management</h3>
              <p className="mt-1 text-xs text-slate-300">
                Active file: <span className="font-mono text-cyan-300">{data.profile.cv_filename}</span>{' '}
                ({data.profile.has_custom_cv ? 'Custom Uploaded PDF' : 'Live Auto-Generated from Portfolio'})
              </p>
              <p className="mt-0.5 text-[11px] text-slate-400">
                Last updated: {new Date(data.profile.cv_updated_at).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => {
                downloadCvFile().catch(() => {});
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-white/5"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              <span>Test Download</span>
            </button>

            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-500">
              <Upload className="h-4 w-4" aria-hidden="true" />
              <span>{uploadingCv ? 'Uploading...' : 'Upload Replacement PDF'}</span>
              <input
                type="file"
                accept="application/pdf"
                onChange={handleCvUpload}
                disabled={uploadingCv}
                className="sr-only"
              />
            </label>

            {data.profile.has_custom_cv && (
              <button
                type="button"
                onClick={async () => {
                  await resetCvToAuto();
                  await onReloadPortfolio();
                  onRefreshOverview();
                  onNotify('Reverted to live auto-generated CV PDF.');
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-amber-400/30 bg-amber-500/10 px-3.5 py-2.5 text-xs font-semibold text-amber-200 hover:bg-amber-500/20"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Use Auto-Generated CV</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Social Links Management */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <form
          onSubmit={handleSocialSubmit}
          className="space-y-4 rounded-xl border border-white/10 bg-[#0A132C]/80 p-6 lg:col-span-5"
        >
          <h3 className="font-display text-base font-bold text-white">
            {editingId ? 'Edit Social Channel' : 'Add Social Channel'}
          </h3>
          <input
            type="text"
            required
            placeholder="Platform (e.g. LinkedIn, Facebook, Email)"
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            className="w-full rounded-xl border border-white/12 bg-[#050A18] px-3.5 py-2.5 text-sm text-white"
          />
          <input
            type="text"
            required
            placeholder="Display Label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-full rounded-xl border border-white/12 bg-[#050A18] px-3.5 py-2.5 text-sm text-white"
          />
          <input
            type="text"
            required
            placeholder="URL (https://..., mailto:..., tel:...)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full rounded-xl border border-white/12 bg-[#050A18] px-3.5 py-2.5 text-sm text-white"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-500"
            >
              {editingId ? 'Update Link' : 'Add Link'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setPlatform('');
                  setLabel('');
                  setUrl('');
                }}
                className="rounded-xl border border-white/15 px-4 py-2.5 text-xs text-slate-300"
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        <div className="space-y-3 lg:col-span-7">
          {data.socialLinks.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-[#0A132C]/80 p-4"
            >
              <div className="min-w-0">
                <p className="text-sm font-bold text-white">{s.platform}</p>
                <p className="truncate text-xs text-slate-400">
                  {s.label} · {s.url}
                </p>
              </div>
              <div className="flex shrink-0 gap-1.5">
                <button
                  type="button"
                  onClick={() => startEditSocial(s)}
                  aria-label={`Edit ${s.platform}`}
                  className="rounded-lg border border-white/10 p-2 text-slate-300 hover:bg-white/10"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onRequestConfirm('Delete Social Link', `Remove ${s.platform} link?`, async () => {
                      await adminMutate(`/api/admin/socials/${s.id}`, 'DELETE');
                      await onReloadPortfolio();
                      onRefreshOverview();
                      onNotify('Social link removed.');
                    })
                  }
                  aria-label={`Delete ${s.platform}`}
                  className="rounded-lg border border-rose-500/20 p-2 text-rose-300 hover:bg-rose-500/15"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
