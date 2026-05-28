/**
 * WpmMeter — animated real-time WPM counter.
 */

interface WpmMeterProps {
  wpm: number
  label?: string
}

export function WpmMeter({ wpm, label = 'WPM' }: WpmMeterProps) {
  const color =
    wpm >= 80 ? 'text-emerald-500' :
    wpm >= 50 ? 'text-yellow-500' :
    wpm >= 25 ? 'text-orange-400' :
    'text-neutral-400'

  return (
    <div className="flex flex-col items-center gap-1">
      <span className={`text-4xl font-bold tabular-nums transition-all duration-300 ${color}`}>
        {wpm}
      </span>
      <span className="text-xs uppercase tracking-widest text-neutral-400">{label}</span>
    </div>
  )
}
