import { useEffect } from 'react'
import { Circle, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { magnitudeBand, QUAKE_DISCLAIMER } from '../lib/quake.js'
import './AffectedRadius.css'

// Subtle epicenter marker — a soft target ring, deliberately quieter than the
// welfare/route pins so it reads as context, not a person to reach.
const epicenterIcon = L.divIcon({
  className: 'epicenter-pin',
  html: `<span class="epicenter-dot"></span>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
})

// Pan/zoom so the whole estimated affected area is visible. Opt-in: the rescue
// route map keeps its own route fit and lets the circle sit behind it instead.
function FitToCircle({ center, radiusM }) {
  const map = useMap()
  useEffect(() => {
    const bounds = L.latLng(center).toBounds(radiusM * 2.2)
    map.fitBounds(bounds, { padding: [16, 16], maxZoom: 14 })
  }, [map, center, radiusM])
  return null
}

// Translucent affected-radius circle + epicenter marker for any Leaflet map.
// Renders nothing until a quake is confirmed.
export default function AffectedRadius({ quake, fit = false }) {
  if (!quake) return null

  const band = magnitudeBand(quake.magnitude)
  const radiusM = quake.radiusKm * 1000

  return (
    <>
      <Circle
        center={quake.epicenter}
        radius={radiusM}
        pathOptions={{
          color: band.color,
          weight: 2,
          opacity: 0.6,
          dashArray: '6 7',
          fillColor: band.color,
          fillOpacity: 0.1,
        }}
      />
      <Marker position={quake.epicenter} icon={epicenterIcon}>
        <Popup>
          <div className="epicenter-popup">
            <strong>Estimated epicenter</strong>
            <span>
              Magnitude {quake.magnitude.toFixed(1)} · Intensity {quake.intensity.roman}
            </span>
            <span>Affected radius ~{quake.radiusKm} km</span>
            <small>{QUAKE_DISCLAIMER}</small>
          </div>
        </Popup>
      </Marker>
      {fit && <FitToCircle center={quake.epicenter} radiusM={radiusM} />}
    </>
  )
}

// One-line caption for beneath a map, framing the alert as reaching everyone
// inside the estimated radius — and keeping the PHIVOLCS honesty note in view.
export function AffectedCaption({ quake }) {
  if (!quake) return null
  const band = magnitudeBand(quake.magnitude)
  return (
    <p className="affected-caption">
      <span className="affected-swatch" style={{ color: band.color }} aria-hidden="true" />
      <span>
        Estimated affected area ~{quake.radiusKm} km · the alert and welfare check
        reach everyone inside this radius. {QUAKE_DISCLAIMER}
      </span>
    </p>
  )
}
