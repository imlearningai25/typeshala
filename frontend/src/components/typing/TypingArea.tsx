/**
 * TypingArea — renders the lesson text with per-character coloring,
 * a blinking cursor, and captures all keyboard input.
 *
 * Color convention:
 *   pending    → text-neutral-400 dark:text-neutral-500
 *   correct    → text-emerald-500
 *   incorrect  → text-red-500 bg-red-100 dark:bg-red-900/30
 *   cursor     → border-l-2 border-primary animate-pulse
 */

import { useEffect, useRef } from 'react'
import type { CharState } from '@/hooks/useTypingEngine'
import type { SessionStatus } from '@/hooks/useTypingEngine'

interface TypingAreaProps {
  text: string
  charStates: CharState[]
  cursorIndex: number
  status: SessionStatus
  onChar: (char: string) => void
  onBackspace: () => void
}

const charClass: Record<CharState, string> = {
  pending: 'text-neutral-400 dark:text-neutral-500',
  correct: 'text-emerald-500',
  incorrect: 'text-red-500',
}

export function TypingArea({
  text,
  charStates,
  cursorIndex,
  status,
  onChar,
  onBackspace,
}: TypingAreaProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Keep focus so keyboard events are captured
  useEffect(() => {
    if (status !== 'finished') containerRef.current?.focus()
  }, [status])

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (status === 'finished') return
    e.preventDefault()

    if (e.key === 'Backspace') {
      onBackspace()
      return
    }
    // Accept printable characters only (length 1 = single char)
    if (e.key.length === 1) {
      onChar(e.key)
    }
  }

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className={[
        'relative rounded-xl border-2 bg-white dark:bg-neutral-900 p-6 font-mono text-lg leading-relaxed',
        'focus:outline-none focus:border-primary',
        status === 'finished' ? 'border-emerald-400' : 'border-neutral-200 dark:border-neutral-700',
        'cursor-text select-none',
      ].join(' ')}
      aria-label="Typing area — click here and start typing"
    >
      {/* Instruction overlay when idle */}
      {status === 'idle' && (
        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm text-neutral-400 text-sm pointer-events-none">
          Click here and start typing…
        </div>
      )}

      <span aria-hidden="true">
        {text.split('').map((char, i) => {
          const isCursor = i === cursorIndex && status !== 'finished'
          const state = charStates[i] ?? 'pending'

          return (
            <span key={i} className="relative">
              {isCursor && (
                <span className="absolute -left-px top-0 h-full w-0.5 bg-primary animate-pulse" />
              )}
              <span
                className={[
                  charClass[state],
                  state === 'incorrect' ? 'bg-red-100 dark:bg-red-900/30 rounded' : '',
                  char === ' ' ? 'border-b border-current opacity-30' : '',
                ].join(' ')}
              >
                {char === '\n' ? '↵\n' : char}
              </span>
            </span>
          )
        })}
        {/* cursor at end */}
        {cursorIndex === text.length && status !== 'finished' && (
          <span className="inline-block w-0.5 h-5 bg-primary animate-pulse align-middle ml-px" />
        )}
      </span>
    </div>
  )
}
