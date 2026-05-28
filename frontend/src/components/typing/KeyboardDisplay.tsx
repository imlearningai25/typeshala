import { cn } from '@/utils/cn'

// ── Types ─────────────────────────────────────────────────────────────────────

type Finger =
  | 'left-pinky'
  | 'left-ring'
  | 'left-middle'
  | 'left-index'
  | 'thumb'
  | 'right-index'
  | 'right-middle'
  | 'right-ring'
  | 'right-pinky'

interface KeyDef {
  label: string
  shiftLabel?: string
  chars: string[]
  finger: Finger
  widthPx?: number
}

// ── Color theme per finger ────────────────────────────────────────────────────

const COLORS: Record<Finger, { idle: string; active: string; dot: string }> = {
  'left-pinky':   { idle: 'bg-pink-100 dark:bg-pink-900/50 text-pink-700 dark:text-pink-300 border-pink-300 dark:border-pink-700',             active: 'bg-pink-400 dark:bg-pink-500 text-white border-pink-500',       dot: 'bg-pink-400'   },
  'left-ring':    { idle: 'bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300 border-violet-300 dark:border-violet-700', active: 'bg-violet-400 dark:bg-violet-500 text-white border-violet-500', dot: 'bg-violet-400' },
  'left-middle':  { idle: 'bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300 border-sky-300 dark:border-sky-700',                   active: 'bg-sky-400 dark:bg-sky-500 text-white border-sky-500',           dot: 'bg-sky-400'    },
  'left-index':   { idle: 'bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300 border-teal-300 dark:border-teal-700',             active: 'bg-teal-400 dark:bg-teal-500 text-white border-teal-500',       dot: 'bg-teal-400'   },
  'thumb':        { idle: 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border-slate-300 dark:border-slate-600',          active: 'bg-slate-500 dark:bg-slate-400 text-white border-slate-500',     dot: 'bg-slate-500'  },
  'right-index':  { idle: 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700',       active: 'bg-amber-400 dark:bg-amber-500 text-white border-amber-500',     dot: 'bg-amber-400'  },
  'right-middle': { idle: 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-700', active: 'bg-orange-400 dark:bg-orange-500 text-white border-orange-500', dot: 'bg-orange-400' },
  'right-ring':   { idle: 'bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-700',             active: 'bg-rose-400 dark:bg-rose-500 text-white border-rose-500',       dot: 'bg-rose-400'   },
  'right-pinky':  { idle: 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700',                   active: 'bg-red-400 dark:bg-red-500 text-white border-red-500',           dot: 'bg-red-400'    },
}

// ── Keyboard layout ───────────────────────────────────────────────────────────

const KEY_W = 36  // standard key width px
const KEY_H = 36  // standard key height px

const ROWS: KeyDef[][] = [
  /* Number row */
  [
    { label: '`',   shiftLabel: '~', chars: ['`', '~'],    finger: 'left-pinky'   },
    { label: '1',   shiftLabel: '!', chars: ['1', '!'],    finger: 'left-pinky'   },
    { label: '2',   shiftLabel: '@', chars: ['2', '@'],    finger: 'left-ring'    },
    { label: '3',   shiftLabel: '#', chars: ['3', '#'],    finger: 'left-middle'  },
    { label: '4',   shiftLabel: '$', chars: ['4', '$'],    finger: 'left-index'   },
    { label: '5',   shiftLabel: '%', chars: ['5', '%'],    finger: 'left-index'   },
    { label: '6',   shiftLabel: '^', chars: ['6', '^'],    finger: 'right-index'  },
    { label: '7',   shiftLabel: '&', chars: ['7', '&'],    finger: 'right-index'  },
    { label: '8',   shiftLabel: '*', chars: ['8', '*'],    finger: 'right-middle' },
    { label: '9',   shiftLabel: '(', chars: ['9', '('],    finger: 'right-ring'   },
    { label: '0',   shiftLabel: ')', chars: ['0', ')'],    finger: 'right-pinky'  },
    { label: '-',   shiftLabel: '_', chars: ['-', '_'],    finger: 'right-pinky'  },
    { label: '=',   shiftLabel: '+', chars: ['=', '+'],    finger: 'right-pinky'  },
    { label: '⌫',                    chars: ['Backspace'], finger: 'right-pinky', widthPx: 72 },
  ],
  /* QWERTY row */
  [
    { label: 'Tab',                   chars: [],           finger: 'left-pinky',  widthPx: 54 },
    { label: 'Q',                     chars: ['q', 'Q'],  finger: 'left-pinky'   },
    { label: 'W',                     chars: ['w', 'W'],  finger: 'left-ring'    },
    { label: 'E',                     chars: ['e', 'E'],  finger: 'left-middle'  },
    { label: 'R',                     chars: ['r', 'R'],  finger: 'left-index'   },
    { label: 'T',                     chars: ['t', 'T'],  finger: 'left-index'   },
    { label: 'Y',                     chars: ['y', 'Y'],  finger: 'right-index'  },
    { label: 'U',                     chars: ['u', 'U'],  finger: 'right-index'  },
    { label: 'I',                     chars: ['i', 'I'],  finger: 'right-middle' },
    { label: 'O',                     chars: ['o', 'O'],  finger: 'right-ring'   },
    { label: 'P',                     chars: ['p', 'P'],  finger: 'right-pinky'  },
    { label: '[',   shiftLabel: '{',  chars: ['[', '{'],  finger: 'right-pinky'  },
    { label: ']',   shiftLabel: '}',  chars: [']', '}'],  finger: 'right-pinky'  },
    { label: '\\',  shiftLabel: '|',  chars: ['\\', '|'], finger: 'right-pinky', widthPx: 54 },
  ],
  /* ASDF row */
  [
    { label: 'Caps',                  chars: [],           finger: 'left-pinky',  widthPx: 62 },
    { label: 'A',                     chars: ['a', 'A'],  finger: 'left-pinky'   },
    { label: 'S',                     chars: ['s', 'S'],  finger: 'left-ring'    },
    { label: 'D',                     chars: ['d', 'D'],  finger: 'left-middle'  },
    { label: 'F',                     chars: ['f', 'F'],  finger: 'left-index'   },
    { label: 'G',                     chars: ['g', 'G'],  finger: 'left-index'   },
    { label: 'H',                     chars: ['h', 'H'],  finger: 'right-index'  },
    { label: 'J',                     chars: ['j', 'J'],  finger: 'right-index'  },
    { label: 'K',                     chars: ['k', 'K'],  finger: 'right-middle' },
    { label: 'L',                     chars: ['l', 'L'],  finger: 'right-ring'   },
    { label: ';',   shiftLabel: ':',  chars: [';', ':'],  finger: 'right-pinky'  },
    { label: "'",   shiftLabel: '"',  chars: ["'", '"'],  finger: 'right-pinky'  },
    { label: '↵',                     chars: ['\n'],      finger: 'right-pinky', widthPx: 78 },
  ],
  /* ZXCV row */
  [
    { label: '⇧',                     chars: [],          finger: 'left-pinky',  widthPx: 82 },
    { label: 'Z',                     chars: ['z', 'Z'],  finger: 'left-pinky'   },
    { label: 'X',                     chars: ['x', 'X'],  finger: 'left-ring'    },
    { label: 'C',                     chars: ['c', 'C'],  finger: 'left-middle'  },
    { label: 'V',                     chars: ['v', 'V'],  finger: 'left-index'   },
    { label: 'B',                     chars: ['b', 'B'],  finger: 'left-index'   },
    { label: 'N',                     chars: ['n', 'N'],  finger: 'right-index'  },
    { label: 'M',                     chars: ['m', 'M'],  finger: 'right-index'  },
    { label: ',',   shiftLabel: '<',  chars: [',', '<'],  finger: 'right-middle' },
    { label: '.',   shiftLabel: '>',  chars: ['.', '>'],  finger: 'right-ring'   },
    { label: '/',   shiftLabel: '?',  chars: ['/', '?'],  finger: 'right-pinky'  },
    { label: '⇧',                     chars: [],          finger: 'right-pinky', widthPx: 100 },
  ],
]

// Module-level char → finger map (built once)
const CHAR_TO_FINGER = new Map<string, Finger>()
for (const row of ROWS) {
  for (const key of row) {
    for (const ch of key.chars) CHAR_TO_FINGER.set(ch, key.finger)
  }
}
CHAR_TO_FINGER.set(' ', 'thumb')

// ── Hand diagram ──────────────────────────────────────────────────────────────

interface FingerBarProps {
  finger: Finger
  activeFinger: Finger | null
  height: number
  label: string
}

function FingerBar({ finger, activeFinger, height, label }: FingerBarProps) {
  const isActive = activeFinger === finger
  return (
    <div
      className={cn(
        'w-8 rounded-t-xl border-2 flex items-start justify-center pt-1.5 text-[10px] font-bold',
        'transition-all duration-150 select-none',
        isActive
          ? cn(COLORS[finger].active, '-translate-y-2 shadow-lg scale-105')
          : COLORS[finger].idle
      )}
      style={{ height }}
    >
      {label}
    </div>
  )
}

function Hand({ side, activeFinger }: { side: 'left' | 'right'; activeFinger: Finger | null }) {
  const fingers =
    side === 'left'
      ? [
          { f: 'left-pinky'  as Finger, label: 'P', h: 52 },
          { f: 'left-ring'   as Finger, label: 'R', h: 68 },
          { f: 'left-middle' as Finger, label: 'M', h: 76 },
          { f: 'left-index'  as Finger, label: 'I', h: 68 },
        ]
      : [
          { f: 'right-index'  as Finger, label: 'I', h: 68 },
          { f: 'right-middle' as Finger, label: 'M', h: 76 },
          { f: 'right-ring'   as Finger, label: 'R', h: 68 },
          { f: 'right-pinky'  as Finger, label: 'P', h: 52 },
        ]

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-end gap-1">
        {fingers.map(({ f, label, h }) => (
          <FingerBar key={f} finger={f} activeFinger={activeFinger} height={h} label={label} />
        ))}
      </div>
      <div className="w-full h-6 rounded-b-xl bg-slate-100 dark:bg-slate-800 border border-t-0 border-slate-200 dark:border-slate-700 flex items-center justify-center">
        <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium">
          {side === 'left' ? 'Left' : 'Right'}
        </span>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

interface KeyboardDisplayProps {
  currentChar?: string
  className?: string
}

export function KeyboardDisplay({ currentChar, className }: KeyboardDisplayProps) {
  const activeFinger = currentChar !== undefined ? (CHAR_TO_FINGER.get(currentChar) ?? null) : null
  const spaceIsActive = currentChar === ' '

  function renderKey(key: KeyDef, idx: number) {
    const isActive = currentChar !== undefined && key.chars.includes(currentChar)
    const w = key.widthPx ?? KEY_W
    return (
      <div
        key={idx}
        className={cn(
          'rounded border-2 flex flex-col items-center justify-center select-none',
          'transition-all duration-100 shadow-sm',
          isActive
            ? cn(COLORS[key.finger].active, 'scale-95 translate-y-0.5 shadow-inner')
            : COLORS[key.finger].idle
        )}
        style={{ width: w, height: KEY_H, flexShrink: 0 }}
      >
        {key.shiftLabel && (
          <span className="text-[7px] leading-none opacity-60 font-mono">{key.shiftLabel}</span>
        )}
        <span className="text-[10px] leading-none font-medium font-mono">{key.label}</span>
      </div>
    )
  }

  // Row stagger offsets (px) — matches a real keyboard
  const ROW_INDENT = [0, 14, 22, 36]

  return (
    <div className={cn('flex flex-col items-center gap-4', className)}>
      {/* Keyboard */}
      <div className="overflow-x-auto w-full">
        <div className="inline-flex flex-col gap-1 p-3 rounded-2xl bg-slate-200 dark:bg-slate-900 shadow-inner mx-auto">
          {ROWS.map((row, rowIdx) => (
            <div key={rowIdx} className="flex gap-1" style={{ paddingLeft: ROW_INDENT[rowIdx] }}>
              {row.map((key, keyIdx) => renderKey(key, keyIdx))}
            </div>
          ))}

          {/* Space bar row */}
          <div className="flex items-center gap-1 justify-center">
            {(['⌃', '⌥'] as const).map((label, i) => (
              <div
                key={i}
                className="rounded border-2 flex items-center justify-center text-[9px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-300 dark:border-slate-600 shadow-sm"
                style={{ width: 36, height: KEY_H - 4, flexShrink: 0 }}
              >
                {label}
              </div>
            ))}
            <div
              className="rounded border-2 flex items-center justify-center text-[9px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-300 dark:border-slate-600 shadow-sm"
              style={{ width: 46, height: KEY_H - 4, flexShrink: 0 }}
            >
              ⌘
            </div>
            {/* Space key */}
            <div
              className={cn(
                'rounded border-2 flex items-center justify-center transition-all duration-100 shadow-sm',
                spaceIsActive
                  ? cn(COLORS['thumb'].active, 'scale-95 translate-y-0.5 shadow-inner')
                  : COLORS['thumb'].idle
              )}
              style={{ width: 240, height: KEY_H - 4, flexShrink: 0 }}
            />
            <div
              className="rounded border-2 flex items-center justify-center text-[9px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-300 dark:border-slate-600 shadow-sm"
              style={{ width: 46, height: KEY_H - 4, flexShrink: 0 }}
            >
              ⌘
            </div>
            {(['⌥', '⌃'] as const).map((label, i) => (
              <div
                key={i}
                className="rounded border-2 flex items-center justify-center text-[9px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-300 dark:border-slate-600 shadow-sm"
                style={{ width: 36, height: KEY_H - 4, flexShrink: 0 }}
              >
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hand diagrams */}
      <div className="flex items-end gap-10 justify-center">
        <Hand side="left" activeFinger={activeFinger} />

        {/* Thumb / space indicator */}
        <div className="flex flex-col items-center gap-1 pb-6">
          <div
            className={cn(
              'rounded-full border-2 flex items-center justify-center text-[9px] font-bold w-8 h-8',
              'transition-all duration-150',
              activeFinger === 'thumb'
                ? cn(COLORS['thumb'].active, '-translate-y-1 shadow-md scale-110')
                : COLORS['thumb'].idle
            )}
          >
            T
          </div>
          <span className="text-[9px] text-slate-400 dark:text-slate-500">Space</span>
        </div>

        <Hand side="right" activeFinger={activeFinger} />
      </div>

      {/* Finger legend */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 justify-center">
        {(Object.keys(COLORS) as Finger[]).map(f => (
          <div key={f} className="flex items-center gap-1">
            <div className={cn('w-2 h-2 rounded-full', COLORS[f].dot)} />
            <span className="text-[10px] text-slate-400 dark:text-slate-500 capitalize">
              {f.replace('-', ' ')}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
