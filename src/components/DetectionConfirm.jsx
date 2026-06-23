import { useEffect, useState } from 'react'
import { magnitudeBand, QUAKE_DISCLAIMER } from '../lib/quake.js'
import './DetectionConfirm.css'

// Illustrative figures only — NOT live sensor data. This screen demonstrates the
// *concept* of cross-checking many nearby phones before confirming a quake.
const TOTAL_DEVICES = 5
const CONFIRMING = 4 // device 5 intentionally never reports, so it reads "4 of 5"

// Nearby devices arranged around "you" (the center). Coordinates double as both
// the SVG line endpoints (0–100 viewBox) and the CSS percentage positions.
const DEVICES = [
  { id: 1, x: 50, y: 12 },
  { id: 2, x: 85, y: 36 },
  { id: 3, x: 72, y: 84 },
  { id: 4, x: 28, y: 84 },
  { id: 5, x: 15, y: 36 },
]

function PhoneGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="6" y="2.5" width="12" height="19" rx="2.5" />
      <path d="M10.5 18.5h3" />
    </svg>
  )
}

// Full-screen cross-check beat shown between "Earthquake Detected" and the
// welfare check. Runs a short scripted sequence (~2.5s), then calls onDone().
export default function DetectionConfirm({ onDone, quake }) {
  const [confirmed, setConfirmed] = useState(0) // how many devices have reported in
  const [phase, setPhase] = useState('checking') // 'checking' | 'tally' | 'confirmed'

  useEffect(() => {
    const timers = []
    for (let i = 1; i <= CONFIRMING; i++) {
      timers.push(setTimeout(() => setConfirmed(i), 200 + i * 300))
    }
    timers.push(setTimeout(() => setPhase('tally'), 200 + (CONFIRMING + 1) * 300))
    timers.push(setTimeout(() => setPhase('confirmed'), 200 + (CONFIRMING + 1) * 300 + 500))
    timers.push(setTimeout(() => onDone(), 200 + (CONFIRMING + 1) * 300 + 500 + 800))
    return () => timers.forEach(clearTimeout)
  }, [onDone])

  const done = phase === 'confirmed'

  let status
  if (phase === 'confirmed') status = 'Cross-check complete.'
  else if (phase === 'tally') status = `${CONFIRMING} of ${TOTAL_DEVICES} nearby devices detected shaking`
  else if (confirmed === 0) status = 'Checking nearby sensors…'
  else status = `Device ${confirmed} confirms shaking`

  return (
    <div className="confirm-detect">
      <span className="confirm-detect-brand">AlerToda</span>

      <span className="confirm-detect-eyebrow">
        <span className="confirm-detect-eyebrow-dot" aria-hidden="true" />
        Cross-checking nearby devices
      </span>

      <h1 className="confirm-detect-title">
        {done ? 'Earthquake Confirmed' : 'Confirming Earthquake'}
      </h1>

      <div className="confirm-detect-stage" role="img" aria-label={status}>
        <svg className="confirm-detect-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {DEVICES.map((d) => (
            <line
              key={d.id}
              x1="50" y1="50" x2={d.x} y2={d.y}
              className={`confirm-detect-line ${d.id <= confirmed ? 'is-on' : ''}`}
            />
          ))}
        </svg>

        <span className={`confirm-detect-center ${done ? 'is-done' : ''}`} aria-hidden="true" />

        {DEVICES.map((d) => {
          const isConfirmed = d.id <= confirmed
          return (
            <span
              key={d.id}
              className={`confirm-detect-device ${isConfirmed ? 'is-confirmed' : ''}`}
              style={{ left: `${d.x}%`, top: `${d.y}%`, animationDelay: `${d.id * 0.18}s` }}
              aria-hidden="true"
            >
              {isConfirmed ? '✓' : <PhoneGlyph />}
            </span>
          )
        })}
      </div>

      <div className={`confirm-detect-tally ${done ? 'is-done' : ''}`}>
        <span className="confirm-detect-count">{phase === 'checking' ? confirmed : CONFIRMING}</span>
        <span className="confirm-detect-of">of {TOTAL_DEVICES} confirmed</span>
      </div>

      <p className="confirm-detect-status">{status}</p>

      {done && quake && (
        <div className="quake-estimate" style={{ '--band': magnitudeBand(quake.magnitude).onDark }}>
          <span className="quake-estimate-eyebrow">Estimated magnitude</span>
          <div className="quake-estimate-figures">
            <span className="quake-estimate-mag">{quake.magnitude.toFixed(1)}</span>
            <span className="quake-estimate-intensity">
              Intensity {quake.intensity.roman}
              <small>{quake.intensity.label}</small>
            </span>
          </div>
          <span className="quake-estimate-radius">
            Affected radius ~{quake.radiusKm} km · everyone inside is alerted
          </span>
          <span className="quake-estimate-disclaimer">{QUAKE_DISCLAIMER}</span>
        </div>
      )}

      <p className="confirm-detect-note">
        <strong>Demonstration:</strong> in a full deployment, AlerToda confirms quakes by
        cross-checking many nearby phones. The device count and confirmations shown here are
        illustrative, not live sensor readings.
      </p>
    </div>
  )
}
