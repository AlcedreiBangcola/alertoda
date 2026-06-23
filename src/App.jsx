import { useEffect, useState } from 'react'
import Home from './screens/Home.jsx'
import Report from './screens/Report.jsx'
import MapScreen from './screens/MapScreen.jsx'
import Community from './screens/Community.jsx'
import Dispatch from './screens/Dispatch.jsx'
import BottomNav from './components/BottomNav.jsx'
import AppBar from './components/AppBar.jsx'
import EarthquakeAlert from './components/EarthquakeAlert.jsx'
import { useEarthquakeAlert } from './hooks/useEarthquakeAlert.js'
import './App.css'

export default function App() {
  const [active, setActive] = useState('home')

  // A community-wide alert: when any phone detects shaking (or taps Simulate),
  // broadcast() fires here and on every other open app. We hold on the
  // "Earthquake Detected!" beat, then route everyone to the welfare check.
  const { alert, broadcast, clearAlert } = useEarthquakeAlert()

  useEffect(() => {
    if (!alert) return
    const t = setTimeout(() => {
      setActive('report')
      clearAlert()
    }, 2200)
    return () => clearTimeout(t)
  }, [alert, clearAlert])

  function goToCheckIn() {
    clearAlert()
    setActive('report')
  }

  // The alert takes over the whole screen no matter which tab the user is on.
  if (alert) {
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
        {active === 'dispatch' && <Dispatch />}
      </main>
      <BottomNav active={active} onChange={setActive} />
    </div>
  )
}
