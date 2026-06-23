import './AppBar.css'

// A slim, consistent top app bar carrying the AlerToda identity on every screen.
// Purely presentational — calm navy wordmark with a small seismic-wave mark.
export default function AppBar() {
  return (
    <header className="app-bar">
      <span className="app-bar-mark" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none"
          stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12h3l2-6 4 13 3-9 2 5h4" />
        </svg>
      </span>
      <span className="app-bar-name">AlerToda</span>
      <span className="app-bar-tag">Quezon City</span>
    </header>
  )
}
