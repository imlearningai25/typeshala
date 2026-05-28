/**
 * PracticePage — full typing session flow.
 *
 * States:
 *   ready    → show lesson info + "Start" overlay
 *   typing   → TypingArea + live WPM/accuracy
 *   results  → ResultsCard + auto-submit to /sessions
 */

import { useCallback, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import languageService from '@/services/language.service'
import sessionService from '@/services/session.service'
import { useTypingEngine } from '@/hooks/useTypingEngine'
import { TypingArea } from '@/components/typing/TypingArea'
import { WpmMeter } from '@/components/typing/WpmMeter'
import { AccuracyBar } from '@/components/typing/AccuracyBar'
import { ResultsCard } from '@/components/typing/ResultsCard'
import { Skeleton } from '@/components/ui/Skeleton'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/stores/auth.store'

function ElapsedTimer({ seconds }: { seconds: number }) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return (
    <span className="tabular-nums text-neutral-400 text-sm font-mono">
      {m > 0 ? `${m}:${s.toString().padStart(2, '0')}` : `${s}s`}
    </span>
  )
}

export default function PracticePage() {
  const { lessonId } = useParams<{ lessonId: string }>()
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore(s => !!s.accessToken)
  const [submitted, setSubmitted] = useState(false)

  const { data: lesson, isLoading, error } = useQuery({
    queryKey: ['lesson', lessonId],
    queryFn: () => languageService.getLesson(lessonId!),
    enabled: !!lessonId,
  })

  const engine = useTypingEngine(lesson?.content ?? '')

  const submitMutation = useMutation({
    mutationFn: sessionService.submit,
    onSuccess: () => setSubmitted(true),
  })

  // Auto-submit when finished (once)
  const handleFinished = useCallback(() => {
    if (!isAuthenticated || !lessonId || submitted) return
    submitMutation.mutate({
      lesson_id: lessonId,
      duration_seconds: engine.stats.elapsedSeconds,
      characters_typed: engine.stats.charactersTyped,
      errors: engine.stats.errors,
      raw_keystrokes: engine.keystrokes,
    })
  }, [isAuthenticated, lessonId, submitted, submitMutation, engine.stats, engine.keystrokes])

  // Trigger submit on first render of finished state
  if (engine.status === 'finished' && !submitted && !submitMutation.isPending) {
    handleFinished()
  }

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    )
  }

  if (error || !lesson) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <p className="text-5xl mb-4">🔍</p>
        <p className="text-neutral-500">Lesson not found.</p>
        <Button className="mt-6" onClick={() => navigate('/lessons')}>Back to lessons</Button>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <button
            onClick={() => navigate('/lessons')}
            className="text-sm text-neutral-400 hover:text-primary mb-1 transition-colors"
          >
            ← Lessons
          </button>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">{lesson.title}</h1>
          {lesson.description && (
            <p className="text-sm text-neutral-500 mt-1">{lesson.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-xs px-2 py-0.5 rounded-full capitalize font-medium ${
            lesson.difficulty === 'beginner' ? 'bg-emerald-100 text-emerald-700' :
            lesson.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-700' :
            'bg-red-100 text-red-700'
          }`}>
            {lesson.difficulty}
          </span>
        </div>
      </div>

      {/* Results view */}
      {engine.status === 'finished' ? (
        <ResultsCard
          stats={engine.stats}
          lessonTitle={lesson.title}
          onRetry={engine.reset}
          onNext={() => navigate('/lessons')}
          isSaving={submitMutation.isPending}
        />
      ) : (
        <>
          {/* Live stats bar */}
          <div className="flex items-center gap-6 px-1">
            <WpmMeter wpm={engine.stats.wpm} />
            <div className="flex-1">
              <AccuracyBar accuracy={engine.stats.accuracy} />
            </div>
            <div className="flex flex-col items-end gap-1">
              <ElapsedTimer seconds={engine.stats.elapsedSeconds} />
              <span className="text-xs text-neutral-400">
                {engine.cursorIndex}/{lesson.content.length}
              </span>
            </div>
          </div>

          {/* Typing area */}
          <TypingArea
            text={lesson.content}
            charStates={engine.charStates}
            cursorIndex={engine.cursorIndex}
            status={engine.status}
            onChar={engine.handleInput}
            onBackspace={engine.handleBackspace}
          />

          {/* Reset */}
          {engine.status === 'running' && (
            <div className="flex justify-end">
              <button
                onClick={engine.reset}
                className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors"
              >
                Reset (Escape)
              </button>
            </div>
          )}

          {/* Login nudge */}
          {!isAuthenticated && (
            <p className="text-center text-sm text-neutral-400">
              <button onClick={() => navigate('/login')} className="text-primary hover:underline">
                Log in
              </button>{' '}
              to save your results and earn XP.
            </p>
          )}
        </>
      )}
    </div>
  )
}
