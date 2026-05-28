import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart } from 'lucide-react'
import { cn } from '@/utils/cn'

// ── Word banks ────────────────────────────────────────────────────────────────

const WORD_BANKS: Record<string, string[]> = {
  en: [
    'fire', 'ocean', 'flower', 'wind', 'tree', 'moon', 'star', 'river', 'cloud',
    'forest', 'thunder', 'sword', 'arrow', 'warrior', 'demon', 'king', 'hero',
    'victory', 'light', 'shadow', 'earth', 'sky', 'rain', 'storm', 'tiger', 'lion',
    'eagle', 'power', 'speed', 'grace', 'honor', 'truth', 'flame', 'magic', 'quest',
    'glory', 'noble', 'brave', 'spear', 'shield', 'jewel', 'blade', 'crown', 'might',
    'faith', 'dawn', 'dusk', 'wrath', 'peace', 'lance', 'vault', 'realm', 'forge',
  ],
  ne: [
    'namaste', 'pani', 'bato', 'ghar', 'phul', 'rukh', 'agni', 'surya', 'chandra',
    'tara', 'pahad', 'khola', 'jangal', 'sahar', 'gaun', 'maya', 'sathi', 'desh',
    'nepal', 'himalaya', 'kathmandu', 'pokhara', 'lumbini', 'bagmati', 'manche',
    'samaj', 'bahan', 'daju', 'bhai', 'aama', 'baba', 'prem', 'sapana',
  ],
  hi: [
    'namaste', 'paani', 'phool', 'agni', 'suraj', 'chand', 'tara', 'pahad', 'nadi',
    'jungle', 'raja', 'rani', 'veer', 'sena', 'bharat', 'himalaya', 'ganga', 'yamuna',
    'rakshasa', 'dhanu', 'baan', 'shakti', 'dharma', 'satya', 'yuddha', 'vijay',
    'priya', 'milan', 'seva', 'prem', 'jal', 'vayu', 'akash', 'prithvi',
  ],
}

// ── Difficulty ────────────────────────────────────────────────────────────────

const DIFFICULTIES = {
  easy:   { label: 'Easy',   spawnMs: 4000, speedPerSec: 4,  maxOnScreen: 5  },
  medium: { label: 'Medium', spawnMs: 2500, speedPerSec: 7,  maxOnScreen: 7  },
  hard:   { label: 'Hard',   spawnMs: 1500, speedPerSec: 12, maxOnScreen: 10 },
}

const LANGS = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'ne', label: 'Nepali',  flag: '🇳🇵' },
  { code: 'hi', label: 'Hindi',   flag: '🇮🇳' },
]

const MAX_LIVES    = 5
const PTS_PER_KILL = 10

// ── Types ─────────────────────────────────────────────────────────────────────

interface Enemy {
  id: string
  word: string
  x: number
  y: number
  speed: number
  exploding: boolean
}

type Phase = 'lobby' | 'playing' | 'over'
type Diff  = keyof typeof DIFFICULTIES

interface GS {
  enemies:    Enemy[]
  lives:      number
  score:      number
  spawnTimer: number
  lastTs:     number
  usedWords:  Set<string>
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function RamayanaGame() {
  const navigate = useNavigate()

  const [lang,     setLang]     = useState('en')
  const [diff,     setDiff]     = useState<Diff>('easy')
  const [phase,    setPhase]    = useState<Phase>('lobby')
  const [enemies,  setEnemies]  = useState<Enemy[]>([])
  const [lives,    setLives]    = useState(MAX_LIVES)
  const [score,    setScore]    = useState(0)
  const [typed,    setTyped]    = useState('')
  const [shakeKey, setShakeKey] = useState(0)

  const gameRef  = useRef<GS>({ enemies: [], lives: MAX_LIVES, score: 0, spawnTimer: 0, lastTs: 0, usedWords: new Set() })
  const phaseRef = useRef<Phase>('lobby')
  const cfgRef   = useRef(DIFFICULTIES[diff])
  const bankRef  = useRef(WORD_BANKS[lang])
  const rafRef   = useRef<number>()
  const tickRef  = useRef<(ts: number) => void>(() => {})
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { cfgRef.current = DIFFICULTIES[diff] }, [diff])
  useEffect(() => { bankRef.current = WORD_BANKS[lang] ?? WORD_BANKS.en }, [lang])
  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }, [])

  // ── Game tick (reassigned each render for fresh closure) ──────────────────

  tickRef.current = (ts: number) => {
    if (phaseRef.current !== 'playing') return

    const g   = gameRef.current
    const cfg = cfgRef.current
    const dt  = Math.min((ts - g.lastTs) / 1000, 0.1)
    g.lastTs  = ts

    // Spawn
    g.spawnTimer += dt * 1000
    if (g.spawnTimer >= cfg.spawnMs) {
      g.spawnTimer = 0
      if (g.enemies.filter(e => !e.exploding).length < cfg.maxOnScreen) {
        const bank  = bankRef.current
        const avail = bank.filter(w => !g.usedWords.has(w))
        const pool  = avail.length > 0 ? avail : bank
        const word  = pool[Math.floor(Math.random() * pool.length)]
        g.usedWords.add(word)
        if (g.usedWords.size > bank.length * 0.8) g.usedWords.clear()

        g.enemies = [...g.enemies, {
          id:        crypto.randomUUID(),
          word,
          x:         8 + Math.random() * 72,
          y:         -12,
          speed:     cfg.speedPerSec * (0.75 + Math.random() * 0.5),
          exploding: false,
        }]
        setEnemies([...g.enemies])
      }
    }

    // Move
    let lostLife = false
    const next: Enemy[] = []
    for (const e of g.enemies) {
      if (e.exploding) { next.push(e); continue }
      const ny = e.y + e.speed * dt
      if (ny >= 100) { lostLife = true } else { next.push({ ...e, y: ny }) }
    }
    g.enemies = next
    setEnemies([...next])

    if (lostLife) {
      g.lives -= 1
      setLives(g.lives)
      setShakeKey(k => k + 1)
      if (g.lives <= 0) {
        phaseRef.current = 'over'
        setPhase('over')
        return
      }
    }

    rafRef.current = requestAnimationFrame(ts => tickRef.current(ts))
  }

  // ── Start ─────────────────────────────────────────────────────────────────

  function startGame() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    gameRef.current = {
      enemies: [], lives: MAX_LIVES, score: 0,
      spawnTimer: cfgRef.current.spawnMs,
      lastTs: performance.now(),
      usedWords: new Set(),
    }
    phaseRef.current = 'playing'
    setEnemies([]); setLives(MAX_LIVES); setScore(0); setTyped('')
    setPhase('playing')
    rafRef.current = requestAnimationFrame(ts => tickRef.current(ts))
    setTimeout(() => inputRef.current?.focus(), 80)
  }

  // ── Input ─────────────────────────────────────────────────────────────────

  const trimmed = typed.trim()
  const target  = trimmed ? enemies.find(e => !e.exploding && e.word.startsWith(trimmed)) ?? null : null

  function handleInput(val: string) {
    setTyped(val)
    const t = val.trim()
    if (!t) return
    const g   = gameRef.current
    const hit = g.enemies.find(e => !e.exploding && e.word === t)
    if (!hit) return

    g.enemies = g.enemies.map(e => e.id === hit.id ? { ...e, exploding: true } : e)
    setEnemies([...g.enemies])
    setTimeout(() => {
      gameRef.current.enemies = gameRef.current.enemies.filter(e => e.id !== hit.id)
      setEnemies([...gameRef.current.enemies])
    }, 450)

    g.score += PTS_PER_KILL
    setScore(g.score)
    setTyped('')
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden select-none">

      {/* Header */}
      <header className="shrink-0 flex items-center justify-between px-4 py-2.5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 z-20">
        <button
          onClick={() => { if (rafRef.current) cancelAnimationFrame(rafRef.current); navigate(-1) }}
          className="text-sm text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
        >
          ← Menu
        </button>
        <div className="text-center">
          <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">Ramayana Battle</p>
          {phase === 'playing' && (
            <p className="text-[10px] text-slate-400">
              {LANGS.find(l => l.code === lang)?.label} · {DIFFICULTIES[diff].label}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {phase === 'playing' && (
            <>
              <span className="text-sm font-bold text-amber-500">🏆 {score}</span>
              <div className="flex">
                {Array.from({ length: MAX_LIVES }, (_, i) => (
                  <Heart key={i} className={cn('size-4', i < lives ? 'fill-red-500 text-red-500' : 'text-slate-200 dark:text-slate-700')} />
                ))}
              </div>
            </>
          )}
        </div>
      </header>

      {/* ── Lobby ── */}
      {phase === 'lobby' && (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-sm space-y-7 text-center">
            <div>
              <div className="text-7xl mb-3 leading-none">🏹</div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Ramayana Battle</h1>
              <p className="mt-2 text-slate-500 text-sm">Defeat Ravana's demons — type the word to fire your arrow!</p>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Language</p>
              <div className="flex gap-2">
                {LANGS.map(l => (
                  <button
                    key={l.code}
                    onClick={() => setLang(l.code)}
                    className={cn(
                      'flex-1 py-2.5 rounded-xl text-sm font-medium border-2 transition-all',
                      lang === l.code
                        ? 'border-amber-500 bg-amber-500 text-white'
                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-amber-300'
                    )}
                  >
                    {l.flag} {l.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Difficulty</p>
              <div className="flex gap-2">
                {(Object.keys(DIFFICULTIES) as Diff[]).map(d => (
                  <button
                    key={d}
                    onClick={() => setDiff(d)}
                    className={cn(
                      'flex-1 py-2.5 rounded-xl text-sm font-medium border-2 transition-all',
                      diff === d
                        ? 'border-amber-500 bg-amber-500 text-white'
                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-amber-300'
                    )}
                  >
                    {DIFFICULTIES[d].label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={startGame}
              className="w-full py-4 rounded-2xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold text-lg transition-all shadow-lg shadow-amber-200 dark:shadow-amber-900/30"
            >
              ⚔️ Start Battle
            </button>
          </div>
        </div>
      )}

      {/* ── Playing ── */}
      {phase === 'playing' && (
        <motion.div
          key={shakeKey}
          animate={shakeKey > 0 ? { x: [-10, 10, -7, 7, -3, 3, 0] } : { x: 0 }}
          transition={{ duration: 0.4 }}
          className="relative flex-1 overflow-hidden cursor-text"
          onClick={() => inputRef.current?.focus()}
        >
          {/* Sky gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-blue-50 via-slate-50 to-amber-50/40 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900" />

          {/* Ground */}
          <div className="absolute bottom-16 left-0 right-0 h-0.5 bg-slate-200 dark:bg-slate-800" />

          {/* Rama */}
          <div className="absolute bottom-[4.5rem] left-5 flex flex-col items-center z-10">
            <div className="relative text-4xl leading-none">
              <span>🧝</span>
              <span className="absolute -right-3 top-1 text-2xl">🏹</span>
            </div>
            <span className="text-[9px] font-black tracking-widest text-amber-700 dark:text-amber-400 mt-0.5">RAMA</span>
          </div>

          {/* Enemies */}
          <AnimatePresence>
            {enemies.map(enemy => {
              const isTarget = target?.id === enemy.id
              const done = enemy.word.slice(0, isTarget ? trimmed.length : 0)
              const rest = enemy.word.slice(done.length)

              return (
                <motion.div
                  key={enemy.id}
                  initial={{ scale: 0.3, opacity: 0 }}
                  animate={enemy.exploding
                    ? { scale: 2.5, opacity: 0, y: -30 }
                    : { scale: 1, opacity: 1, y: 0 }
                  }
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ duration: enemy.exploding ? 0.4 : 0.15 }}
                  className="absolute flex flex-col items-center pointer-events-none"
                  style={{ left: `${enemy.x}%`, top: `${enemy.y}%`, transform: 'translateX(-50%)' }}
                >
                  {/* Word card */}
                  <div className={cn(
                    'px-3 py-1 rounded-lg border font-mono text-sm font-bold whitespace-nowrap shadow-sm mb-1.5 transition-colors',
                    isTarget
                      ? 'bg-amber-50 border-amber-400 dark:bg-amber-950/50 dark:border-amber-500'
                      : 'bg-white border-slate-200 dark:bg-slate-800 dark:border-slate-600'
                  )}>
                    <span className="text-amber-500">{done}</span>
                    <span className="text-slate-800 dark:text-slate-100">{rest}</span>
                  </div>

                  {/* Demon */}
                  {enemy.exploding ? (
                    <span className="text-3xl">💥</span>
                  ) : (
                    <motion.span
                      className="text-3xl leading-none"
                      animate={{ y: [0, -4, 0] }}
                      transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      👹
                    </motion.span>
                  )}
                </motion.div>
              )
            })}
          </AnimatePresence>

          {/* Input box */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-72 z-20">
            <input
              ref={inputRef}
              type="text"
              value={typed}
              onChange={e => handleInput(e.target.value)}
              placeholder="Type here..."
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              className={cn(
                'w-full rounded-2xl border-2 bg-white dark:bg-slate-900 px-5 py-3',
                'text-center font-mono text-base outline-none shadow-lg transition-colors',
                target
                  ? 'border-amber-400 dark:border-amber-500'
                  : 'border-slate-300 dark:border-slate-600 focus:border-amber-300 dark:focus:border-amber-600'
              )}
            />
          </div>
        </motion.div>
      )}

      {/* ── Game Over ── */}
      {phase === 'over' && (
        <div className="flex-1 flex items-center justify-center p-6">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-sm text-center space-y-6"
          >
            <div>
              <div className="text-7xl mb-3">💀</div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Defeated!</h2>
              <p className="text-slate-500 mt-1 text-sm">Ravana's demons have prevailed.</p>
            </div>
            <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-6">
              <p className="text-5xl font-bold text-amber-500">{score}</p>
              <p className="text-sm text-slate-500 mt-1">points earned</p>
              <p className="text-xs text-slate-400 mt-1">
                {Math.round(score / PTS_PER_KILL)} demon{score / PTS_PER_KILL !== 1 ? 's' : ''} defeated
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={startGame}
                className="flex-1 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold transition-all shadow-md"
              >
                ⚔️ Retry
              </button>
              <button
                onClick={() => setPhase('lobby')}
                className="flex-1 py-3.5 rounded-2xl border-2 border-slate-200 dark:border-slate-700 hover:border-amber-400 font-medium text-slate-700 dark:text-slate-300 transition-colors"
              >
                Menu
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
