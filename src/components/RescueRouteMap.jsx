import { useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
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

// Keep every point (origin + all stops) in view as reports load/change.
function FitToRoute({ points }) {
  const map = useMap()
  useEffect(() => {
    if (points.length < 2) return
    map.fitBounds(L.latLngBounds(points), { padding: [32, 32], maxZoom: 15 })
  }, [map, points])
  return null
}

export default function RescueRouteMap({ origin, stops, confirmed }) {
  // origin → stop 1 → stop 2 → … as a connected line.
  const line = useMemo(
    () => [origin, ...stops.map((s) => [s.lat, s.lng])],
    [origin, stops]
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

        <FitToRoute points={line} />
      </MapContainer>
    </div>
  )
}
