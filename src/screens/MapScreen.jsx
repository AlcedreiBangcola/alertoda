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
}

// Exact SVG teardrop so the icon anchor lands precisely on the map point.
function pinIcon(status) {
  const color = PIN_COLORS[status] || '#5d7173'
  return L.divIcon({
    className: 'welfare-pin',
    html: `
      <svg width="26" height="34" viewBox="0 0 24 32" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 1C6.5 1 2 5.5 2 11c0 7.5 10 20 10 20s10-12.5 10-20C22 5.5 17.5 1 12 1z"
          fill="${color}" stroke="#ffffff" stroke-width="2"/>
        <circle cx="12" cy="11" r="3.6" fill="#ffffff"/>
      </svg>`,
    iconSize: [26, 34],
    iconAnchor: [13, 33],
    popupAnchor: [0, -30],
  })
}

export default function MapScreen() {
  const { reports, loading } = useReports()

  // Memoize icons so we reuse two instances instead of rebuilding per marker.
  const icons = useMemo(
    () => ({ safe: pinIcon('safe'), help: pinIcon('help') }),
    []
  )

  const helpCount = reports.filter((r) => r.status === 'help').length
  const safeCount = reports.length - helpCount

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
                    {r.status === 'help' ? 'Needs help' : 'Safe'}
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
        </div>
      )}
    </div>
  )
}
