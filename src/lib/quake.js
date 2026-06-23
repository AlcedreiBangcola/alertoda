import { QC_CENTER } from '../data/mockReports.js'

// Illustrative earthquake estimates — NOT verified seismology. AlerToda is
// supplementary to PHIVOLCS, which determines the official magnitude. These
// helpers are pure and deterministic given their input (only generateQuake()
// draws a random magnitude), so the same quake reads identically on every device.

// PHIVOLCS PEIS-style intensity (Roman numeral + descriptor), derived from the
// estimated magnitude. Thresholds are rough and for demonstration only.
export function intensityForMagnitude(mag) {
  if (mag >= 6.0) return { roman: 'VII', label: 'Destructive' }
  if (mag >= 5.5) return { roman: 'VI', label: 'Very Strong' }
  if (mag >= 5.0) return { roman: 'V', label: 'Strong' }
  return { roman: 'IV', label: 'Moderately Strong' }
}

// Rough affected radius in kilometres. Larger magnitude → wider felt area.
export function radiusKmForMagnitude(mag) {
  return Math.max(4, Math.round((mag - 3) * 4)) // 5.0→8 · 5.8→11 · 6.4→14
}

// Calm, accessible colour band for the magnitude. Deliberately avoids alarm-red
// and "safe" green. `color` reads on light surfaces (map circle, banner);
// `onDark` is a lighter tint for the dark navy confirmation screen.
export function magnitudeBand(mag) {
  if (mag >= 6.0) return { key: 'major', label: 'Major', color: '#c2654f', onDark: '#ec9c87' }
  if (mag >= 5.5) return { key: 'strong', label: 'Strong', color: '#b07d22', onDark: '#e3b768' }
  return { key: 'moderate', label: 'Moderate', color: '#3d6f9e', onDark: '#8fb8e4' }
}

// One illustrative quake: a random moderate magnitude with intensity and an
// affected radius derived from it, centred on the demo epicenter. Generated once
// on the detecting device and broadcast so every app shows the same figures.
export function generateQuake(epicenter = QC_CENTER) {
  const magnitude = Math.round((5.0 + Math.random() * 1.4) * 10) / 10 // 5.0–6.4
  return {
    epicenter,
    magnitude,
    intensity: intensityForMagnitude(magnitude),
    radiusKm: radiusKmForMagnitude(magnitude),
  }
}

// Shared honesty line shown anywhere a magnitude appears.
export const QUAKE_DISCLAIMER =
  'Estimated for demonstration. Official magnitude is determined by PHIVOLCS.'
