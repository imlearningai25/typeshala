/**
 * LeaderboardPage — ranked typists by average WPM.
 *
 * Features:
 *  - Period tabs: All Time / Monthly / Weekly
 *  - Language filter pills
 *  - Top-3 podium with gold/silver/bronze
 *  - Full ranked table
 */

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import analyticsService from '@/services/analytics.service'
import languageService from '@/services/language.service'
import { Skeleton } from '@/components/ui/Skeleton'
import type { LeaderboardEntry } from '@/types/analytics'

const PERIODS = [
  { value: 'alltime', label: 'All Time' },
  { value: 'monthly', label: 'This Month' },
  { value: 'weekly',  label: 'This Week' },
]

const MEDALS = ['🥇', '🥈', '🥉']
const MEDAL_BG = [
  'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700',
  'bg-neutral-100 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-600',
  'bg-orange-50 dark:bg-orange-900/20 border-orange-300 dark:border-orange-700',
]

function Podium({ entries }: { entries: LeaderboardEntry[] }) {
  const top3 = entries.slice(0, 3)
  // Reorder for display: 2nd, 1st, 3rd
  const order = [top3[1], top3[0], top3[2]].filter(Boolean)
  const heights = top3.length === 1 ? ['h-28'] : ['h-20', 'h-28', 'h-16']
  const reorderedHeights = top3.length > 1 ? [heights[1], heights[0], heights[2]] : heights

  return (
    <div className="flex items-end justify-center gap-3 mb-8">
      {order.map((entry, i) => {
        const originalIdx = top3.indexOf(entry)
        return (
          <div key={entry.user_id} className="flex flex-col items-center gap-2">
            <div className="text-center">
              {entry.avatar_url ? (
                <img src={entry.avatar_url} alt={entry.username} className="w-12 h-12 rounded-full mx-auto" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-lg font-bold text-primary mx-auto">
                  {entry.username[0].toUpperCase()}
                </div>
              )}
              <p className="text-xs font-semibold mt-1 text-neutral-700 dark:text-neutral-300 truncate max-w-[80px]">{entry.username}</p>
              <p className="text-sm font-bold text-emerald-600">{entry.avg_wpm} WPM</p>
            </div>
            <div className={`${reorderedHeights[i]} w-20 rounded-t-lg border-2 flex items-start justify-center pt-2 text-xl ${MEDAL_BG[originalIdx] ?? 'bg-neutral-100'}`}>
              {MEDALS[originalIdx]}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function LeaderboardPage() {
  const [period, setPeriod] = useState('alltime')
  const [language, setLanguage] = useState<string | null>(null)

  const { data: languages } = useQuery({
    queryKey: ['languages'],
    queryFn: () => languageService.getAll(),
  })

  const { data: board, isLoading } = useQuery({
    queryKey: ['leaderboard', period, language],
    queryFn: () =>
      analyticsService.getLeaderboard({
        period,
        language: language ?? undefined,
        limit: 50,
      }),
  })

  const entries = board?.entries ?? []

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-1">Leaderboard</h1>
        <p className="text-neutral-500">Top typists ranked by average WPM</p>
      </div>

      {/* Period tabs */}
      <div className="flex gap-2 border-b border-neutral-200 dark:border-neutral-700">
        {PERIODS.map(p => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            className={[
              'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
              period === p.value
                ? 'border-primary text-primary'
                : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300',
            ].join(' ')}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Language filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setLanguage(null)}
          className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
            language === null
              ? 'bg-primary text-white border-primary'
              : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300'
          }`}
        >
          All languages
        </button>
        {languages?.map(lang => (
          <button
            key={lang.code}
            onClick={() => setLanguage(lang.code === language ? null : lang.code)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
              language === lang.code
                ? 'bg-primary text-white border-primary'
                : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300'
            }`}
          >
            {lang.flag_emoji} {lang.name}
          </button>
        ))}
      </div>

      {/* Podium */}
      {!isLoading && entries.length >= 2 && <Podium entries={entries} />}

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-20 text-neutral-400">
          <p className="text-5xl mb-3">🏁</p>
          <p>No data yet for this period.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 dark:bg-neutral-800 text-xs uppercase tracking-widest text-neutral-400">
              <tr>
                <th className="px-4 py-3 text-left w-12">#</th>
                <th className="px-4 py-3 text-left">Player</th>
                <th className="px-4 py-3 text-right">Avg WPM</th>
                <th className="px-4 py-3 text-right hidden sm:table-cell">Best WPM</th>
                <th className="px-4 py-3 text-right hidden sm:table-cell">Accuracy</th>
                <th className="px-4 py-3 text-right hidden md:table-cell">Sessions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {entries.map(entry => (
                <tr
                  key={entry.user_id}
                  className={[
                    'transition-colors',
                    entry.rank <= 3
                      ? 'bg-yellow-50/50 dark:bg-yellow-900/10'
                      : 'bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800',
                  ].join(' ')}
                >
                  <td className="px-4 py-3 font-bold tabular-nums text-neutral-500">
                    {entry.rank <= 3 ? MEDALS[entry.rank - 1] : entry.rank}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {entry.avatar_url ? (
                        <img src={entry.avatar_url} alt={entry.username} className="w-7 h-7 rounded-full" />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                          {entry.username[0].toUpperCase()}
                        </div>
                      )}
                      <div>
                        <span className="font-medium text-neutral-800 dark:text-neutral-200">{entry.username}</span>
                        <span className="ml-2 text-xs text-neutral-400">Lv.{entry.level}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-bold tabular-nums text-emerald-600">{entry.avg_wpm}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-neutral-500 hidden sm:table-cell">{entry.best_wpm}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-neutral-500 hidden sm:table-cell">{entry.avg_accuracy}%</td>
                  <td className="px-4 py-3 text-right tabular-nums text-neutral-400 hidden md:table-cell">{entry.total_sessions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
