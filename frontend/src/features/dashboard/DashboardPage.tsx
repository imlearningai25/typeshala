/**
 * DashboardPage — personal analytics hub.
 *
 * Sections:
 *   1. Stats cards  — WPM / Accuracy / Streak / Level / XP
 *   2. WPM trend    — LineChart (recharts) over last 30 days
 *   3. Activity strip — last 90 days session count heatmap
 *   4. Achievements — earned/locked badge grid
 *   5. Recent sessions table
 */

import { useQuery } from '@tanstack/react-query'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import analyticsService from '@/services/analytics.service'
import sessionService from '@/services/session.service'
import { useAuthStore } from '@/stores/auth.store'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { Skeleton } from '@/components/ui/Skeleton'

// ── Stat card ─────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  icon: string
  color?: string
}

function StatCard({ label, value, sub, icon, color = 'bg-white dark:bg-neutral-900' }: StatCardProps) {
  return (
    <div className={`${color} rounded-2xl border border-neutral-200 dark:border-neutral-700 p-5 flex gap-4 items-start`}>
      <span className="text-3xl">{icon}</span>
      <div>
        <p className="text-2xl font-bold tabular-nums text-neutral-900 dark:text-white">{value}</p>
        {sub && <p className="text-xs text-neutral-400 mt-0.5">{sub}</p>}
        <p className="text-xs uppercase tracking-widest text-neutral-400 mt-1">{label}</p>
      </div>
    </div>
  )
}

// ── Activity strip ────────────────────────────────────────────────────────────

function ActivityStrip({ data }: { data: Array<{ date: string; sessions: number }> }) {
  if (!data.length) return <p className="text-sm text-neutral-400">No activity yet.</p>

  const max = Math.max(...data.map(d => d.sessions), 1)
  const intensity = (n: number) => {
    if (n === 0) return 'bg-neutral-100 dark:bg-neutral-800'
    const lvl = Math.ceil((n / max) * 4)
    return ['', 'bg-emerald-200', 'bg-emerald-400', 'bg-emerald-500', 'bg-emerald-600'][lvl]
  }

  return (
    <div className="flex flex-wrap gap-1">
      {data.map(d => (
        <div
          key={d.date}
          title={`${d.date}: ${d.sessions} session${d.sessions !== 1 ? 's' : ''}`}
          className={`w-3 h-3 rounded-sm ${intensity(d.sessions)}`}
        />
      ))}
    </div>
  )
}

// ── Achievement badge ─────────────────────────────────────────────────────────

function AchievementBadge({ ach }: { ach: { icon: string; name: string; description: string; earned: boolean; xp_reward: number } }) {
  return (
    <div className={[
      'flex flex-col items-center gap-1 p-3 rounded-xl border text-center transition-all',
      ach.earned
        ? 'border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-700'
        : 'border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 opacity-40 grayscale',
    ].join(' ')}
    title={ach.description}
    >
      <span className="text-2xl">{ach.icon}</span>
      <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300 leading-tight">{ach.name}</span>
      <span className="text-xs text-yellow-600 dark:text-yellow-400">+{ach.xp_reward} XP</span>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function DashboardPage() {
  const { data: user } = useCurrentUser()

  const { data: wpmHistory, isLoading: wpmLoading } = useQuery({
    queryKey: ['wpm-history'],
    queryFn: () => analyticsService.getWpmHistory(30),
  })

  const { data: activity, isLoading: actLoading } = useQuery({
    queryKey: ['activity'],
    queryFn: () => analyticsService.getActivity(90),
  })

  const { data: achievements, isLoading: achLoading } = useQuery({
    queryKey: ['achievements'],
    queryFn: () => analyticsService.getAchievements(),
  })

  const { data: recentSessions, isLoading: sessLoading } = useQuery({
    queryKey: ['recent-sessions'],
    queryFn: () => sessionService.getMySessions({ page: 1, page_size: 10 }),
  })

  if (!user) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-6">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
      </div>
    )
  }

  const earnedCount = achievements?.filter(a => a.earned).length ?? 0

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">
          Welcome back, {user.username} 👋
        </h1>
        <p className="text-neutral-500 mt-1">Here's your typing progress</p>
      </div>

      {/* Stats cards */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard icon="⚡" label="Best WPM" value="—" sub="all time" />
        <StatCard icon="🎯" label="Avg Accuracy" value="—" sub="all time" />
        <StatCard icon="🔥" label="Streak" value={`${user.current_streak}d`} sub={`Best: ${user.longest_streak}d`} />
        <StatCard icon="⭐" label="Level" value={user.level} sub={`${user.total_xp} XP`} />
        <StatCard icon="🏅" label="Achievements" value={earnedCount} sub={`of ${achievements?.length ?? 0}`} />
      </section>

      {/* WPM trend chart */}
      <section>
        <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100 mb-4">WPM over 30 days</h2>
        {wpmLoading ? (
          <Skeleton className="h-56 rounded-xl" />
        ) : !wpmHistory?.data.length ? (
          <div className="h-56 flex items-center justify-center rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-400 text-sm">
            Complete some sessions to see your trend
          </div>
        ) : (
          <div className="h-56 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4 bg-white dark:bg-neutral-900">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={wpmHistory.data} margin={{ top: 5, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.1} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  tickFormatter={d => d.slice(5)}
                  stroke="currentColor"
                  strokeOpacity={0.3}
                />
                <YAxis tick={{ fontSize: 11 }} stroke="currentColor" strokeOpacity={0.3} />
                <Tooltip
                  contentStyle={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 8 }}
                  labelFormatter={l => `Date: ${l}`}
                />
                <Legend />
                <Line type="monotone" dataKey="avg_wpm" name="Avg WPM" stroke="#10b981" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="best_wpm" name="Best WPM" stroke="#6366f1" strokeWidth={2} dot={false} strokeDasharray="4 2" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      {/* Activity heatmap */}
      <section>
        <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100 mb-3">Activity (last 90 days)</h2>
        {actLoading ? (
          <Skeleton className="h-16 rounded-xl" />
        ) : (
          <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 p-4 bg-white dark:bg-neutral-900">
            <ActivityStrip data={activity?.data ?? []} />
            <div className="flex items-center gap-1 mt-3 text-xs text-neutral-400">
              <span>Less</span>
              {['bg-neutral-100 dark:bg-neutral-800','bg-emerald-200','bg-emerald-400','bg-emerald-500','bg-emerald-600'].map((c,i) => (
                <span key={i} className={`w-3 h-3 rounded-sm ${c}`} />
              ))}
              <span>More</span>
            </div>
          </div>
        )}
      </section>

      {/* Achievements */}
      <section>
        <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100 mb-3">
          Achievements{earnedCount > 0 && <span className="ml-2 text-sm text-yellow-500">{earnedCount} earned</span>}
        </h2>
        {achLoading ? (
          <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-9 gap-3">
            {[...Array(9)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-9 gap-3">
            {achievements?.map(a => <AchievementBadge key={a.id} ach={a} />)}
          </div>
        )}
      </section>

      {/* Recent sessions */}
      <section>
        <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100 mb-3">Recent sessions</h2>
        {sessLoading ? (
          <Skeleton className="h-40 rounded-xl" />
        ) : !recentSessions?.items.length ? (
          <p className="text-neutral-400 text-sm">No sessions yet — go practice!</p>
        ) : (
          <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 dark:bg-neutral-800 text-xs uppercase tracking-widest text-neutral-400">
                <tr>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-right">WPM</th>
                  <th className="px-4 py-3 text-right">Accuracy</th>
                  <th className="px-4 py-3 text-right">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {recentSessions.items.map(s => (
                  <tr key={s.id} className="bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                    <td className="px-4 py-3 text-neutral-500">{new Date(s.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums text-emerald-600">{s.wpm}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-neutral-600 dark:text-neutral-300">{s.accuracy.toFixed(1)}%</td>
                    <td className="px-4 py-3 text-right tabular-nums text-neutral-400">{Math.round(s.duration_seconds)}s</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
