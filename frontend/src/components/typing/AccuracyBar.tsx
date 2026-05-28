/**
 * AccuracyBar — horizontal progress bar showing accuracy %.
 */

interface AccuracyBarProps {
  accuracy: number  // 0–100
}

export function AccuracyBar({ accuracy }: AccuracyBarProps) {
  const clamped = Math.max(0, Math.min(100, accuracy))
  const color =
    clamped >= 95 ? 'bg-emerald-500' :
    clamped >= 85 ? 'bg-yellow-400' :
    clamped >= 70 ? 'bg-orange-400' :
    'bg-red-500'

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <div className="flex justify-between text-xs text-neutral-400">
        <span className="uppercase tracking-widest">Accuracy</span>
        <span className="font-semibold tabular-nums text-neutral-600 dark:text-neutral-300">
          {clamped.toFixed(1)}%
        </span>
      </div>
      <div className="w-full h-2 rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${color}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  )
}
