import { useShakeDetection } from '../hooks/useShakeDetection.js'
import './Home.css'

export default function Home({ onQuake }) {
  // Local shake detection is the trigger; it broadcasts a community-wide alert
  // (handled in App) so every open app reacts, not just this phone.
  const { status, enable } = useShakeDetection(onQuake)

  const listening = status === 'listening'

  return (
    <div>
      <header className="screen-header">
        <h1>Stay aware, stay safe</h1>
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

        <button className="simulate-btn" onClick={onQuake}>
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
