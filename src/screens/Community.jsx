import { useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { QC_CENTER } from '../data/mockReports.js'
import { useReports } from '../hooks/useReports.js'
import './Community.css'

// The neighbor viewing this screen — for the demo we treat them as standing at
// QC center, so distances are measured from there.
const YOU = QC_CENTER

// Warm, human pin for a neighbor who needs a hand.
const helpPin = L.divIcon({
  className: 'welfare-pin',
  html: `
    <svg width="26" height="34" viewBox="0 0 24 32" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 1C6.5 1 2 5.5 2 11c0 7.5 10 20 10 20s10-12.5 10-20C22 5.5 17.5 1 12 1z"
        fill="#d9694f" stroke="#ffffff" stroke-width="2"/>
      <circle cx="12" cy="11" r="3.6" fill="#ffffff"/>
    </svg>`,
  iconSize: [26, 34],
  iconAnchor: [13, 33],
  popupAnchor: [0, -30],
})

// Rough straight-line distance in metres between two [lat, lng] points.
function metresBetween([lat1, lng1], [lat2, lng2]) {
  const dLat = (lat2 - lat1) * 111000
  const dLng = (lng2 - lng1) * 111000 * Math.cos((lat1 * Math.PI) / 180)
  return Math.round(Math.sqrt(dLat * dLat + dLng * dLng))
}

// Human-friendly distance: "200m away" / "1.2km away".
function distanceLabel(metres) {
  if (metres < 1000) return `${Math.round(metres / 10) * 10}m away`
  return `${(metres / 1000).toFixed(1)}km away`
}

// A rough compass direction so a neighbor knows which way to head.
function direction([lat1, lng1], [lat2, lng2]) {
  const dLat = lat2 - lat1
  const dLng = lng2 - lng1
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
  const angle = (Math.atan2(dLng, dLat) * 180) / Math.PI
  return dirs[Math.round(((angle + 360) % 360) / 45) % 8]
}

// A gentle one-line summary of what someone needs.
function needsSummary(tags) {
  if (tags.length === 0) return 'needs a hand'
  return tags.join(', ').toLowerCase()
}

export default function Community() {
  const { reports, loading } = useReports()

  // Only people asking for help, nearest first — that's who a neighbor can reach soonest.
  const requests = useMemo(() => {
    return reports
      .filter((r) => r.status === 'help')
      .map((r) => {
        const metres = metresBetween(YOU, [r.lat, r.lng])
        return {
          ...r,
          metres,
          distance: distanceLabel(metres),
          heading: direction(YOU, [r.lat, r.lng]),
        }
      })
      .sort((a, b) => a.metres - b.metres)
  }, [reports])

  return (
    <div>
      <header className="screen-header">
        <h1>Neighbors Helping Neighbors</h1>
        <p>People near you who could use a hand right now · Quezon City</p>
      </header>

      <div className="map-canvas community-map">
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
          {requests.map((r) => (
            <Marker key={r.id} position={[r.lat, r.lng]} icon={helpPin}>
              <Popup>
                <div className="pin-popup">
                  <span className="pin-popup-status pin-popup-status--help">Needs help</span>
                  <strong>{r.distance} · {r.heading}</strong>
                  {r.tags.length > 0 ? (
                    <div className="pin-popup-tags">
                      {r.tags.map((tag) => (
                        <span key={tag} className="pin-popup-tag">{tag}</span>
                      ))}
                    </div>
                  ) : (
                    <span className="community-popup-note">No details given yet</span>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {loading ? null : requests.length === 0 ? (
        <div className="community-empty">
          <span aria-hidden="true">🤝</span>
          <p>No reports yet. No one nearby needs help right now.</p>
        </div>
      ) : (
        <>
          <p className="community-lead">
            {requests.length === 1
              ? 'Someone nearby could use your help.'
              : `${requests.length} people nearby could use your help.`}
          </p>

          <ul className="community-list">
            {requests.map((r) => (
              <li key={r.id} className="community-card">
                <span className="community-icon" aria-hidden="true">♥</span>
                <div className="community-body">
                  <p className="community-headline">
                    Someone nearby needs help: <strong>{needsSummary(r.tags)}</strong>
                  </p>
                  <p className="community-meta">
                    {r.distance} · toward the {r.heading}
                  </p>
                  {r.tags.length > 0 && (
                    <div className="community-tags">
                      {r.tags.map((tag) => (
                        <span key={tag} className="community-tag">{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>

          <p className="placeholder-note">
            Only go if it's safe for you too. PHIVOLCS and local responders remain the official authority.
          </p>
        </>
      )}
    </div>
  )
}
