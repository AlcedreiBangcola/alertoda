import './EarthquakeAlert.css'

// Full-screen "Earthquake Detected!" beat shown to every connected app when an
// alert is raised locally or received over the broadcast channel. Holds briefly,
// then the app routes the user to the welfare check (or they tap "Check in now").
export default function EarthquakeAlert({ onCheckIn }) {
  return (
    <div className="quake-alert">
      <span className="quake-brand">AlerToda</span>
      <div className="quake-ring" aria-hidden="true">
        <span className="quake-glyph">!</span>
      </div>
      <h1 className="quake-title">Earthquake Detected</h1>
      <p className="quake-sub">Strong shaking detected. Taking you to a quick safety check…</p>
      <button className="quake-btn" onClick={onCheckIn}>
        Check in now
      </button>
    </div>
  )
}
