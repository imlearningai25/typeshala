/**
 * ResultsCard — shown when a typing session completes.
 * Displays final stats and allows retry or next lesson.
 */

import { Button } from '@/components/ui/Button'
import type { TypingStats } from '@/hooks/useTypingEngine'

interface ResultsCardProps {
  stats: TypingStats
  lessonTitle: string
  onRetry: () => void
  onNext?: () => void
  isSaving?: boolean
}

interface StatItemProps {
  label: string
  value: string | number
  sub?: string
  highlight?: boolean
}

function StatItem({ label, value, sub, highlight }: StatItemProps) {
  return (
    <div className={`flex flex-col items-center p-4 rounded-xl ${highlight ? 'bg-primary/10' : 'bg-neutral-50 dark:bg-neutral-800'}`}>
      <span className={`text-3xl font-bold tabular-nums ${highlight ? 'text-primary' : 'text-neutral-800 dark:text-neutral-100'}`}>
        {value}
      </span>
      {sub && <span className="text-xs text-neutral-400 mt-0.5">{sub}</span>}
      <span className="text-xs uppercase tracking-widest text-neutral-400 mt-1">{label}</span>
    </div>
  )
}

function grade(wpm: number, accuracy: number): { letter: string; color: string } {
  const score = wpm * (accuracy / 100)
  if (score >= 80) return { letter: 'S', color: 'text-yellow-500' }
  if (score >= 60) return { letter: 'A', color: 'text-emerald-500' }
  if (score >= 40) return { letter: 'B', color: 'text-blue-500' }
  if (score >= 20) return { letter: 'C', color: 'text-orange-400' }
  return { letter: 'D', color: 'text-red-500' }
}

export function ResultsCard({ stats, lessonTitle, onRetry, onNext, isSaving }: ResultsCardProps) {
  const { letter, color } = grade(stats.wpm, stats.accuracy)
  const mins = Math.floor(stats.elapsedSeconds / 60)
  const secs = stats.elapsedSeconds % 60
  const timeStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`

  return (
    <div className="flex flex-col items-center gap-6 py-8 animate-fadeIn">
      {/* Grade */}
      <div className="flex flex-col items-center gap-2">
        <span className={`text-7xl font-black ${color}`}>{letter}</span>
        <p className="text-neutral-500 text-sm">
          Completed: <span className="font-medium text-neutral-700 dark:text-neutral-300">{lessonTitle}</span>
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-lg">
        <StatItem label="WPM" value={stats.wpm} highlight />
        <StatItem label="Accuracy" value={`${stats.accuracy.toFixed(1)}%`} />
        <StatItem label="Time" value={timeStr} />
        <StatItem label="Errors" value={stats.errors} />
      </div>

      {/* Actions */}
      <div className="flex gap-3 mt-2">
        <Button variant="outline" onClick={onRetry} disabled={isSaving}>
          Try Again
        </Button>
        {onNext && (
          <Button onClick={onNext} disabled={isSaving}>
            {isSaving ? 'Saving…' : 'Next Lesson →'}
          </Button>
        )}
      </div>
    </div>
  )
}
