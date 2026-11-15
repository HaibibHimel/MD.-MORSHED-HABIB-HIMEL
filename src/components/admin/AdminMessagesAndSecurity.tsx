import { useMemo, useState, type FormEvent } from 'react';
import { Archive, Check, KeyRound, Mail, MailOpen, Search, Trash2 } from 'lucide-react';
import { adminMutate } from '@/src/lib/api';
import type { ContactMessageItem } from '@/src/types/portfolio';

interface MessagesInboxProps {
  messages: ContactMessageItem[];
  onMessagesChange: (messages: ContactMessageItem[]) => void;
  onRefreshOverview: () => void;
  onNotify: (msg: string, type?: 'success' | 'error') => void;
  onRequestConfirm: (title: string, description: string, action: () => Promise<void>) => void;
}

export function MessagesInbox({
  messages,
  onMessagesChange,
  onRefreshOverview,
  onNotify,
  onRequestConfirm,
}: MessagesInboxProps) {
  const [filter, setFilter] = useState<'all' | 'unread' | 'read' | 'archived'>('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return messages.filter((m) => {
      if (filter !== 'all' && m.status !== filter) return false;
      if (!q) return true;
      return (
        m.sender_name.toLowerCase().includes(q) ||
        m.sender_email.toLowerCase().includes(q) ||
        m.subject.toLowerCase().includes(q) ||
        m.message.toLowerCase().includes(q)
      );
    });
  }, [messages, filter, search]);

  const updateStatus = async (id: number, status: 'unread' | 'read' | 'archived') => {
    try {
      const res = await adminMutate<{ messages: ContactMessageItem[] }>(
        `/api/admin/messages/${id}/status`,
        'PATCH',
        { status }
      );
      onMessagesChange(res.messages);
      onRefreshOverview();
      onNotify(`Message marked as ${status}.`);
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Status update failed.', 'error');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1 rounded-xl border border-white/10 bg-[#0A132C] p-1">
          {(['all', 'unread', 'read', 'archived'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-medium capitalize transition-colors ${
                filter === tab
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search messages..."
            className="w-full rounded-xl border border-white/12 bg-[#0A132C] py-2 pr-4 pl-10 text-xs text-white placeholder-slate-400 focus:border-cyan-400 focus:outline-none"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/15 bg-[#0A132C]/50 p-12 text-center">
          <Mail className="mx-auto h-8 w-8 text-slate-500" aria-hidden="true" />
          <p className="mt-3 text-sm font-semibold text-white">No messages match this view</p>
          <p className="mt-1 text-xs text-slate-400">
            Inquiries submitted through your public contact form appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((msg) => (
            <div
              key={msg.id}
              className={`rounded-xl border p-5 transition-colors ${
                msg.status === 'unread'
                  ? 'border-cyan-400/40 bg-[#0D1A3C]/85'
                  : 'border-white/10 bg-[#0A132C]/80'
              }`}
            >
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                    <span className="font-semibold text-white">{msg.sender_name}</span>
                    <span>·</span>
                    <a href={`mailto:${msg.sender_email}`} className="text-cyan-300 hover:underline">
                      {msg.sender_email}
                    </a>
                    <span>·</span>
                    <time className="font-mono">{new Date(msg.created_at).toLocaleString()}</time>
                    <span>·</span>
                    <span className="capitalize text-indigo-300">{msg.status}</span>
                  </div>
                  <h4 className="mt-2 font-display text-base font-bold text-white">{msg.subject}</h4>
                  <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap text-slate-200">
                    {msg.message}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-1.5">
                  {msg.status !== 'read' && (
                    <button
                      type="button"
                      onClick={() => updateStatus(msg.id, 'read')}
                      title="Mark as read"
                      className="rounded-lg border border-white/10 p-2 text-emerald-300 hover:bg-emerald-500/15"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  )}
                  {msg.status === 'read' && (
                    <button
                      type="button"
                      onClick={() => updateStatus(msg.id, 'unread')}
                      title="Mark as unread"
                      className="rounded-lg border border-white/10 p-2 text-slate-300 hover:bg-white/10"
                    >
                      <MailOpen className="h-4 w-4" />
                    </button>
                  )}
                  {msg.status !== 'archived' && (
                    <button
                      type="button"
                      onClick={() => updateStatus(msg.id, 'archived')}
                      title="Archive"
                      className="rounded-lg border border-white/10 p-2 text-slate-300 hover:bg-white/10"
                    >
                      <Archive className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      onRequestConfirm(
                        'Delete Message',
                        `Permanently delete message from ${msg.sender_name}?`,
                        async () => {
                          const res = await adminMutate<{ messages: ContactMessageItem[] }>(
                            `/api/admin/messages/${msg.id}`,
                            'DELETE'
                          );
                          onMessagesChange(res.messages);
                          onRefreshOverview();
                          onNotify('Message deleted.');
                        }
                      )
                    }
                    title="Delete message"
                    className="rounded-lg border border-rose-500/20 p-2 text-rose-300 hover:bg-rose-500/15"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface SecuritySettingsProps {
  currentUsername: string;
  currentEmail: string;
  onNotify: (msg: string, type?: 'success' | 'error') => void;
  onCredentialsUpdated: (username: string, email: string) => void;
}

export function SecuritySettings({
  currentUsername,
  currentEmail,
  onNotify,
  onCredentialsUpdated,
}: SecuritySettingsProps) {
  const [newUsername, setNewUsername] = useState(currentUsername);
  const [newEmail, setNewEmail] = useState(currentEmail);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      onNotify('Enter your current password to verify.', 'error');
      return;
    }
    if (newPassword && newPassword !== confirmPassword) {
      onNotify('New password and confirmation do not match.', 'error');
      return;
    }

    setSaving(true);
    try {
      const res = await adminMutate<{ ok: boolean; username: string; email: string }>(
        '/api/admin/security/password',
        'PUT',
        {
          currentPassword,
          newPassword: newPassword || undefined,
          newUsername: newUsername.trim(),
          newEmail: newEmail.trim(),
        }
      );
      onCredentialsUpdated(res.username, res.email);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      onNotify('Administrator security credentials updated.');
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Security update failed.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-xl space-y-5 rounded-xl border border-white/10 bg-[#0A132C]/80 p-6"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-500/10 text-cyan-300">
          <KeyRound className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <h3 className="font-display text-base font-bold text-white">Account &amp; Password Security</h3>
          <p className="text-xs text-slate-400">Passwords are hashed server-side using salted scrypt.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-semibold text-slate-300">User ID</label>
          <input
            type="text"
            required
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-white/12 bg-[#050A18] px-3.5 py-2.5 text-sm text-white"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-300">Administrator Email</label>
          <input
            type="email"
            required
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-white/12 bg-[#050A18] px-3.5 py-2.5 text-sm text-white"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-300">Current Password</label>
        <input
          type="password"
          required
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className="mt-1.5 w-full rounded-xl border border-white/12 bg-[#050A18] px-3.5 py-2.5 text-sm text-white"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-semibold text-slate-300">
            New Password (optional)
          </label>
          <input
            type="password"
            minLength={8}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Min 8 characters"
            className="mt-1.5 w-full rounded-xl border border-white/12 bg-[#050A18] px-3.5 py-2.5 text-sm text-white"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-300">Confirm New Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-white/12 bg-[#050A18] px-3.5 py-2.5 text-sm text-white"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
      >
        {saving ? 'Updating...' : 'Update Credentials'}
      </button>
    </form>
  );
}
