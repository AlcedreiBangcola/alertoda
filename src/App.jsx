import { useCallback, useEffect, useState } from 'react'
import Home from './screens/Home.jsx'
import Report from './screens/Report.jsx'
import MapScreen from './screens/MapScreen.jsx'
import Community from './screens/Community.jsx'
import Dispatch from './screens/Dispatch.jsx'
import Rescuer from './screens/Rescuer.jsx'
import BottomNav from './components/BottomNav.jsx'
import AppBar from './components/AppBar.jsx'
import EarthquakeAlert from './components/EarthquakeAlert.jsx'
import DetectionConfirm from './components/DetectionConfirm.jsx'
import { useEarthquakeAlert } from './hooks/useEarthquakeAlert.js'
import { useRouteDispatch } from './hooks/useRouteDispatch.js'
import './App.css'

export default function App() {
  const [active, setActive] = useState('home')

  // A community-wide alert: when any phone detects shaking (or taps Simulate),
  // broadcast() fires here and on every other open app. The full-screen alert
  // runs in two beats — "Earthquake Detected!", then a cross-check confirmation
  // step — before routing everyone to the welfare check.
  const { alert, broadcast, clearAlert } = useEarthquakeAlert()

  // The dispatcher's confirmed rescue route, shared live across devices. Held at
  // the app root (not inside a screen) so it survives tab switches and keeps the
  // Dispatcher and Rescuer views in sync. The rescuer sees an assignment only
  // after a human dispatcher confirms it — AI recommends, human confirms.
  const { confirmedIds, confirmRoute } = useRouteDispatch()

  // 'detected' = initial beat · 'confirming' = nearby-device cross-check demo.
  const [alertPhase, setAlertPhase] = useState('detected')

  // Each new alert (keyed by its timestamp) restarts the sequence at "detected"
  // and auto-advances to the cross-check confirmation step.
  useEffect(() => {
    if (!alert) return
    setAlertPhase('detected')
    const t = setTimeout(() => setAlertPhase('confirming'), 1800)
    return () => clearTimeout(t)
  }, [alert?.at])

  // End the takeover and hand off to the welfare check. Stable identity so the
  // confirmation step's timed sequence isn't restarted by an unrelated re-render.
  const goToCheckIn = useCallback(() => {
    clearAlert()
    setActive('report')
  }, [clearAlert])

  // The alert takes over the whole screen no matter which tab the user is on.
  if (alert) {
    if (alertPhase === 'confirming') {
      return <DetectionConfirm onDone={goToCheckIn} />
    }
    return <EarthquakeAlert onCheckIn={goToCheckIn} />
  }

  // Map, Community, and Dispatch each load reports from Supabase on mount
  // (see useReports); the Report screen writes new welfare checks back to it.
  return (
    <div className="app-shell">
      <AppBar />
      <main className="app-content">
        {active === 'home' && <Home onQuake={broadcast} />}
        {active === 'report' && <Report />}
        {active === 'map' && <MapScreen />}
        {active === 'community' && <Community />}
        {active === 'dispatch' && (
          <Dispatch confirmedIds={confirmedIds} confirmRoute={confirmRoute} />
        )}
        {active === 'rescuer' && <Rescuer confirmedIds={confirmedIds} />}
      </main>
      <BottomNav active={active} onChange={setActive} />
    </div>
  )
}
