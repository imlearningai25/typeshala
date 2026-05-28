/**
 * useTypingEngine — core state machine for a typing practice session.
 *
 * Responsibilities:
 *  - Track per-character state: pending | correct | incorrect
 *  - Maintain cursor position
 *  - Real-time WPM (recalculated every second via interval)
 *  - Accuracy: correct chars / total chars typed * 100
 *  - Detect session start (first keystroke) and completion (all chars typed)
 *  - Collect keystroke events for server-side consistency analysis
 *  - Expose reset() for trying again
 */

import { useCallback, useEffect, useRef, useState } from 'react'

export type CharState = 'pending' | 'correct' | 'incorrect'

export interface KeystrokeEvent {
  timestamp_ms: number
  expected: string
  actual: string
  correct: boolean
}

export interface TypingStats {
  wpm: number
  accuracy: number
  elapsedSeconds: number
  charactersTyped: number
  errors: number
}

export type SessionStatus = 'idle' | 'running' | 'finished'

export interface TypingEngineState {
  charStates: CharState[]
  cursorIndex: number
  status: SessionStatus
  stats: TypingStats
  keystrokes: KeystrokeEvent[]
  /** Call with each character the user types */
  handleInput: (char: string) => void
  /** Backspace */
  handleBackspace: () => void
  reset: () => void
}

function computeWpm(correctChars: number, elapsedSeconds: number): number {
  if (elapsedSeconds < 1) return 0
  return Math.round((correctChars / 5) / (elapsedSeconds / 60))
}

function computeAccuracy(typed: number, errors: number): number {
  if (typed === 0) return 100
  return Math.round(((typed - errors) / typed) * 1000) / 10
}

export function useTypingEngine(text: string): TypingEngineState {
  const [charStates, setCharStates] = useState<CharState[]>(() =>
    Array(text.length).fill('pending')
  )
  const [cursorIndex, setCursorIndex] = useState(0)
  const [status, setStatus] = useState<SessionStatus>('idle')
  const [stats, setStats] = useState<TypingStats>({
    wpm: 0,
    accuracy: 100,
    elapsedSeconds: 0,
    charactersTyped: 0,
    errors: 0,
  })
  const [keystrokes, setKeystrokes] = useState<KeystrokeEvent[]>([])

  // Refs to avoid stale closures in the timer
  const startTimeRef = useRef<number | null>(null)
  const cursorRef = useRef(0)
  const errorsRef = useRef(0)
  const charsTypedRef = useRef(0)
  const charStatesRef = useRef<CharState[]>(Array(text.length).fill('pending'))

  // Reset when text changes
  useEffect(() => {
    reset()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text])

  // 1-second WPM ticker
  useEffect(() => {
    if (status !== 'running') return
    const id = setInterval(() => {
      const elapsed = (Date.now() - (startTimeRef.current ?? Date.now())) / 1000
      const correctCount = charStatesRef.current.filter(s => s === 'correct').length
      setStats(prev => ({
        ...prev,
        elapsedSeconds: Math.floor(elapsed),
        wpm: computeWpm(correctCount, elapsed),
        accuracy: computeAccuracy(charsTypedRef.current, errorsRef.current),
      }))
    }, 500)
    return () => clearInterval(id)
  }, [status])

  const handleInput = useCallback(
    (char: string) => {
      if (status === 'finished') return
      const idx = cursorRef.current
      if (idx >= text.length) return

      // Start timer on first keystroke
      if (status === 'idle') {
        startTimeRef.current = Date.now()
        setStatus('running')
      }

      const expected = text[idx]
      const isCorrect = char === expected
      const nowMs = Date.now() - (startTimeRef.current ?? Date.now())

      // Record keystroke
      const event: KeystrokeEvent = {
        timestamp_ms: nowMs,
        expected,
        actual: char,
        correct: isCorrect,
      }
      setKeystrokes(prev => [...prev, event])

      // Update char state
      const newStates = [...charStatesRef.current]
      newStates[idx] = isCorrect ? 'correct' : 'incorrect'
      charStatesRef.current = newStates
      setCharStates(newStates)

      charsTypedRef.current += 1
      if (!isCorrect) errorsRef.current += 1

      const nextIdx = idx + 1
      cursorRef.current = nextIdx
      setCursorIndex(nextIdx)

      // Check completion
      if (nextIdx >= text.length) {
        const elapsed = (Date.now() - (startTimeRef.current ?? Date.now())) / 1000
        const correctCount = newStates.filter(s => s === 'correct').length
        setStats({
          wpm: computeWpm(correctCount, elapsed),
          accuracy: computeAccuracy(charsTypedRef.current, errorsRef.current),
          elapsedSeconds: Math.round(elapsed),
          charactersTyped: charsTypedRef.current,
          errors: errorsRef.current,
        })
        setStatus('finished')
      }
    },
    [status, text]
  )

  const handleBackspace = useCallback(() => {
    if (status === 'finished') return
    const idx = cursorRef.current
    if (idx === 0) return

    const prevIdx = idx - 1
    const newStates = [...charStatesRef.current]
    newStates[prevIdx] = 'pending'
    charStatesRef.current = newStates
    setCharStates(newStates)
    cursorRef.current = prevIdx
    setCursorIndex(prevIdx)
  }, [status])

  function reset() {
    const fresh: CharState[] = Array(text.length).fill('pending')
    charStatesRef.current = fresh
    cursorRef.current = 0
    errorsRef.current = 0
    charsTypedRef.current = 0
    startTimeRef.current = null
    setCharStates(fresh)
    setCursorIndex(0)
    setStatus('idle')
    setKeystrokes([])
    setStats({ wpm: 0, accuracy: 100, elapsedSeconds: 0, charactersTyped: 0, errors: 0 })
  }

  return {
    charStates,
    cursorIndex,
    status,
    stats,
    keystrokes,
    handleInput,
    handleBackspace,
    reset,
  }
}
