import { useMemo, useState } from 'react'
import { useReports } from '../hooks/useReports.js'
import { isRouteConfirmed } from '../hooks/useRouteDispatch.js'
import { buildRescueRoute } from '../lib/rescueRoute.js'
import { suggestPriority } from '../lib/priority.js'
import { DISPATCH_ORIGIN } from '../data/mockReports.js'
import RescueRouteMap from '../components/RescueRouteMap.jsx'
import CaseTags from '../components/CaseTags.jsx'
import './Dispatch.css'

function timeAgo(at) {
  if (!at) return null
  const mins = Math.max(0, Math.round((Date.now() - new Date(at).getTime()) / 60000))
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.floor(mins / 60)
  return `${hrs} hr${hrs > 1 ? 's' : ''} ago`
}

export default function Dispatch({ confirmedIds, confirmRoute }) {
  const { reports, loading, markRescued } = useReports()

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
  // Ties break toward the most recent report. Rescued people drop out here, so
  // the route below recalculates around whoever is left.
  const cases = useMemo(() => {
    return reports
      .filter((r) => r.status === 'help')
      .map((r) => ({ ...r, ai: suggestPriority(r.tags) }))
      .sort((a, b) => b.ai.score - a.ai.score || new Date(b.at || 0) - new Date(a.at || 0))
  }, [reports])

  // Closed cases — shown as muted, checkmarked pins so the dispatcher keeps
  // sight of who's already been reached.
  const rescued = useMemo(
    () => reports.filter((r) => r.status === 'rescued'),
    [reports]
  )

  // AI rescue route: nearest-neighbor from the dispatch origin, weighted by urgency.
  const route = useMemo(() => buildRescueRoute(cases, DISPATCH_ORIGIN), [cases])

  // The route is confirmed when every current stop is in the dispatcher's
  // confirmed set (shared across devices via useRouteDispatch). Rescuing someone
  // shrinks the route but keeps it a subset, so it stays confirmed; a new help
  // request adds an unconfirmed stop, prompting the dispatcher to re-confirm.
  const routeConfirmed = isRouteConfirmed(route, confirmedIds)

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
        <div className="summary-stat">
          <span className="summary-num summary-num--rescued">{rescued.length}</span>
          <span className="summary-label">Rescued</span>
        </div>
      </div>

      <p className="dispatch-note">
        <span className="ai-spark" aria-hidden="true">✦</span>
        AI suggests a priority. A dispatcher confirms each case.
      </p>

      {route.length > 0 && (
        <RescueRoutePanel
          route={route}
          rescued={rescued}
          confirmed={routeConfirmed}
          onConfirm={() => confirmRoute(route.map((s) => s.id))}
          onRescued={markRescued}
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
              onRescued={() => markRescued(c.id)}
            />
          ))}
        </ul>
      )}
    </div>
  )
}

function RescueRoutePanel({ route, rescued, confirmed, onConfirm, onRescued }) {
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
          rescued={rescued}
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
                <div className="route-stop-foot">
                  <span className="route-stop-leg">
                    {stop.distanceKm.toFixed(1)} km from previous
                  </span>
                  <button
                    className="rescued-btn rescued-btn--sm"
                    onClick={() => onRescued(stop.id)}
                  >
                    ✓ Mark as Rescued
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

function CaseCard({ report, confirmed, onToggleConfirm, onRescued }) {
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

        <button className="rescued-btn" onClick={onRescued}>
          ✓ Mark as Rescued
        </button>
      </div>
    </li>
  )
}
