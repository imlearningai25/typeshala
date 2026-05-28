import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart } from 'lucide-react'
import { cn } from '@/utils/cn'

// ── Word banks ────────────────────────────────────────────────────────────────

const WORD_BANKS: Record<string, string[]> = {
  en: [
    // Nature
    'fire', 'ocean', 'flower', 'wind', 'tree', 'moon', 'star', 'river', 'cloud',
    'forest', 'thunder', 'earth', 'sky', 'rain', 'storm', 'snow', 'frost', 'flame',
    'wave', 'lake', 'cave', 'peak', 'gale', 'mist', 'dew', 'grove', 'cliff',
    'blaze', 'flood', 'brook', 'marsh', 'reef', 'dune', 'vale', 'ash',
    // Battle / Ramayana theme
    'sword', 'arrow', 'warrior', 'demon', 'king', 'hero', 'victory', 'glory',
    'noble', 'brave', 'spear', 'shield', 'jewel', 'blade', 'crown', 'might',
    'faith', 'wrath', 'lance', 'realm', 'forge', 'quest', 'honor', 'light',
    'shadow', 'truth', 'magic', 'power', 'speed', 'grace', 'dawn', 'dusk',
    'peace', 'vault', 'flare', 'crest', 'valor', 'siege', 'march', 'duel',
    'exile', 'truce', 'oath', 'throne', 'guard', 'scout', 'siege', 'pyre',
    // Animals
    'tiger', 'lion', 'eagle', 'hawk', 'bear', 'wolf', 'crane', 'cobra', 'boar',
    'deer', 'swan', 'raven', 'stag', 'lynx', 'kite', 'ox',
    // Common short words (great for beginners)
    'dust', 'gust', 'rush', 'hush', 'glow', 'flow', 'grip', 'trip', 'slip',
    'drip', 'skip', 'snap', 'clap', 'trap', 'wrap', 'step', 'stem', 'slab',
    'claw', 'flaw', 'draw', 'straw', 'thaw', 'gnaw', 'plot', 'slot', 'knot',
    'shot', 'blot', 'clot', 'spot', 'drop', 'crop', 'prop', 'stop', 'swap',
  ],
}

// ── Config ────────────────────────────────────────────────────────────────────

const DIFFICULTIES = {
  easy:   { label: 'Easy',   spawnMs: 4000, speedPerSec: 4,  maxOnScreen: 5,  timeLimit: 120 },
  medium: { label: 'Medium', spawnMs: 2500, speedPerSec: 7,  maxOnScreen: 7,  timeLimit: 90  },
  hard:   { label: 'Hard',   spawnMs: 1500, speedPerSec: 12, maxOnScreen: 10, timeLimit: 60  },
}

const LANG = 'en'

const MAX_LIVES    = 5
const PTS_PER_KILL = 10
const ARROW_MS     = 320

// ── Types ─────────────────────────────────────────────────────────────────────

interface Enemy {
  id: string
  word: string
  x: number
  y: number
  speed: number
  exploding: boolean
}

interface ArrowFire {
  id: string
  fromX: number
  fromY: number
  dx: number
  dy: number
  angle: number
}

type Phase   = 'lobby' | 'playing' | 'over'
type Diff    = keyof typeof DIFFICULTIES
type Outcome = 'victory' | 'defeat'

interface GS {
  enemies:    Enemy[]
  lives:      number
  score:      number
  demons:     number   // total defeated count
  spawnTimer: number
  lastTs:     number
  usedWords:  Set<string>
  timeLeft:   number   // countdown seconds
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtTime(s: number) {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s) % 60
  return `${m}:${String(sec).padStart(2, '0')}`
}

function ArrowSprite() {
  return (
    <svg width="56" height="10" viewBox="0 0 56 10" fill="none">
      <rect x="0" y="4" width="42" height="2.5" rx="1" fill="#92400e" />
      <polygon points="42,0 56,5 42,10" fill="#d97706" />
      <polygon points="0,5 8,1 6,5" fill="#b45309" />
      <polygon points="0,5 8,9 6,5" fill="#b45309" />
    </svg>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function RamayanaGame() {
  const navigate = useNavigate()

  const [diff, setDiff] = useState<Diff>('easy')

  // Game render state
  const [phase,     setPhase]     = useState<Phase>('lobby')
  const [outcome,   setOutcome]   = useState<Outcome>('defeat')
  const [enemies,   setEnemies]   = useState<Enemy[]>([])
  const [lives,     setLives]     = useState(MAX_LIVES)
  const [score,     setScore]     = useState(0)
  const [demons,    setDemons]    = useState(0)
  const [typed,     setTyped]     = useState('')
  const [timeLeft,  setTimeLeft]  = useState(0)
  const [nextWord,  setNextWord]  = useState('')
  const [shakeKey,  setShakeKey]  = useState(0)
  const [arrows,    setArrows]    = useState<ArrowFire[]>([])
  const [ramaShoot, setRamaShoot] = useState(0)

  // Refs (game loop reads these without stale closures)
  const gameRef      = useRef<GS>({ enemies: [], lives: MAX_LIVES, score: 0, demons: 0, spawnTimer: 0, lastTs: 0, usedWords: new Set(), timeLeft: 0 })
  const phaseRef     = useRef<Phase>('lobby')
  const cfgRef       = useRef(DIFFICULTIES[diff])
  const bankRef      = useRef(WORD_BANKS[LANG])
  const rafRef       = useRef<number>()
  const tickRef      = useRef<(ts: number) => void>(() => {})
  const inputRef     = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  // The word queued to spawn next — guarantees preview matches reality
  const queuedWordRef  = useRef<string>('')
  // Tracks last displayed second so we only re-render once per second
  const displaySecRef  = useRef<number>(0)

  useEffect(() => { cfgRef.current = DIFFICULTIES[diff] }, [diff])
  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }, [])

  // ── Word picker ───────────────────────────────────────────────────────────

  function pickWord(g: GS): string {
    const bank  = bankRef.current
    const avail = bank.filter(w => !g.usedWords.has(w))
    const pool  = avail.length > 0 ? avail : bank
    const word  = pool[Math.floor(Math.random() * pool.length)]
    g.usedWords.add(word)
    if (g.usedWords.size > bank.length * 0.8) g.usedWords.clear()
    return word
  }

  // ── Tick ──────────────────────────────────────────────────────────────────

  tickRef.current = (ts: number) => {
    if (phaseRef.current !== 'playing') return

    const g   = gameRef.current
    const cfg = cfgRef.current
    const dt  = Math.min((ts - g.lastTs) / 1000, 0.1)
    g.lastTs  = ts

    // ── Countdown timer ──
    g.timeLeft -= dt
    // Use ceil so 119.98s still shows "120" — avoids a phantom jump on frame 1
    const displaySec = Math.max(0, Math.ceil(g.timeLeft))
    if (displaySec !== displaySecRef.current) {
      displaySecRef.current = displaySec
      setTimeLeft(displaySec)
    }

    if (g.timeLeft <= 0) {
      // Timer ran out — check outcome
      const won = g.lives > 0
      phaseRef.current = 'over'
      setOutcome(won ? 'victory' : 'defeat')
      setPhase('over')
      return
    }

    // ── Spawn ──
    g.spawnTimer += dt * 1000
    if (g.spawnTimer >= cfg.spawnMs) {
      g.spawnTimer = 0
      if (g.enemies.filter(e => !e.exploding).length < cfg.maxOnScreen) {
        // Use the pre-queued word so the preview always matches what drops
        const word = queuedWordRef.current
        g.enemies = [...g.enemies, {
          id: crypto.randomUUID(), word,
          x: 8 + Math.random() * 72, y: -12,
          speed: cfg.speedPerSec * (0.75 + Math.random() * 0.5),
          exploding: false,
        }]
        setEnemies([...g.enemies])
        // Queue and display the word that will drop AFTER this one
        const upcoming = pickWord(g)
        queuedWordRef.current = upcoming
        setNextWord(upcoming)
      }
    }

    // ── Move demons ──
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
        setOutcome('defeat')
        setPhase('over')
        return
      }
    }

    rafRef.current = requestAnimationFrame(ts => tickRef.current(ts))
  }

  // ── Start ─────────────────────────────────────────────────────────────────

  function startGame() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    const cfg = DIFFICULTIES[diff]
    cfgRef.current = cfg
    bankRef.current = WORD_BANKS[LANG]

    const g: GS = {
      enemies: [], lives: MAX_LIVES, score: 0, demons: 0,
      spawnTimer: cfg.spawnMs, // spawn first demon immediately
      lastTs: performance.now(),
      usedWords: new Set(),
      timeLeft: cfg.timeLimit,
    }
    gameRef.current = g

    // Queue the word the first enemy will use, then the word the preview shows
    queuedWordRef.current = pickWord(g)
    const firstPreview = pickWord(g)
    displaySecRef.current = cfg.timeLimit

    phaseRef.current = 'playing'
    setEnemies([]); setLives(MAX_LIVES); setScore(0); setDemons(0)
    setTyped(''); setArrows([]); setRamaShoot(0)
    setTimeLeft(cfg.timeLimit)
    setNextWord(firstPreview)
    setPhase('playing')
    rafRef.current = requestAnimationFrame(ts => tickRef.current(ts))
    setTimeout(() => inputRef.current?.focus(), 80)
  }

  // ── Input / arrow fire ────────────────────────────────────────────────────

  const trimmed = typed.trim()
  const target  = trimmed ? enemies.find(e => !e.exploding && e.word.startsWith(trimmed)) ?? null : null

  function handleInput(val: string) {
    setTyped(val)
    const t = val.trim()
    if (!t) return
    const g   = gameRef.current
    const hit = g.enemies.find(e => !e.exploding && e.word === t)
    if (!hit) return

    // Fire arrow
    const container = containerRef.current
    if (container) {
      const rect   = container.getBoundingClientRect()
      const ramaX  = 44
      const ramaY  = rect.height - 88
      const enemyX = (hit.x / 100) * rect.width
      const enemyY = (hit.y / 100) * rect.height
      const dx     = enemyX - ramaX
      const dy     = enemyY - ramaY
      const angle  = Math.atan2(dy, dx) * (180 / Math.PI)
      const arrow: ArrowFire = { id: crypto.randomUUID(), fromX: ramaX, fromY: ramaY, dx, dy, angle }
      setArrows(prev => [...prev, arrow])
      setTimeout(() => setArrows(prev => prev.filter(a => a.id !== arrow.id)), ARROW_MS + 100)
    }

    setRamaShoot(k => k + 1)

    setTimeout(() => {
      gameRef.current.enemies = gameRef.current.enemies.map(e =>
        e.id === hit.id ? { ...e, exploding: true } : e
      )
      setEnemies([...gameRef.current.enemies])
    }, ARROW_MS)

    setTimeout(() => {
      gameRef.current.enemies = gameRef.current.enemies.filter(e => e.id !== hit.id)
      setEnemies([...gameRef.current.enemies])
    }, ARROW_MS + 400)

    g.score  += PTS_PER_KILL
    g.demons += 1
    setScore(g.score)
    setDemons(g.demons)
    setTyped('')
  }

  // ── Derived display ───────────────────────────────────────────────────────

  const spawnProgress = phase === 'playing'
    ? gameRef.current.spawnTimer / cfgRef.current.spawnMs
    : 0

  const isUrgent  = timeLeft <= 10
  const isWarning = timeLeft <= 30 && !isUrgent
  const timePlayed = DIFFICULTIES[diff].timeLimit - timeLeft

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-screen bg-slate-950 overflow-hidden select-none">

      {/* ── Header ── */}
      <header className="shrink-0 flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800 z-20">
        <button
          onClick={() => { if (rafRef.current) cancelAnimationFrame(rafRef.current); navigate(-1) }}
          className="text-sm text-slate-400 hover:text-white transition-colors"
        >
          ← Menu
        </button>

        {/* Countdown — prominent centre piece */}
        <div className="text-center">
          {phase === 'playing' ? (
            <motion.div
              animate={isUrgent ? { scale: [1, 1.08, 1] } : {}}
              transition={{ duration: 0.5, repeat: Infinity }}
            >
              <p className={cn(
                'text-2xl font-black font-mono tabular-nums leading-tight',
                isUrgent  ? 'text-red-400'   :
                isWarning ? 'text-amber-400' :
                            'text-white'
              )}>
                {fmtTime(timeLeft)}
              </p>
              <p className="text-[9px] text-slate-500 uppercase tracking-widest">
                English · {DIFFICULTIES[diff].label}
              </p>
            </motion.div>
          ) : (
            <p className="text-sm font-bold text-white">Ramayana Battle</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {phase === 'playing' && (
            <>
              <span className="text-sm font-bold text-amber-400">🏆 {score}</span>
              <div className="flex">
                {Array.from({ length: MAX_LIVES }, (_, i) => (
                  <Heart key={i} className={cn('size-4', i < lives ? 'fill-red-500 text-red-500' : 'text-slate-700')} />
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
              <h1 className="text-3xl font-bold text-white">Ramayana Battle</h1>
              <p className="mt-2 text-slate-400 text-sm">Type every word before the demons reach Rama!</p>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Difficulty</p>
              <div className="flex gap-2">
                {(Object.keys(DIFFICULTIES) as Diff[]).map(d => (
                  <button key={d} onClick={() => setDiff(d)}
                    className={cn('flex-1 rounded-xl text-sm font-medium border-2 transition-all py-2',
                      diff === d ? 'border-amber-500 bg-amber-500 text-white'
                                 : 'border-slate-700 text-slate-300 hover:border-amber-600')}>
                    <div>{DIFFICULTIES[d].label}</div>
                    <div className="text-[10px] opacity-70">{fmtTime(DIFFICULTIES[d].timeLimit)}</div>
                  </button>
                ))}
              </div>
            </div>

            <button onClick={startGame}
              className="w-full py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-white font-bold text-lg transition-all shadow-lg shadow-amber-900/50">
              ⚔️ Start Battle
            </button>
          </div>
        </div>
      )}

      {/* ── Playing ── */}
      {phase === 'playing' && (
        <motion.div
          ref={containerRef}
          key={shakeKey}
          animate={shakeKey > 0 ? { x: [-10, 10, -7, 7, -3, 3, 0] } : { x: 0 }}
          transition={{ duration: 0.4 }}
          className="relative flex-1 overflow-hidden cursor-text"
          onClick={() => inputRef.current?.focus()}
        >
          {/* Background */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#1e3a5f_0%,_#0f172a_60%,_#000_100%)]" />

          {/* Stars */}
          {[...Array(18)].map((_, i) => (
            <div key={i} className="absolute rounded-full bg-white opacity-60"
              style={{ width: i % 3 === 0 ? 2 : 1.5, height: i % 3 === 0 ? 2 : 1.5,
                left: `${5 + (i * 17 + i * 3) % 90}%`, top: `${5 + (i * 13 + i * 7) % 55}%` }} />
          ))}

          {/* ── Next word preview (top centre) ── */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1">
            <p className="text-[9px] font-semibold uppercase tracking-widest text-slate-500">Next incoming</p>
            <motion.div
              key={nextWord}
              initial={{ y: -8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="px-4 py-1.5 rounded-lg bg-slate-800/90 border border-slate-600 font-mono text-sm font-bold text-slate-200 shadow-lg"
            >
              {nextWord}
            </motion.div>
            {/* Spawn progress bar */}
            <div className="w-24 h-0.5 rounded-full bg-slate-800 overflow-hidden">
              <motion.div
                className="h-full bg-amber-500 rounded-full"
                style={{ width: `${spawnProgress * 100}%` }}
              />
            </div>
            <span className="text-[8px] text-slate-600">↓ dropping soon</span>
          </div>

          {/* Ground */}
          <div className="absolute bottom-[4rem] left-0 right-0 h-px bg-slate-700" />

          {/* ── Rama ── */}
          <motion.div
            key={ramaShoot}
            className="absolute bottom-[4.5rem] left-5 flex flex-col items-center z-10"
            animate={ramaShoot > 0 ? { scaleX: [1, 1.15, 0.9, 1], rotate: [0, -8, 3, 0] } : {}}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            style={{ originX: 0.5, originY: 1 }}
          >
            <div className="relative">
              <span className="text-4xl leading-none block" style={{ filter: 'hue-rotate(30deg) saturate(1.5)' }}>🧝</span>
              <motion.span
                className="absolute text-2xl leading-none"
                style={{ right: -8, top: 4 }}
                animate={ramaShoot > 0 ? { x: [0, 12, 0], opacity: [1, 0.4, 1] } : {}}
                transition={{ duration: 0.35 }}
              >
                🏹
              </motion.span>
            </div>
            <span className="text-[9px] font-black tracking-widest text-amber-400 mt-0.5">RAMA</span>
          </motion.div>

          {/* ── Arrows in flight ── */}
          <AnimatePresence>
            {arrows.map(arrow => (
              <motion.div key={arrow.id} className="absolute pointer-events-none z-30"
                style={{ left: arrow.fromX, top: arrow.fromY, rotate: arrow.angle, translateY: '-50%' }}
                animate={{ x: arrow.dx, y: arrow.dy }}
                transition={{ duration: ARROW_MS / 1000, ease: 'linear' }}>
                <ArrowSprite />
              </motion.div>
            ))}
          </AnimatePresence>

          {/* ── Enemies ── */}
          <AnimatePresence>
            {enemies.map(enemy => {
              const isTarget = target?.id === enemy.id
              const done = enemy.word.slice(0, isTarget ? trimmed.length : 0)
              const rest = enemy.word.slice(done.length)
              return (
                <motion.div key={enemy.id}
                  initial={{ scale: 0.3, opacity: 0 }}
                  animate={enemy.exploding ? { scale: 2.2, opacity: 0, y: -20 } : { scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ duration: enemy.exploding ? 0.35 : 0.15 }}
                  className="absolute flex flex-col items-center pointer-events-none"
                  style={{ left: `${enemy.x}%`, top: `${enemy.y}%`, transform: 'translateX(-50%)' }}
                >
                  <div className={cn(
                    'px-3 py-1.5 rounded-lg font-mono text-sm font-bold whitespace-nowrap mb-1.5 shadow-lg transition-all',
                    isTarget ? 'bg-amber-400 border-2 border-amber-300 text-slate-900 scale-105'
                             : 'bg-white border-2 border-slate-200 text-slate-900'
                  )}>
                    {isTarget ? (
                      <><span className="text-amber-900 font-black">{done}</span><span className="text-slate-700">{rest}</span></>
                    ) : <span>{enemy.word}</span>}
                  </div>
                  {enemy.exploding ? <span className="text-4xl leading-none">💥</span> : (
                    <motion.span className="text-3xl leading-none block"
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut', delay: Math.random() * 0.8 }}>
                      👹
                    </motion.span>
                  )}
                </motion.div>
              )
            })}
          </AnimatePresence>

          {/* ── Input ── */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-72 z-20">
            <input ref={inputRef} type="text" value={typed}
              onChange={e => handleInput(e.target.value)}
              placeholder="Type here..." autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false}
              className={cn(
                'w-full rounded-2xl border-2 px-5 py-3 text-center font-mono text-base outline-none',
                'shadow-xl transition-colors bg-slate-900 text-white placeholder-slate-500',
                target ? 'border-amber-400 shadow-amber-900/50' : 'border-slate-600 focus:border-amber-600'
              )}
            />
          </div>
        </motion.div>
      )}

      {/* ── Summary (Victory / Defeat) ── */}
      {phase === 'over' && (
        <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 20 }}
            animate={{ scale: 1,    opacity: 1, y: 0  }}
            transition={{ type: 'spring', duration: 0.6 }}
            className="w-full max-w-sm text-center space-y-5"
          >
            {outcome === 'victory' ? (
              <>
                {/* Victory */}
                <motion.div
                  animate={{ rotate: [0, -5, 5, -3, 3, 0] }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                >
                  <div className="text-7xl mb-2">🏆</div>
                  <div className="text-5xl mb-2">🧝‍♂️</div>
                </motion.div>
                <div>
                  <h2 className="text-3xl font-black text-amber-400">Rama Wins!</h2>
                  <p className="text-slate-300 mt-1 text-sm">Lord Rama has driven back Ravana's forces!</p>
                </div>

                <div className="rounded-2xl bg-amber-950/50 border border-amber-700 p-5 space-y-4">
                  <div className="text-5xl font-black text-amber-400">{score}</div>
                  <div className="text-xs text-amber-600 -mt-2">points</div>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="bg-slate-900/60 rounded-xl p-3">
                      <p className="text-xl font-bold text-white">{demons}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">demons slain</p>
                    </div>
                    <div className="bg-slate-900/60 rounded-xl p-3">
                      <p className="text-xl font-bold text-white font-mono">{fmtTime(timePlayed)}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">time played</p>
                    </div>
                    <div className="bg-slate-900/60 rounded-xl p-3">
                      <div className="flex justify-center gap-0.5">
                        {Array.from({ length: MAX_LIVES }, (_, i) => (
                          <Heart key={i} className={cn('size-3.5', i < lives ? 'fill-red-500 text-red-500' : 'text-slate-700')} />
                        ))}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">lives left</p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Defeat */}
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <div className="text-7xl mb-2">👹</div>
                </motion.div>
                <div>
                  <h2 className="text-3xl font-black text-red-400">Demons Prevail!</h2>
                  <p className="text-slate-400 mt-1 text-sm">Ravana's army has overwhelmed Lord Rama.</p>
                </div>

                <div className="rounded-2xl bg-red-950/40 border border-red-900 p-5 space-y-4">
                  <div className="text-5xl font-black text-amber-400">{score}</div>
                  <div className="text-xs text-slate-500 -mt-2">points</div>
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="bg-slate-900/60 rounded-xl p-3">
                      <p className="text-xl font-bold text-white">{demons}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">demons slain</p>
                    </div>
                    <div className="bg-slate-900/60 rounded-xl p-3">
                      <p className="text-xl font-bold text-white font-mono">{fmtTime(timePlayed)}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">survived</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500">
                    {fmtTime(Math.max(0, DIFFICULTIES[diff].timeLimit - timePlayed))} remaining when fallen
                  </p>
                </div>
              </>
            )}

            <div className="flex gap-3 pt-1">
              <button onClick={startGame}
                className="flex-1 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-white font-bold transition-all shadow-md">
                ⚔️ {outcome === 'victory' ? 'Play Again' : 'Retry'}
              </button>
              <button onClick={() => setPhase('lobby')}
                className="flex-1 py-3.5 rounded-2xl border-2 border-slate-700 hover:border-amber-600 font-medium text-slate-300 transition-colors">
                Menu
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
