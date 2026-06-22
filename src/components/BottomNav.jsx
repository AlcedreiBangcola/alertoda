import './BottomNav.css'

const ITEMS = [
  { key: 'home', label: 'Home', icon: HomeIcon },
  { key: 'report', label: 'Report', icon: ReportIcon },
  { key: 'map', label: 'Map', icon: MapIcon },
  { key: 'dispatch', label: 'Dispatch', icon: DispatchIcon },
]

export default function BottomNav({ active, onChange }) {
  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      {ITEMS.map(({ key, label, icon: Icon }) => {
        const isActive = active === key
        return (
          <button
            key={key}
            className={`nav-item ${isActive ? 'is-active' : ''}`}
            onClick={() => onChange(key)}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon />
            <span>{label}</span>
          </button>
        )
      })}
    </nav>
  )
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
    </svg>
  )
}

function ReportIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3a7 7 0 0 0-7 7c0 1.6.6 2.8 1.6 4l5.4 7 5.4-7c1-1.2 1.6-2.4 1.6-4a7 7 0 0 0-7-7Z" />
      <circle cx="12" cy="10" r="2.4" />
    </svg>
  )
}

function MapIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z" />
      <path d="M9 4v14M15 6v14" />
    </svg>
  )
}

function DispatchIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M9 3.5h6V6H9z" />
      <path d="m8.5 12 2 2 4-4" />
    </svg>
  )
}
