import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Award,
  Briefcase,
  CheckCircle2,
  ExternalLink,
  FileText,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  Shield,
  Sliders,
  User,
  X,
} from 'lucide-react';
import {
  checkAuthSession,
  fetchAdminMessages,
  fetchAdminOverview,
  fetchPortfolio,
  logoutAdmin,
} from '@/src/lib/api';
import type {
  AdminOverviewData,
  AdminUser,
  ContactMessageItem,
  PortfolioData,
} from '@/src/types/portfolio';
import { AdminLogin } from '@/src/components/admin/AdminLogin';
import { AdminOverview } from '@/src/components/admin/AdminOverview';
import { AdminProfileEditor } from '@/src/components/admin/AdminProfileEditor';
import {
  CredentialsManager,
  ExperienceManager,
  SkillsManager,
  SocialsAndCvManager,
} from '@/src/components/admin/AdminContentManagers';
import {
  MessagesInbox,
  SecuritySettings,
} from '@/src/components/admin/AdminMessagesAndSecurity';
import { ConfirmDialog } from '@/src/components/admin/ConfirmDialog';

type AdminTab =
  | 'overview'
  | 'profile'
  | 'skills'
  | 'experience'
  | 'credentials'
  | 'cv'
  | 'messages'
  | 'security';

const TABS: Array<{ id: AdminTab; label: string; icon: typeof LayoutDashboard }> = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'profile', label: 'Profile & About', icon: User },
  { id: 'skills', label: 'Skills', icon: Sliders },
  { id: 'experience', label: 'Experience', icon: Briefcase },
  { id: 'credentials', label: 'Education & Certs', icon: Award },
  { id: 'cv', label: 'CV PDF & Socials', icon: FileText },
  { id: 'messages', label: 'Messages', icon: Mail },
  { id: 'security', label: 'Security', icon: Shield },
];

export function AdminPage() {
  const [authChecking, setAuthChecking] = useState(true);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [overview, setOverview] = useState<AdminOverviewData | null>(null);
  const [messages, setMessages] = useState<ContactMessageItem[]>([]);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    title: string;
    description: string;
    busy: boolean;
    action: (() => Promise<void>) | null;
  }>({ open: false, title: '', description: '', busy: false, action: null });

  const notify = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => {
      setToast((prev) => (prev?.msg === msg ? null : prev));
    }, 4000);
  }, []);

  const loadAllAdminData = useCallback(async () => {
    const [p, o, m] = await Promise.all([
      fetchPortfolio(),
      fetchAdminOverview(),
      fetchAdminMessages(),
    ]);
    setPortfolio(p);
    setOverview(o);
    setMessages(m.messages);
  }, []);

  const reloadPortfolio = useCallback(async () => {
    const p = await fetchPortfolio();
    setPortfolio(p);
  }, []);

  const refreshOverview = useCallback(() => {
    fetchAdminOverview().then(setOverview).catch(() => {});
  }, []);

  useEffect(() => {
    checkAuthSession()
      .then((res) => {
        if (res.authenticated && res.user) {
          setAdminUser(res.user);
        }
      })
      .catch(() => {})
      .finally(() => setAuthChecking(false));
  }, []);

  useEffect(() => {
    if (!adminUser) return;
    loadAllAdminData().catch((err) => {
      notify(err instanceof Error ? err.message : 'Failed to load dashboard data.', 'error');
    });
  }, [adminUser, loadAllAdminData, notify]);

  const handleRequestConfirm = (
    title: string,
    description: string,
    action: () => Promise<void>
  ) => {
    setConfirmState({ open: true, title, description, busy: false, action });
  };

  const handleConfirmExecute = async () => {
    if (!confirmState.action) return;
    setConfirmState((s) => ({ ...s, busy: true }));
    try {
      await confirmState.action();
      setConfirmState({ open: false, title: '', description: '', busy: false, action: null });
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Action failed.', 'error');
      setConfirmState((s) => ({ ...s, busy: false }));
    }
  };

  const handleLogout = async () => {
    await logoutAdmin().catch(() => {});
    setAdminUser(null);
    setPortfolio(null);
    setOverview(null);
  };

  if (authChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050A18] text-sm text-slate-400">
        Verifying administrator session...
      </div>
    );
  }

  if (!adminUser) {
    return <AdminLogin onSuccess={(user) => setAdminUser(user)} />;
  }

  const currentTabLabel = TABS.find((t) => t.id === activeTab)?.label || 'Overview';

  return (
    <div className="flex min-h-screen bg-[#050A18] text-slate-100">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-white/10 bg-[#070E24] lg:flex">
        <div className="flex h-16 items-center border-b border-white/10 px-6">
          <span className="font-display text-base font-bold text-white">Portfolio Admin</span>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-gradient-to-r from-blue-600/90 to-cyan-500/80 text-white shadow-sm'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-3">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  <span>{tab.label}</span>
                </span>
                {tab.id === 'messages' && overview && overview.stats.unreadMessages > 0 && (
                  <span className="font-mono text-xs text-cyan-200 tabular-nums">
                    {overview.stats.unreadMessages}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-4 text-xs text-slate-400">
          <p className="truncate font-semibold text-slate-200">{adminUser.full_name}</p>
          <p className="truncate font-mono text-cyan-300">@{adminUser.username || adminUser.email}</p>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/65"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative z-10 flex w-64 flex-col border-r border-white/10 bg-[#070E24] p-4">
            <div className="flex items-center justify-between pb-4">
              <span className="font-display text-base font-bold text-white">Portfolio Admin</span>
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="space-y-1">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(tab.id);
                      setSidebarOpen(false);
                    }}
                    className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium ${
                      active ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-white/5'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/10 bg-[#050A18]/85 px-4 backdrop-blur-xl sm:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open admin menu"
              className="rounded-lg border border-white/10 p-2 text-slate-300 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-400">Admin</span>
              <span className="text-slate-600">/</span>
              <span className="font-semibold text-white">{currentTabLabel}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-slate-200 transition-colors hover:border-cyan-400/40 hover:text-white whitespace-nowrap shrink-0"
            >
              <span>View Portfolio</span>
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-200 transition-colors hover:bg-rose-500/20 whitespace-nowrap shrink-0"
            >
              <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Sign Out</span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-8">
          {toast && (
            <div
              role="status"
              className={`mb-6 flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${
                toast.type === 'error'
                  ? 'border-rose-500/40 bg-rose-500/15 text-rose-100'
                  : 'border-emerald-500/40 bg-emerald-500/15 text-emerald-100'
              }`}
            >
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                {toast.msg}
              </span>
              <button type="button" onClick={() => setToast(null)} className="text-xs opacity-70 hover:opacity-100">
                Dismiss
              </button>
            </div>
          )}

          {!portfolio || !overview ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="h-28 animate-pulse rounded-xl bg-white/5" />
              ))}
            </div>
          ) : (
            <>
              {activeTab === 'overview' && (
                <AdminOverview
                  overview={overview}
                  onNavigateTab={(tab) => setActiveTab(tab as AdminTab)}
                />
              )}

              {activeTab === 'profile' && (
                <AdminProfileEditor
                  profile={portfolio.profile}
                  onUpdated={(updated) => setPortfolio(updated)}
                  onNotify={notify}
                  onRefreshOverview={refreshOverview}
                />
              )}

              {activeTab === 'skills' && (
                <SkillsManager
                  data={portfolio}
                  onReloadPortfolio={reloadPortfolio}
                  onRefreshOverview={refreshOverview}
                  onNotify={notify}
                  onRequestConfirm={handleRequestConfirm}
                />
              )}

              {activeTab === 'experience' && (
                <ExperienceManager
                  data={portfolio}
                  onReloadPortfolio={reloadPortfolio}
                  onRefreshOverview={refreshOverview}
                  onNotify={notify}
                  onRequestConfirm={handleRequestConfirm}
                />
              )}

              {activeTab === 'credentials' && (
                <CredentialsManager
                  data={portfolio}
                  onReloadPortfolio={reloadPortfolio}
                  onRefreshOverview={refreshOverview}
                  onNotify={notify}
                  onRequestConfirm={handleRequestConfirm}
                />
              )}

              {activeTab === 'cv' && (
                <SocialsAndCvManager
                  data={portfolio}
                  onReloadPortfolio={reloadPortfolio}
                  onRefreshOverview={refreshOverview}
                  onNotify={notify}
                  onRequestConfirm={handleRequestConfirm}
                />
              )}

              {activeTab === 'messages' && (
                <MessagesInbox
                  messages={messages}
                  onMessagesChange={setMessages}
                  onRefreshOverview={refreshOverview}
                  onNotify={notify}
                  onRequestConfirm={handleRequestConfirm}
                />
              )}

              {activeTab === 'security' && (
                <SecuritySettings
                  currentUsername={adminUser.username || 'himel'}
                  currentEmail={adminUser.email}
                  onNotify={notify}
                  onCredentialsUpdated={(username, email) =>
                    setAdminUser((u) => (u ? { ...u, username, email } : u))
                  }
                />
              )}
            </>
          )}
        </main>
      </div>

      <ConfirmDialog
        open={confirmState.open}
        title={confirmState.title}
        description={confirmState.description}
        busy={confirmState.busy}
        onConfirm={handleConfirmExecute}
        onCancel={() =>
          setConfirmState({ open: false, title: '', description: '', busy: false, action: null })
        }
      />
    </div>
  );
}
