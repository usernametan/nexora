import { useEffect, useRef } from 'react'

function createNoiseBuffer(context) {
  const length = context.sampleRate * 2
  const buffer = context.createBuffer(1, length, context.sampleRate)
  const data = buffer.getChannelData(0)
  for (let index = 0; index < length; index += 1) {
    data[index] = Math.random() * 2 - 1
  }
  return buffer
}

export function useAmbientAudio(ambient, enabled) {
  const contextRef = useRef(null)

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return undefined
    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    if (!AudioContextClass) return undefined

    let context = contextRef.current
    if (!context || context.state === 'closed') {
      context = new AudioContextClass()
      contextRef.current = context
    }
    if (context.state === 'suspended') context.resume().catch(() => {})

    const master = context.createGain()
    master.gain.setValueAtTime(0, context.currentTime)
    master.gain.linearRampToValueAtTime(0.055, context.currentTime + 0.8)
    master.connect(context.destination)

    const sources = []
    const filter = context.createBiquadFilter()
    filter.type = 'lowpass'
    filter.connect(master)

    if (ambient === 'noise') {
      filter.frequency.value = 720
      const noise = context.createBufferSource()
      noise.buffer = createNoiseBuffer(context)
      noise.loop = true
      noise.connect(filter)
      noise.start()
      sources.push(noise)
    } else if (ambient === 'lofi') {
      filter.frequency.value = 1350
      const tremolo = context.createGain()
      tremolo.gain.value = 0.62
      tremolo.connect(filter)
      const lfo = context.createOscillator()
      const lfoDepth = context.createGain()
      lfo.frequency.value = 0.42
      lfoDepth.gain.value = 0.26
      lfo.connect(lfoDepth)
      lfoDepth.connect(tremolo.gain)
      lfo.start()
      sources.push(lfo)
      ;[196, 246.94, 293.66].forEach((frequency, index) => {
        const oscillator = context.createOscillator()
        const gain = context.createGain()
        oscillator.type = 'triangle'
        oscillator.frequency.value = frequency
        gain.gain.value = 0.16 / (index + 1)
        oscillator.connect(gain)
        gain.connect(tremolo)
        oscillator.start()
        sources.push(oscillator)
      })
    } else {
      filter.frequency.value = 380
      ;[55, 82.5, 110, 164.81].forEach((frequency, index) => {
        const oscillator = context.createOscillator()
        const gain = context.createGain()
        oscillator.type = index % 2 === 0 ? 'sine' : 'triangle'
        oscillator.frequency.value = frequency
        oscillator.detune.value = index * 3
        gain.gain.value = 0.2 / (index + 1)
        oscillator.connect(gain)
        gain.connect(filter)
        oscillator.start()
        sources.push(oscillator)
      })
    }

    return () => {
      const now = context.currentTime
      master.gain.cancelScheduledValues(now)
      master.gain.setValueAtTime(master.gain.value, now)
      master.gain.linearRampToValueAtTime(0.0001, now + 0.25)
      sources.forEach((source) => {
        try {
          source.stop(now + 0.3)
        } catch {
          // The source may already have stopped.
        }
      })
      window.setTimeout(() => {
        try {
          master.disconnect()
          filter.disconnect()
        } catch {
          // The audio graph may already be torn down.
        }
      }, 400)
    }
  }, [ambient, enabled])

  useEffect(() => () => {
    const context = contextRef.current
    contextRef.current = null
    if (context && context.state !== 'closed') context.close().catch(() => {})
  }, [])
}
