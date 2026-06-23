import { useMemo } from 'react'
import { useReports } from '../hooks/useReports.js'
import { buildRescueRoute } from '../lib/rescueRoute.js'
import { suggestPriority } from '../lib/priority.js'
import { DISPATCH_ORIGIN } from '../data/mockReports.js'
import RescueRouteMap from '../components/RescueRouteMap.jsx'
import CaseTags from '../components/CaseTags.jsx'
import './Rescuer.css'

// Field responder's view, on their own phone. It mirrors the dispatcher's data
// (same Supabase realtime reports) but shows only what a human dispatcher has
// CONFIRMED — AI recommends, a human confirms, then the rescuer rolls out.
export default function Rescuer({ confirmedIds }) {
  const { reports, loading, markRescued } = useReports()

  // Same scoring + routing as the dispatcher, so both compute an identical plan.
  const cases = useMemo(() => {
    return reports
      .filter((r) => r.status === 'help')
      .map((r) => ({ ...r, ai: suggestPriority(r.tags) }))
      .sort((a, b) => b.ai.score - a.ai.score || new Date(b.at || 0) - new Date(a.at || 0))
  }, [reports])

  const route = useMemo(() => buildRescueRoute(cases, DISPATCH_ORIGIN), [cases])

  // The rescuer's assigned stops = the recalculated route, limited to people the
  // dispatcher confirmed. Marking someone rescued removes them from `cases`, so
  // the route (and this list) shrinks and re-orders live. New, not-yet-confirmed
  // help requests stay hidden until the dispatcher confirms them.
  const assignedRoute = useMemo(
    () => (confirmedIds ? route.filter((s) => confirmedIds.includes(s.id)) : []),
    [route, confirmedIds]
  )

  // Confirmed people already rescued — for progress + checkmarked map pins.
  const rescuedConfirmed = useMemo(
    () => (confirmedIds ? reports.filter((r) => r.status === 'rescued' && confirmedIds.includes(r.id)) : []),
    [reports, confirmedIds]
  )

  const total = confirmedIds ? confirmedIds.length : 0
  const done = rescuedConfirmed.length
  const hasAssignment = total > 0
  const allDone = hasAssignment && assignedRoute.length === 0

  return (
    <div>
      <header className="screen-header">
        <h1>Rescuer</h1>
        <p>Field responder · Quezon City</p>
      </header>

      {!hasAssignment ? (
        <WaitingForDispatch loading={loading} />
      ) : (
        <>
          <ProgressPanel done={done} total={total} allDone={allDone} />

          <section className="rescuer-route">
            <div className="rescuer-route-head">
              <h2>Your Route</h2>
              <span className="rescuer-route-badge">
                <span aria-hidden="true">✓</span> Dispatcher confirmed
              </span>
            </div>

            <RescueRouteMap
              origin={DISPATCH_ORIGIN}
              stops={assignedRoute}
              rescued={rescuedConfirmed}
              confirmed
            />

            {allDone ? (
              <div className="rescuer-complete">
                <span className="rescuer-complete-mark" aria-hidden="true">✓</span>
                <strong>All assigned people rescued.</strong>
                <span>Great work. Stand by for the next assignment.</span>
              </div>
            ) : (
              <ol className="rescuer-stops">
                {assignedRoute.map((stop, i) => (
                  <RescuerStop
                    key={stop.id}
                    stop={stop}
                    index={i}
                    current={i === 0}
                    onRescued={() => markRescued(stop.id)}
                  />
                ))}
              </ol>
            )}
          </section>
        </>
      )}
    </div>
  )
}

function WaitingForDispatch({ loading }) {
  return (
    <div className="rescuer-waiting">
      <div className="rescuer-waiting-icon" aria-hidden="true">
        <span className="rescuer-waiting-dot" />
      </div>
      <strong>Waiting for dispatch</strong>
      <p>
        {loading
          ? 'Connecting to the dispatch network…'
          : 'No route assigned yet. The dispatcher is reviewing the AI-suggested plan and will confirm your assignment. It will appear here the moment it’s approved.'}
      </p>
    </div>
  )
}

function ProgressPanel({ done, total, allDone }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0
  return (
    <section className={`rescuer-progress ${allDone ? 'rescuer-progress--done' : ''}`}>
      <div className="rescuer-progress-top">
        <span className="rescuer-progress-count">
          {done} <span className="rescuer-progress-of">of</span> {total}
        </span>
        <span className="rescuer-progress-label">rescued</span>
      </div>
      <div className="rescuer-progress-track" role="progressbar" aria-valuenow={done} aria-valuemin={0} aria-valuemax={total}>
        <div className="rescuer-progress-fill" style={{ width: `${pct}%` }} />
      </div>
    </section>
  )
}

function RescuerStop({ stop, index, current, onRescued }) {
  return (
    <li className={`rescuer-stop ${current ? 'rescuer-stop--current' : ''}`}>
      <span className="rescuer-stop-num">{index + 1}</span>
      <div className="rescuer-stop-body">
        <div className="rescuer-stop-top">
          <span className="rescuer-stop-name">{stop.name}</span>
          <span className={`prio-pill prio-pill--${stop.ai.level}`}>{stop.ai.label}</span>
        </div>

        {current && <span className="rescuer-stop-cue">Next stop · head here now</span>}

        <span className="rescuer-stop-reason">{stop.ai.reason}</span>
        <CaseTags tags={stop.tags} />

        <div className="rescuer-stop-foot">
          <span className="rescuer-stop-leg">
            📍 {stop.lat.toFixed(4)}, {stop.lng.toFixed(4)} · {stop.distanceKm.toFixed(1)} km from previous
          </span>
          <button className="rescued-btn rescued-btn--sm" onClick={onRescued}>
            ✓ Mark as Rescued
          </button>
        </div>
      </div>
    </li>
  )
}
