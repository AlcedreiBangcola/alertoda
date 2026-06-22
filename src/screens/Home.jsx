import { useCallback, useEffect, useState } from 'react'
import { useShakeDetection } from '../hooks/useShakeDetection.js'
import './Home.css'

export default function Home({ onWelfareCheck }) {
  const [alerted, setAlerted] = useState(false)

  const triggerAlert = useCallback(() => setAlerted(true), [])
  const { status, enable } = useShakeDetection(triggerAlert)

  // After detection, hold on the "Earthquake Detected!" beat briefly, then hand
  // off to the welfare check so the user lands on "Are you safe?".
  useEffect(() => {
    if (!alerted) return
    const t = setTimeout(() => onWelfareCheck?.(), 2200)
    return () => clearTimeout(t)
  }, [alerted, onWelfareCheck])

  if (alerted) {
    return <EarthquakeAlert onCheckIn={() => onWelfareCheck?.()} />
  }

  const listening = status === 'listening'

  return (
    <div>
      <header className="screen-header">
        <h1>AlerToda</h1>
        <p>Community earthquake awareness · Quezon City</p>
      </header>

      <section className={`status-card ${listening ? 'status-card--listening' : 'status-card--calm'}`}>
        <span className={`status-dot ${listening ? 'status-dot--listening' : ''}`} />
        <div>
          <h2>{listening ? 'Monitoring' : 'All Clear'}</h2>
          <p>
            {listening
              ? 'Detection is active. Keep AlerToda open.'
              : 'No shaking detected in your area right now.'}
          </p>
        </div>
      </section>

      <section className="card detect-card">
        {listening ? (
          <p className="detect-status">
            <span className="detect-status-dot" /> Listening for shaking
          </p>
        ) : (
          <>
            <button className="detect-btn" onClick={enable}>
              Enable Detection
            </button>
            {status === 'denied' && (
              <p className="detect-hint detect-hint--warn">
                Motion access was blocked. Use Simulate Earthquake to demo.
              </p>
            )}
            {status === 'unsupported' && (
              <p className="detect-hint detect-hint--warn">
                This device doesn't report motion. Use Simulate Earthquake to demo.
              </p>
            )}
            {status === 'idle' && (
              <p className="detect-hint">
                Uses your phone's motion sensor to detect strong shaking.
              </p>
            )}
          </>
        )}

        <button className="simulate-btn" onClick={triggerAlert}>
          Simulate Earthquake
        </button>
      </section>

      <section className="card info-row">
        <div className="info-item">
          <span className="info-label">Detection</span>
          <span className="info-value">{listening ? 'On' : 'Off'}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Nearby reports</span>
          <span className="info-value">0</span>
        </div>
        <div className="info-item">
          <span className="info-label">Source</span>
          <span className="info-value">PHIVOLCS</span>
        </div>
      </section>

      <p className="placeholder-note">
        AlerToda is supplementary to PHIVOLCS, the official authority.
      </p>
    </div>
  )
}

function EarthquakeAlert({ onCheckIn }) {
  return (
    <div className="quake-alert">
      <div className="quake-ring" aria-hidden="true">
        <span className="quake-glyph">!</span>
      </div>
      <h1 className="quake-title">Earthquake Detected!</h1>
      <p className="quake-sub">Strong shaking detected. Taking you to a quick safety check…</p>
      <button className="quake-btn" onClick={onCheckIn}>
        Check in now
      </button>
    </div>
  )
}
