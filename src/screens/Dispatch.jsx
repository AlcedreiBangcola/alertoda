import { useEffect, useMemo, useRef, useState } from 'react'
import { useReports } from '../hooks/useReports.js'
import { buildRescueRoute } from '../lib/rescueRoute.js'
import { suggestPriority, splitTags, tagWeight } from '../lib/priority.js'
import { DISPATCH_ORIGIN } from '../data/mockReports.js'
import RescueRouteMap from '../components/RescueRouteMap.jsx'
import './Dispatch.css'

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

  // The rescue route is also AI-suggested until a human taps "Confirm Route".
  const [routeConfirmed, setRouteConfirmed] = useState(false)

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

  // AI rescue route: nearest-neighbor from the dispatch origin, weighted by urgency.
  const route = useMemo(() => buildRescueRoute(cases, DISPATCH_ORIGIN), [cases])

  // If the route changes (a new help report arrives), it's a fresh suggestion —
  // drop the prior confirmation so the dispatcher re-approves the updated plan.
  const routeKey = route.map((s) => s.id).join('|')
  const prevRouteKey = useRef(routeKey)
  useEffect(() => {
    if (prevRouteKey.current !== routeKey) {
      prevRouteKey.current = routeKey
      setRouteConfirmed(false)
    }
  }, [routeKey])

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

      {route.length > 0 && (
        <RescueRoutePanel
          route={route}
          confirmed={routeConfirmed}
          onConfirm={() => setRouteConfirmed(true)}
        />
      )}

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

function RescueRoutePanel({ route, confirmed, onConfirm }) {
  return (
    <section className={`route-panel ${confirmed ? 'route-panel--confirmed' : ''}`}>
      <div className="route-panel-head">
        <div className="route-title">
          <span className="ai-spark" aria-hidden="true">✦</span>
          <h2>{confirmed ? 'Route Confirmed' : 'AI Suggested Route'}</h2>
        </div>
        {confirmed ? (
          <span className="route-confirmed-badge">
            <span aria-hidden="true">✓</span> Approved
          </span>
        ) : (
          <button className="route-confirm-btn" onClick={onConfirm}>
            Confirm Route
          </button>
        )}
      </div>

      <p className="route-subnote">
        {confirmed
          ? `Dispatcher approved · ${route.length} stop${route.length > 1 ? 's' : ''} from base.`
          : 'Efficient order weighing urgency and travel. Review, then confirm to dispatch.'}
      </p>

      <div className="route-layout">
        <RescueRouteMap
          origin={DISPATCH_ORIGIN}
          stops={route}
          confirmed={confirmed}
        />

        <ol className="route-stops">
          {route.map((stop, i) => (
            <li key={stop.id} className="route-stop">
              <span
                className={`route-stop-num ${confirmed ? 'route-stop-num--confirmed' : ''}`}
              >
                {i + 1}
              </span>
              <div className="route-stop-body">
                <div className="route-stop-top">
                  <span className="route-stop-name">{stop.name}</span>
                  <span className={`prio-pill prio-pill--${stop.ai.level}`}>
                    {stop.ai.label}
                  </span>
                </div>
                <span className="route-stop-reason">{stop.ai.reason}</span>
                <CaseTags tags={stop.tags} />
                <span className="route-stop-leg">
                  {stop.distanceKm.toFixed(1)} km from previous
                </span>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

function CaseTags({ tags }) {
  const { needs, vulnerabilities } = splitTags(tags)

  if (needs.length === 0 && vulnerabilities.length === 0) {
    return (
      <div className="case-tags">
        <span className="case-tag case-tag--none">No details given</span>
      </div>
    )
  }

  return (
    <div className="case-tags">
      {needs.map((tag) => (
        <span
          key={tag}
          className={`case-tag ${tagWeight(tag) >= 70 ? 'case-tag--critical' : ''}`}
        >
          {tag}
        </span>
      ))}
      {vulnerabilities.map((tag) => (
        <span key={tag} className="case-tag case-tag--vuln">
          {tag}
        </span>
      ))}
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

        <CaseTags tags={report.tags} />

        <div className="case-decision">
          <div className="ai-suggestion">
            <span className="ai-spark" aria-hidden="true">✦</span>
            <span className="ai-label">AI Suggested Priority</span>
            <span className={`prio-pill prio-pill--${ai.level}`}>{ai.label}</span>
            <span className="ai-reason">{ai.reason}</span>
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
