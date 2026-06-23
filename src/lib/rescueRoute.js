// AI rescue routing — a simple, sensible plan for the order responders should
// visit people who need help. It is a *suggestion*: a human dispatcher confirms
// it before it's acted on (see Dispatch screen).
//
// Approach: greedy nearest-neighbor from a fixed dispatch origin, but each
// candidate's distance is discounted by how urgent the case is. So the route
// favors stops that are both close and urgent — the most critical cases tend to
// come first, while nearby ones still get grouped to cut travel. Not a true
// optimal tour, just a reasonable plan that's fast to compute.

// Approximate ground distance (km) between two lat/lng points. Equirectangular
// projection is plenty accurate across a single city and avoids heavier trig.
function distanceKm(a, b) {
  const R = 6371
  const toRad = (deg) => (deg * Math.PI) / 180
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const x = toRad(b.lng - a.lng) * Math.cos((lat1 + lat2) / 2)
  const y = toRad(b.lat - a.lat)
  return Math.sqrt(x * x + y * y) * R
}

// Build the ordered rescue route. `cases` are the needs-help reports (each with
// lat/lng and an `ai.score` urgency); `origin` is the [lat, lng] start point.
// Returns the same case objects in visit order, each tagged with its `distanceKm`
// from the previous stop so the UI can show leg distances.
export function buildRescueRoute(cases, origin) {
  const remaining = cases.filter(
    (c) => Number.isFinite(c.lat) && Number.isFinite(c.lng)
  )
  const route = []
  let current = { lat: origin[0], lng: origin[1] }

  while (remaining.length > 0) {
    let bestIdx = 0
    let bestCost = Infinity
    let bestDist = 0

    for (let i = 0; i < remaining.length; i++) {
      const dist = distanceKm(current, remaining[i])
      // Higher urgency shrinks the effective cost, pulling critical cases earlier.
      const urgencyFactor = 1 + (remaining[i].ai?.score || 0) / 50
      const cost = dist / urgencyFactor
      if (cost < bestCost) {
        bestCost = cost
        bestIdx = i
        bestDist = dist
      }
    }

    const [next] = remaining.splice(bestIdx, 1)
    route.push({ ...next, distanceKm: bestDist })
    current = next
  }

  return route
}
