import { useMemo, useState } from 'react'
import { useReports } from '../hooks/useReports.js'
import './Dispatch.css'

// AI priority model: each need carries a weight; the case score is their sum.
// Trapped and Injured dominate so life-threatening cases always float to the top.
const TAG_WEIGHTS = {
  Trapped: 100,
  Injured: 70,
  'Structural Damage': 35,
  'Need Water': 18,
  'Need Food': 15,
}

// Score buckets → the label the AI suggests to the dispatcher.
const LEVELS = [
  { key: 'critical', label: 'Critical', min: 70 },
  { key: 'high', label: 'High', min: 35 },
  { key: 'moderate', label: 'Moderate', min: 15 },
  { key: 'low', label: 'Low', min: 0 },
]

function suggestPriority(tags) {
  const score = tags.reduce((sum, tag) => sum + (TAG_WEIGHTS[tag] || 0), 0)
  const level = LEVELS.find((l) => score >= l.min)
  return { score, level: level.key, label: level.label }
}

function timeAgo(at) {
  if (!at) return null
  const mins = Math.max(0, Math.round((Date.now() - new Date(at).getTime()) / 60000))
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.floor(mins / 60)
  return `${hrs} hr${hrs > 1 ? 's' : ''} ago`
}

export default function Dispatch() {
  const { reports, loading } = useReports()

  // Which case IDs a human dispatcher has acknowledged. AI only suggests; this is the confirm.
  const [confirmed, setConfirmed] = useState(() => new Set())

  function toggleConfirm(id) {
    setConfirmed((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  // Only people who asked for help, each scored, sorted most-urgent first.
  // Ties break toward the most recent report.
  const cases = useMemo(() => {
    return reports
      .filter((r) => r.status === 'help')
      .map((r) => ({ ...r, ai: suggestPriority(r.tags) }))
      .sort((a, b) => b.ai.score - a.ai.score || new Date(b.at || 0) - new Date(a.at || 0))
  }, [reports])

  const pending = cases.filter((c) => !confirmed.has(c.id)).length

  return (
    <div>
      <header className="screen-header">
        <h1>Dispatcher Dashboard</h1>
        <p>Active help requests · Quezon City responders</p>
      </header>

      <div className="dispatch-summary">
        <div className="summary-stat">
          <span className="summary-num">{cases.length}</span>
          <span className="summary-label">Need help</span>
        </div>
        <div className="summary-stat">
          <span className="summary-num summary-num--pending">{pending}</span>
          <span className="summary-label">Awaiting confirm</span>
        </div>
        <div className="summary-stat">
          <span className="summary-num summary-num--done">{cases.length - pending}</span>
          <span className="summary-label">Confirmed</span>
        </div>
      </div>

      <p className="dispatch-note">
        <span className="ai-spark" aria-hidden="true">✦</span>
        AI suggests a priority. A dispatcher confirms each case.
      </p>

      {loading ? null : cases.length === 0 ? (
        <div className="dispatch-empty">No reports yet. No active help requests.</div>
      ) : (
        <ul className="case-list">
          {cases.map((c) => (
            <CaseCard
              key={c.id}
              report={c}
              confirmed={confirmed.has(c.id)}
              onToggleConfirm={() => toggleConfirm(c.id)}
            />
          ))}
        </ul>
      )}
    </div>
  )
}

function CaseCard({ report, confirmed, onToggleConfirm }) {
  const { ai } = report
  const when = timeAgo(report.at)

  return (
    <li className={`case-card prio-${ai.level} ${confirmed ? 'is-confirmed' : ''}`}>
      <div className="case-rail" aria-hidden="true" />

      <div className="case-body">
        <div className="case-top">
          <div className="case-identity">
            <span className="case-name">{report.name}</span>
            <span className="case-status">Needs help{when ? ` · ${when}` : ''}</span>
          </div>
          {confirmed ? (
            <span className="confirm-badge" title="Confirmed by dispatcher">
              <span aria-hidden="true">✓</span> Confirmed
            </span>
          ) : (
            <span className="awaiting-badge">Awaiting</span>
          )}
        </div>

        {report.tags.length > 0 ? (
          <div className="case-tags">
            {report.tags.map((tag) => (
              <span
                key={tag}
                className={`case-tag ${TAG_WEIGHTS[tag] >= 70 ? 'case-tag--critical' : ''}`}
              >
                {tag}
              </span>
            ))}
          </div>
        ) : (
          <div className="case-tags">
            <span className="case-tag case-tag--none">No details given</span>
          </div>
        )}

        <div className="case-decision">
          <div className="ai-suggestion">
            <span className="ai-spark" aria-hidden="true">✦</span>
            <span className="ai-label">AI Suggested Priority</span>
            <span className={`prio-pill prio-pill--${ai.level}`}>{ai.label}</span>
          </div>

          <button
            className={`confirm-btn ${confirmed ? 'confirm-btn--done' : ''}`}
            onClick={onToggleConfirm}
            aria-pressed={confirmed}
          >
            {confirmed ? 'Confirmed ✓' : 'Confirm'}
          </button>
        </div>
      </div>
    </li>
  )
}
