import { useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import AffectedRadius from './AffectedRadius.jsx'
import './RescueRouteMap.css'

// Start point: a flag-style marker so the responder's origin reads differently
// from the numbered rescue stops.
const originIcon = L.divIcon({
  className: 'route-origin-pin',
  html: `<div class="route-origin-badge" title="Dispatch start">▲</div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
})

// Numbered stop marker. Indigo (AI) while suggested; green once the dispatcher
// confirms the route — echoing the human-in-the-loop voice used elsewhere.
function numberedIcon(n, confirmed) {
  const color = confirmed ? '#2e9e6b' : '#5b61c4'
  return L.divIcon({
    className: 'route-stop-pin',
    html: `<div class="route-stop-badge" style="background:${color}">${n}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -14],
  })
}

// Muted, checkmarked marker for someone already rescued — visually settled and
// clearly distinct from the active red/indigo route stops.
const rescuedIcon = L.divIcon({
  className: 'route-rescued-pin',
  html: `<div class="route-rescued-badge" title="Rescued">✓</div>`,
  iconSize: [26, 26],
  iconAnchor: [13, 13],
  popupAnchor: [0, -12],
})

// Keep every point (origin + all stops) in view as reports load/change.
function FitToRoute({ points }) {
  const map = useMap()
  useEffect(() => {
    if (points.length < 2) return
    map.fitBounds(L.latLngBounds(points), { padding: [32, 32], maxZoom: 15 })
  }, [map, points])
  return null
}

export default function RescueRouteMap({ origin, stops, rescued = [], confirmed, quake }) {
  // origin → stop 1 → stop 2 → … as a connected line (active stops only).
  const line = useMemo(
    () => [origin, ...stops.map((s) => [s.lat, s.lng])],
    [origin, stops]
  )

  // Fit the view to everything on the map, including rescued markers, so they
  // don't drift off-screen as the active route shrinks.
  const fitPoints = useMemo(
    () => [...line, ...rescued.map((r) => [r.lat, r.lng])],
    [line, rescued]
  )

  return (
    <div className="route-map-canvas">
      <MapContainer
        center={origin}
        zoom={13}
        scrollWheelZoom={false}
        className="leaflet-root"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <AffectedRadius quake={quake} />

        <Polyline
          positions={line}
          pathOptions={{
            color: confirmed ? '#2e9e6b' : '#5b61c4',
            weight: 4,
            opacity: 0.85,
            dashArray: confirmed ? null : '8 8',
          }}
        />

        <Marker position={origin} icon={originIcon}>
          <Popup>Dispatch start</Popup>
        </Marker>

        {stops.map((s, i) => (
          <Marker
            key={s.id}
            position={[s.lat, s.lng]}
            icon={numberedIcon(i + 1, confirmed)}
          >
            <Popup>
              <div className="route-popup">
                <strong>Stop {i + 1} · {s.name}</strong>
                <span className={`route-popup-prio route-popup-prio--${s.ai.level}`}>
                  {s.ai.label}
                </span>
                {s.tags.length > 0 && (
                  <div className="route-popup-tags">
                    {s.tags.map((tag) => (
                      <span key={tag} className="route-popup-tag">{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        {rescued
          .filter((r) => Number.isFinite(r.lat) && Number.isFinite(r.lng))
          .map((r) => (
            <Marker key={r.id} position={[r.lat, r.lng]} icon={rescuedIcon}>
              <Popup>
                <div className="route-popup">
                  <strong>{r.name}</strong>
                  <span className="route-popup-rescued">✓ Rescued</span>
                </div>
              </Popup>
            </Marker>
          ))}

        <FitToRoute points={fitPoints} />
      </MapContainer>
    </div>
  )
}
