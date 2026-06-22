import { useState } from 'react'
import { QC_CENTER } from '../data/mockReports.js'
import './Report.css'

const HELP_TAGS = ['Trapped', 'Injured', 'Need Water', 'Need Food', 'Structural Damage']

// Until we have real geolocation, drop the user's report near QC center with a
// small random offset so submissions don't stack on the exact same point.
function nearCenter() {
  const jitter = () => (Math.random() - 0.5) * 0.02
  return { lat: QC_CENTER[0] + jitter(), lng: QC_CENTER[1] + jitter() }
}

export default function Report({ onSubmit }) {
  // 'choose' → pick safe/help · 'help-detail' → select tags · 'confirmed' → result
  const [step, setStep] = useState('choose')
  const [selectedTags, setSelectedTags] = useState([])
  const [report, setReport] = useState(null)

  function toggleTag(tag) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  function commit(status, tags) {
    const newReport = {
      id: `r${Date.now()}`,
      name: 'You',
      status,
      tags,
      at: new Date(),
      ...nearCenter(),
    }
    setReport(newReport)
    onSubmit?.(newReport)
    setStep('confirmed')
  }

  function submitSafe() {
    commit('safe', [])
  }

  function submitHelp() {
    commit('help', selectedTags)
  }

  function reset() {
    setSelectedTags([])
    setReport(null)
    setStep('choose')
  }

  if (step === 'confirmed') {
    return <Confirmation report={report} onReset={reset} />
  }

  if (step === 'help-detail') {
    return (
      <div>
        <header className="screen-header">
          <h1>What do you need?</h1>
          <p>Select all that apply. This helps dispatchers prioritize.</p>
        </header>

        <div className="tag-grid">
          {HELP_TAGS.map((tag) => {
            const isActive = selectedTags.includes(tag)
            return (
              <button
                key={tag}
                className={`tag ${isActive ? 'is-active' : ''}`}
                onClick={() => toggleTag(tag)}
                aria-pressed={isActive}
              >
                {tag}
              </button>
            )
          })}
        </div>

        <div className="report-actions">
          <button className="btn-secondary" onClick={() => setStep('choose')}>
            Back
          </button>
          <button className="btn-primary btn-primary--help" onClick={submitHelp}>
            Submit
          </button>
        </div>

        <p className="placeholder-note">
          You can submit without selecting tags if it's urgent.
        </p>
      </div>
    )
  }

  // step === 'choose'
  return (
    <div>
      <header className="screen-header">
        <h1>Are you safe?</h1>
        <p>Let your community and dispatchers know your status.</p>
      </header>

      <div className="welfare-buttons">
        <button className="welfare-btn welfare-btn--safe" onClick={submitSafe}>
          <span className="welfare-icon" aria-hidden="true">✓</span>
          <span className="welfare-label">I'm Safe</span>
          <span className="welfare-sub">No help needed right now</span>
        </button>

        <button
          className="welfare-btn welfare-btn--help"
          onClick={() => setStep('help-detail')}
        >
          <span className="welfare-icon" aria-hidden="true">!</span>
          <span className="welfare-label">I Need Help</span>
          <span className="welfare-sub">Request assistance</span>
        </button>
      </div>

      <p className="placeholder-note">
        Tapping a button will share your location and status.
      </p>
    </div>
  )
}

function Confirmation({ report, onReset }) {
  const isSafe = report.status === 'safe'

  return (
    <div className="confirm-wrap">
      <div className={`confirm-card ${isSafe ? 'confirm-card--safe' : 'confirm-card--help'}`}>
        <span className="confirm-icon" aria-hidden="true">
          {isSafe ? '✓' : '♥'}
        </span>
        <h2>{isSafe ? "Thank you. You're marked safe." : 'Your report has been received.'}</h2>
        <p>
          {isSafe
            ? 'Your community can see that you are okay. Stay alert and stay safe.'
            : 'Help is being coordinated. Stay where you are if it is safe to do so.'}
        </p>

        {!isSafe && report.tags.length > 0 && (
          <div className="confirm-tags">
            {report.tags.map((tag) => (
              <span key={tag} className="confirm-tag">{tag}</span>
            ))}
          </div>
        )}
      </div>

      <button className="btn-secondary btn-block" onClick={onReset}>
        Update my status
      </button>
    </div>
  )
}
