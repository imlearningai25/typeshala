/**
 * LessonsPage — browse lessons by language and difficulty.
 */

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import languageService from '@/services/language.service'
import type { DifficultyLevel, Language, Lesson } from '@/types'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'

const DIFFICULTY_ORDER: DifficultyLevel[] = ['beginner', 'intermediate', 'advanced']
const DIFFICULTY_COLOR: Record<DifficultyLevel, string> = {
  beginner: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  intermediate: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  advanced: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

function LessonCard({ lesson }: { lesson: Lesson }) {
  const wordCount = lesson.content.trim().split(/\s+/).length
  return (
    <Link
      to={`/practice/${lesson.id}`}
      className="group block rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-5 hover:border-primary hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="font-semibold text-neutral-800 dark:text-neutral-100 group-hover:text-primary transition-colors line-clamp-1">
          {lesson.title}
        </h3>
        <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full capitalize ${DIFFICULTY_COLOR[lesson.difficulty]}`}>
          {lesson.difficulty}
        </span>
      </div>
      {lesson.description && (
        <p className="text-sm text-neutral-500 line-clamp-2 mb-3">{lesson.description}</p>
      )}
      <div className="flex items-center gap-3 text-xs text-neutral-400">
        <span>{wordCount} words</span>
        {lesson.time_limit_seconds && <span>⏱ {lesson.time_limit_seconds}s limit</span>}
      </div>
    </Link>
  )
}

function LangButton({ lang, active, onClick }: { lang: Language; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={[
        'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all border',
        active
          ? 'bg-primary text-white border-primary shadow'
          : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:border-primary',
      ].join(' ')}
    >
      {lang.flag_emoji && <span>{lang.flag_emoji}</span>}
      {lang.name}
      <span className="text-xs opacity-60">({lang.lesson_count})</span>
    </button>
  )
}

export default function LessonsPage() {
  const [selectedLang, setSelectedLang] = useState<string | null>(null)
  const [selectedDiff, setSelectedDiff] = useState<DifficultyLevel | null>(null)

  const { data: languages, isLoading: langsLoading } = useQuery({
    queryKey: ['languages'],
    queryFn: () => languageService.getAll(),
  })

  const { data: lessonsPage, isLoading: lessonsLoading } = useQuery({
    queryKey: ['lessons', selectedLang, selectedDiff],
    queryFn: () =>
      languageService.getLessons({
        language: selectedLang ?? undefined,
        difficulty: selectedDiff ?? undefined,
        page_size: 50,
      }),
  })

  const lessons = lessonsPage?.items ?? []

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-1">Lessons</h1>
        <p className="text-neutral-500">Choose a lesson to start practising</p>
      </div>

      {/* Language filter */}
      <section aria-label="Filter by language">
        <p className="text-xs uppercase tracking-widest text-neutral-400 mb-3">Language</p>
        {langsLoading ? (
          <div className="flex gap-2">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-9 w-24 rounded-full" />)}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedLang(null)}
              className={[
                'px-4 py-2 rounded-full text-sm font-medium border transition-all',
                selectedLang === null
                  ? 'bg-primary text-white border-primary shadow'
                  : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:border-primary',
              ].join(' ')}
            >
              All
            </button>
            {languages?.map(lang => (
              <LangButton
                key={lang.code}
                lang={lang}
                active={selectedLang === lang.code}
                onClick={() => setSelectedLang(lang.code === selectedLang ? null : lang.code)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Difficulty filter */}
      <section aria-label="Filter by difficulty">
        <p className="text-xs uppercase tracking-widest text-neutral-400 mb-3">Difficulty</p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedDiff(null)}
            className={[
              'px-4 py-2 rounded-full text-sm font-medium border transition-all capitalize',
              selectedDiff === null
                ? 'bg-primary text-white border-primary'
                : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300',
            ].join(' ')}
          >
            All
          </button>
          {DIFFICULTY_ORDER.map(d => (
            <button
              key={d}
              onClick={() => setSelectedDiff(d === selectedDiff ? null : d)}
              className={[
                'px-4 py-2 rounded-full text-sm font-medium border transition-all capitalize',
                selectedDiff === d
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300',
              ].join(' ')}
            >
              {d}
            </button>
          ))}
        </div>
      </section>

      {/* Lesson grid */}
      {lessonsLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
      ) : lessons.length === 0 ? (
        <div className="text-center py-20 text-neutral-400">
          <p className="text-5xl mb-4">📭</p>
          <p>No lessons found for this filter.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {lessons.map(lesson => (
            <LessonCard key={lesson.id} lesson={lesson} />
          ))}
        </div>
      )}
    </div>
  )
}
