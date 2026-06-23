import { useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { QC_CENTER } from '../data/mockReports.js'
import { useReports } from '../hooks/useReports.js'
import './MapScreen.css'

const PIN_COLORS = {
  safe: '#2e9e6b',
  help: '#d9694f',
  rescued: '#9aa7b6', // muted slate — a settled, closed case
}

// Exact SVG teardrop so the icon anchor lands precisely on the map point.
// Rescued pins carry a check instead of the plain dot to read as "reached".
function pinIcon(status) {
  const color = PIN_COLORS[status] || '#5d7173'
  const center =
    status === 'rescued'
      ? `<path d="M9.4 11.2 11.2 13l3.4-3.6" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`
      : `<circle cx="12" cy="11" r="3.6" fill="#ffffff"/>`
  return L.divIcon({
    className: 'welfare-pin',
    html: `
      <svg width="26" height="34" viewBox="0 0 24 32" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 1C6.5 1 2 5.5 2 11c0 7.5 10 20 10 20s10-12.5 10-20C22 5.5 17.5 1 12 1z"
          fill="${color}" stroke="#ffffff" stroke-width="2"/>
        ${center}
      </svg>`,
    iconSize: [26, 34],
    iconAnchor: [13, 33],
    popupAnchor: [0, -30],
  })
}

export default function MapScreen() {
  const { reports, loading } = useReports()

  // Memoize icons so we reuse three instances instead of rebuilding per marker.
  const icons = useMemo(
    () => ({ safe: pinIcon('safe'), help: pinIcon('help'), rescued: pinIcon('rescued') }),
    []
  )

  const helpCount = reports.filter((r) => r.status === 'help').length
  const rescuedCount = reports.filter((r) => r.status === 'rescued').length
  const safeCount = reports.filter((r) => r.status === 'safe').length

  return (
    <div>
      <header className="screen-header">
        <h1>Live Map</h1>
        <p>Status pins from your community · Quezon City</p>
      </header>

      <div className="map-canvas">
        <MapContainer
          center={QC_CENTER}
          zoom={13}
          scrollWheelZoom={false}
          className="leaflet-root"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {reports.map((r) => (
            <Marker key={r.id} position={[r.lat, r.lng]} icon={icons[r.status]}>
              <Popup>
                <div className="pin-popup">
                  <span className={`pin-popup-status pin-popup-status--${r.status}`}>
                    {r.status === 'help' ? 'Needs help' : r.status === 'rescued' ? 'Rescued' : 'Safe'}
                  </span>
                  <strong>{r.name}</strong>
                  {r.tags.length > 0 ? (
                    <div className="pin-popup-tags">
                      {r.tags.map((tag) => (
                        <span key={tag} className="pin-popup-tag">{tag}</span>
                      ))}
                    </div>
                  ) : (
                    r.status === 'help' && (
                      <span className="pin-popup-note">No details provided</span>
                    )
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {!loading && reports.length === 0 ? (
        <p className="map-empty-note">No reports yet. The map will fill in as people check in.</p>
      ) : (
        <div className="map-legend">
          <span className="legend-item">
            <span className="legend-dot legend-dot--safe" /> Safe · {safeCount}
          </span>
          <span className="legend-item">
            <span className="legend-dot legend-dot--help" /> Needs help · {helpCount}
          </span>
          {rescuedCount > 0 && (
            <span className="legend-item">
              <span className="legend-dot legend-dot--rescued" /> Rescued · {rescuedCount}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
