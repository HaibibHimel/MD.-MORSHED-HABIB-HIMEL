import { Award, Briefcase, Eye, Mail, MessageSquare, Sparkles } from 'lucide-react';
import type { AdminOverviewData } from '@/src/types/portfolio';

interface AdminOverviewProps {
  overview: AdminOverviewData;
  onNavigateTab: (tab: string) => void;
}

export function AdminOverview({ overview, onNavigateTab }: AdminOverviewProps) {
  const { stats, visitorTrend, recentActivities } = overview;
  const maxTrend = Math.max(1, ...visitorTrend.map((d) => d.visits));

  const cards = [
    {
      label: 'Total Portfolio Visitors',
      value: stats.totalVisitors,
      sub: `${stats.todayVisitors} today`,
      icon: <Eye className="h-5 w-5 text-cyan-300" />,
      actionTab: 'overview',
    },
    {
      label: 'Contact Messages',
      value: stats.totalMessages,
      sub: `${stats.unreadMessages} unread`,
      icon: <Mail className="h-5 w-5 text-blue-300" />,
      actionTab: 'messages',
    },
    {
      label: 'Experience & Credentials',
      value: stats.expCount + stats.certCount + stats.eduCount,
      sub: `${stats.expCount} roles · ${stats.certCount} certificates`,
      icon: <Briefcase className="h-5 w-5 text-indigo-300" />,
      actionTab: 'experience',
    },
    {
      label: 'Active Skills Listed',
      value: stats.skillsCount,
      sub: 'Displayed on public portfolio',
      icon: <Award className="h-5 w-5 text-emerald-300" />,
      actionTab: 'skills',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <button
            key={card.label}
            type="button"
            onClick={() => onNavigateTab(card.actionTab)}
            className="rounded-xl border border-white/10 bg-[#0A132C]/80 p-5 text-left transition-colors hover:border-cyan-400/40"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">{card.label}</span>
              {card.icon}
            </div>
            <p className="mt-3 font-mono text-3xl font-semibold text-white tabular-nums">
              {card.value}
            </p>
            <p className="mt-1 text-xs text-slate-400">{card.sub}</p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Visitor Trend Chart */}
        <div className="rounded-xl border border-white/10 bg-[#0A132C]/80 p-6 lg:col-span-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-base font-bold text-white">Daily Visitor Traffic</h3>
              <p className="mt-0.5 text-xs text-slate-400">Unique daily sessions recorded</p>
            </div>
            <span className="font-mono text-xs text-cyan-300 tabular-nums">
              Last {visitorTrend.length || 1} day(s)
            </span>
          </div>

          {visitorTrend.length === 0 ? (
            <div className="mt-8 flex h-44 items-center justify-center rounded-xl border border-dashed border-white/10 text-xs text-slate-400">
              Visitor statistics will populate as guests browse the portfolio.
            </div>
          ) : (
            <div className="mt-6 flex h-48 items-end gap-2 border-b border-white/10 pb-2">
              {visitorTrend.map((point) => {
                const heightPct = Math.max(12, Math.round((point.visits / maxTrend) * 100));
                return (
                  <div key={point.day} className="group flex flex-1 flex-col items-center gap-2">
                    <span className="font-mono text-[11px] text-slate-300 tabular-nums">
                      {point.visits}
                    </span>
                    <div className="flex h-32 w-full items-end">
                      <div
                        style={{ height: `${heightPct}%` }}
                        className="w-full rounded-t-md bg-gradient-to-t from-blue-600 to-cyan-400 transition-opacity group-hover:opacity-90"
                        title={`${point.day}: ${point.visits} visit(s)`}
                      />
                    </div>
                    <span className="font-mono text-[10px] text-slate-500">
                      {point.day.slice(5)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Activities Feed */}
        <div className="rounded-xl border border-white/10 bg-[#0A132C]/80 p-6 lg:col-span-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-base font-bold text-white">Recent Activity Log</h3>
              <p className="mt-0.5 text-xs text-slate-400">Latest content updates and inquiries</p>
            </div>
            <Sparkles className="h-4 w-4 text-cyan-300" aria-hidden="true" />
          </div>

          <div className="mt-5 max-h-64 space-y-3 overflow-y-auto pr-1">
            {recentActivities.length === 0 ? (
              <p className="text-xs text-slate-400">No recent activities logged yet.</p>
            ) : (
              recentActivities.map((act) => (
                <div
                  key={act.id}
                  className="flex items-start justify-between gap-4 border-b border-white/5 pb-3 last:border-b-0"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white">{act.action}</p>
                    <p className="mt-0.5 text-xs text-slate-300">{act.details}</p>
                    <p className="mt-1 text-[11px] text-slate-500">By {act.actor}</p>
                  </div>
                  <time className="shrink-0 font-mono text-[11px] text-slate-400 tabular-nums">
                    {new Date(act.created_at).toLocaleDateString()}
                  </time>
                </div>
              ))
            )}
          </div>

          {stats.unreadMessages > 0 && (
            <button
              type="button"
              onClick={() => onNavigateTab('messages')}
              className="mt-4 inline-flex items-center gap-2 rounded-lg border border-blue-400/30 bg-blue-500/10 px-3.5 py-2 text-xs font-semibold text-blue-200 hover:bg-blue-500/20"
            >
              <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Review {stats.unreadMessages} unread message(s)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
