import { useState } from 'react'
import Home from './screens/Home.jsx'
import Report from './screens/Report.jsx'
import MapScreen from './screens/MapScreen.jsx'
import Community from './screens/Community.jsx'
import Dispatch from './screens/Dispatch.jsx'
import BottomNav from './components/BottomNav.jsx'
import './App.css'

export default function App() {
  const [active, setActive] = useState('home')

  // Map, Community, and Dispatch each load reports from Supabase on mount
  // (see useReports); the Report screen writes new welfare checks back to it.
  return (
    <div className="app-shell">
      <main className="app-content">
        {active === 'home' && <Home onWelfareCheck={() => setActive('report')} />}
        {active === 'report' && <Report />}
        {active === 'map' && <MapScreen />}
        {active === 'community' && <Community />}
        {active === 'dispatch' && <Dispatch />}
      </main>
      <BottomNav active={active} onChange={setActive} />
    </div>
  )
}
