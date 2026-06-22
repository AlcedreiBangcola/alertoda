import { useState } from 'react'
import Home from './screens/Home.jsx'
import Report from './screens/Report.jsx'
import MapScreen from './screens/MapScreen.jsx'
import Community from './screens/Community.jsx'
import Dispatch from './screens/Dispatch.jsx'
import BottomNav from './components/BottomNav.jsx'
import { mockReports } from './data/mockReports.js'
import './App.css'

export default function App() {
  const [active, setActive] = useState('home')
  // Shared welfare reports: seeded with mock data, appended to by the Report screen.
  const [reports, setReports] = useState(mockReports)

  function addReport(report) {
    setReports((prev) => [...prev, report])
  }

  return (
    <div className="app-shell">
      <main className="app-content">
        {active === 'home' && <Home onWelfareCheck={() => setActive('report')} />}
        {active === 'report' && <Report onSubmit={addReport} />}
        {active === 'map' && <MapScreen reports={reports} />}
        {active === 'community' && <Community reports={reports} />}
        {active === 'dispatch' && <Dispatch reports={reports} />}
      </main>
      <BottomNav active={active} onChange={setActive} />
    </div>
  )
}
