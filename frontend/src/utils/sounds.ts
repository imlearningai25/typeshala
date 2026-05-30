import { useSoundStore } from '@/stores/sound.store'

let ctx: AudioContext | null = null

function isMuted(): boolean {
  return useSoundStore.getState().isMuted
}

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext()
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

export function playKeyClick(correct: boolean): void {
  if (isMuted()) return
  try {
    const c = getCtx()
    const now = c.currentTime
    const osc = c.createOscillator()
    const gain = c.createGain()
    osc.connect(gain)
    gain.connect(c.destination)

    if (correct) {
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(800, now)
      osc.frequency.exponentialRampToValueAtTime(500, now + 0.05)
      gain.gain.setValueAtTime(0.07, now)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05)
      osc.start(now)
      osc.stop(now + 0.05)
    } else {
      osc.type = 'sine'
      osc.frequency.setValueAtTime(160, now)
      gain.gain.setValueAtTime(0.1, now)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1)
      osc.start(now)
      osc.stop(now + 0.1)
    }
  } catch { /* audio unavailable */ }
}

export function playArrowFire(): void {
  if (isMuted()) return
  try {
    const c = getCtx()
    const now = c.currentTime

    // Bowstring pluck
    const pluck = c.createOscillator()
    const pluckGain = c.createGain()
    pluck.connect(pluckGain)
    pluckGain.connect(c.destination)
    pluck.type = 'sawtooth'
    pluck.frequency.setValueAtTime(280, now)
    pluck.frequency.exponentialRampToValueAtTime(70, now + 0.22)
    pluckGain.gain.setValueAtTime(0.18, now)
    pluckGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22)
    pluck.start(now)
    pluck.stop(now + 0.22)

    // Arrow whoosh (filtered noise)
    const bufSize = Math.floor(c.sampleRate * 0.18)
    const buf = c.createBuffer(1, bufSize, c.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1
    const noise = c.createBufferSource()
    noise.buffer = buf
    const bpf = c.createBiquadFilter()
    bpf.type = 'bandpass'
    bpf.frequency.setValueAtTime(2500, now)
    bpf.frequency.exponentialRampToValueAtTime(600, now + 0.18)
    bpf.Q.value = 1
    const whooshGain = c.createGain()
    noise.connect(bpf)
    bpf.connect(whooshGain)
    whooshGain.connect(c.destination)
    whooshGain.gain.setValueAtTime(0.07, now)
    whooshGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18)
    noise.start(now)
    noise.stop(now + 0.18)
  } catch { /* audio unavailable */ }
}

export function playDemonDeath(): void {
  if (isMuted()) return
  try {
    const c = getCtx()
    const now = c.currentTime

    // Impact thud
    const thud = c.createOscillator()
    const thudGain = c.createGain()
    thud.connect(thudGain)
    thudGain.connect(c.destination)
    thud.type = 'sine'
    thud.frequency.setValueAtTime(180, now)
    thud.frequency.exponentialRampToValueAtTime(35, now + 0.28)
    thudGain.gain.setValueAtTime(0.22, now)
    thudGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28)
    thud.start(now)
    thud.stop(now + 0.28)

    // Victory ping at arrow impact
    const ping = c.createOscillator()
    const pingGain = c.createGain()
    ping.connect(pingGain)
    pingGain.connect(c.destination)
    ping.type = 'triangle'
    ping.frequency.setValueAtTime(1400, now + 0.04)
    ping.frequency.exponentialRampToValueAtTime(700, now + 0.2)
    pingGain.gain.setValueAtTime(0.0001, now)
    pingGain.gain.setValueAtTime(0.09, now + 0.04)
    pingGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2)
    ping.start(now)
    ping.stop(now + 0.2)
  } catch { /* audio unavailable */ }
}

export function playLifeLost(): void {
  if (isMuted()) return
  try {
    const c = getCtx()
    const now = c.currentTime
    const osc = c.createOscillator()
    const gain = c.createGain()
    osc.connect(gain)
    gain.connect(c.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(420, now)
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.45)
    gain.gain.setValueAtTime(0.18, now)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45)
    osc.start(now)
    osc.stop(now + 0.45)
  } catch { /* audio unavailable */ }
}
