import { useCallback, useEffect, useRef, useState } from 'react'

// Tuned so casual handling stays quiet but a deliberate shake fires reliably.
// A "jolt" is a large frame-to-frame change in acceleration; we require several
// jolts inside a short window so a single bump or rotation won't trigger it.
const JOLT_THRESHOLD = 16 // m/s^2 of change between samples
const REQUIRED_JOLTS = 4
const WINDOW_MS = 1500
const SAMPLE_GAP_MS = 60 // throttle noisy sensors

// Detection states: idle → listening, or denied / unsupported if the device
// won't cooperate (in which case the UI falls back to "Simulate Earthquake").
export function useShakeDetection(onDetected) {
  const [status, setStatus] = useState('idle')

  const prev = useRef(null)
  const joltTimes = useRef([])
  const fired = useRef(false)
  const onDetectedRef = useRef(onDetected)
  onDetectedRef.current = onDetected

  const handleMotion = useCallback((e) => {
    const acc = e.accelerationIncludingGravity
    if (!acc || acc.x == null) return

    const now = Date.now()
    const last = prev.current
    prev.current = { x: acc.x, y: acc.y, z: acc.z, t: now }
    if (!last || now - last.t < SAMPLE_GAP_MS) return

    const dx = acc.x - last.x
    const dy = acc.y - last.y
    const dz = acc.z - last.z
    // Gravity is roughly constant while still, so the delta isolates real motion.
    const change = Math.sqrt(dx * dx + dy * dy + dz * dz)
    if (change < JOLT_THRESHOLD) return

    const recent = joltTimes.current.filter((t) => now - t < WINDOW_MS)
    recent.push(now)
    joltTimes.current = recent

    if (recent.length >= REQUIRED_JOLTS && !fired.current) {
      fired.current = true
      onDetectedRef.current?.()
    }
  }, [])

  const enable = useCallback(async () => {
    const DME = window.DeviceMotionEvent
    if (!DME) {
      setStatus('unsupported')
      return 'unsupported'
    }

    // iOS 13+ requires an explicit, user-gesture-triggered permission request.
    if (typeof DME.requestPermission === 'function') {
      try {
        const res = await DME.requestPermission()
        if (res !== 'granted') {
          setStatus('denied')
          return 'denied'
        }
      } catch {
        setStatus('denied')
        return 'denied'
      }
    }

    prev.current = null
    joltTimes.current = []
    fired.current = false
    window.addEventListener('devicemotion', handleMotion)
    setStatus('listening')
    return 'listening'
  }, [handleMotion])

  // Always detach the listener when the screen using this hook goes away.
  useEffect(() => {
    return () => window.removeEventListener('devicemotion', handleMotion)
  }, [handleMotion])

  return { status, enable }
}
