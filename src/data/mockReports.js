// Quezon City center, used for the map view and for placing new submissions.
export const QC_CENTER = [14.676, 121.0437]

// Spread report times across the last hour so the dispatcher view shows realistic "x min ago".
const minsAgo = (m) => new Date(Date.now() - m * 60000)

// Seed reports scattered around Quezon City so the map looks populated for the demo.
// Shape matches what the Report screen submits: { id, name, status, tags, lat, lng, at }.
export const mockReports = [
  { id: 'm1', name: 'Maria S.', status: 'safe', tags: [], lat: 14.6705, lng: 121.049, at: minsAgo(22) },
  { id: 'm2', name: 'Jhun R.', status: 'help', tags: ['Injured', 'Trapped'], lat: 14.648, lng: 121.056, at: minsAgo(8) },
  { id: 'm3', name: 'Aling Nena', status: 'safe', tags: [], lat: 14.692, lng: 121.0345, at: minsAgo(31) },
  { id: 'm4', name: 'Carlo D.', status: 'help', tags: ['Need Water', 'Need Food'], lat: 14.661, lng: 121.028, at: minsAgo(17) },
  { id: 'm5', name: 'Liza M.', status: 'safe', tags: [], lat: 14.636, lng: 121.0635, at: minsAgo(40) },
  { id: 'm6', name: 'Pedro G.', status: 'help', tags: ['Structural Damage'], lat: 14.702, lng: 121.061, at: minsAgo(12) },
  { id: 'm7', name: 'Grace T.', status: 'safe', tags: [], lat: 14.679, lng: 121.07, at: minsAgo(5) },
  { id: 'm8', name: 'Mang Tonyo', status: 'help', tags: ['Trapped'], lat: 14.652, lng: 121.019, at: minsAgo(3) },
  { id: 'm9', name: 'Rosa P.', status: 'help', tags: [], lat: 14.668, lng: 121.041, at: minsAgo(26) },
]
