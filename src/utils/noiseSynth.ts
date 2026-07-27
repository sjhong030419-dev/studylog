export type SoundId = 'rain' | 'library' | 'bgm'

interface SoundHandle {
  gain: GainNode
  stop: () => void
}

let audioCtx: AudioContext | null = null
const activeHandles = new Map<SoundId, SoundHandle>()

function getContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext()
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume()
  }
  return audioCtx
}

function createNoiseBuffer(ctx: AudioContext, seconds = 3): AudioBuffer {
  const length = ctx.sampleRate * seconds
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < length; i++) {
    data[i] = Math.random() * 2 - 1
  }
  return buffer
}

function startRain(ctx: AudioContext): SoundHandle {
  const noise = ctx.createBufferSource()
  noise.buffer = createNoiseBuffer(ctx)
  noise.loop = true

  const filter = ctx.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.value = 1000
  filter.Q.value = 0.6

  const gain = ctx.createGain()
  gain.gain.value = 0

  noise.connect(filter).connect(gain).connect(ctx.destination)
  noise.start()

  return { gain, stop: () => noise.stop() }
}

function startLibrary(ctx: AudioContext): SoundHandle {
  const noise = ctx.createBufferSource()
  noise.buffer = createNoiseBuffer(ctx)
  noise.loop = true

  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 700

  const gain = ctx.createGain()
  gain.gain.value = 0

  noise.connect(filter).connect(gain).connect(ctx.destination)
  noise.start()

  return { gain, stop: () => noise.stop() }
}

function startBgm(ctx: AudioContext): SoundHandle {
  const gain = ctx.createGain()
  gain.gain.value = 0

  const osc1 = ctx.createOscillator()
  osc1.type = 'sine'
  osc1.frequency.value = 220

  const osc2 = ctx.createOscillator()
  osc2.type = 'sine'
  osc2.frequency.value = 277.18

  const tremolo = ctx.createOscillator()
  tremolo.frequency.value = 0.12
  const tremoloGain = ctx.createGain()
  tremoloGain.gain.value = 0.15
  tremolo.connect(tremoloGain).connect(gain.gain)

  osc1.connect(gain)
  osc2.connect(gain)
  gain.connect(ctx.destination)

  osc1.start()
  osc2.start()
  tremolo.start()

  return {
    gain,
    stop: () => {
      osc1.stop()
      osc2.stop()
      tremolo.stop()
    },
  }
}

const STARTERS: Record<SoundId, (ctx: AudioContext) => SoundHandle> = {
  rain: startRain,
  library: startLibrary,
  bgm: startBgm,
}

export function playSound(id: SoundId, volume: number) {
  if (activeHandles.has(id)) return
  const ctx = getContext()
  const handle = STARTERS[id](ctx)
  handle.gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.4)
  activeHandles.set(id, handle)
}

export function stopSound(id: SoundId) {
  const handle = activeHandles.get(id)
  if (!handle) return
  const ctx = getContext()
  handle.gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3)
  setTimeout(() => handle.stop(), 350)
  activeHandles.delete(id)
}

export function setSoundVolume(id: SoundId, volume: number) {
  const handle = activeHandles.get(id)
  if (!handle) return
  handle.gain.gain.value = volume
}

export function stopAllSounds() {
  for (const id of activeHandles.keys()) {
    stopSound(id)
  }
}
