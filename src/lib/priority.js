// Shared AI priority model — used by the Report screen (to label urgency on
// submit), the Dispatcher Dashboard (to rank cases and explain why), and the
// rescue route (to weight the visit order). Keeping it in one place means the
// number a responder sees, the order they're routed, and the saved urgency all
// agree.
//
// Priority weighs TWO things:
//   • Need tags — what's wrong right now (Trapped, Injured, …)
//   • Vulnerability tags — who is at higher risk (Elderly, Child, PWD, Pregnant)
// Both are stored together in the report's `tags` array; we split them back out
// by membership in the known sets below.

// What the person needs. Order is the order shown on the Report screen.
export const HELP_TAGS = ['Trapped', 'Injured', 'Need Water', 'Need Food', 'Structural Damage']

// Who the person is — optional vulnerability quick-select on the Report screen.
export const VULNERABILITY_TAGS = ['Elderly', 'Child', 'Person with Disability', 'Pregnant']

// Weight per tag. Life-threatening needs dominate; vulnerability adds a real but
// smaller bump so a vulnerable person with a lesser need still rises in the queue.
const TAG_WEIGHTS = {
  // Needs
  Trapped: 100,
  Injured: 70,
  'Structural Damage': 35,
  'Need Water': 18,
  'Need Food': 15,
  // Vulnerabilities
  Elderly: 30,
  Child: 30,
  'Person with Disability': 30,
  Pregnant: 30,
}

// Score buckets → the priority label the AI suggests.
const LEVELS = [
  { key: 'critical', label: 'Critical', min: 70 },
  { key: 'high', label: 'High', min: 35 },
  { key: 'moderate', label: 'Moderate', min: 15 },
  { key: 'low', label: 'Low', min: 0 },
]

export function tagWeight(tag) {
  return TAG_WEIGHTS[tag] || 0
}

// Split a report's flat tag list back into needs vs. vulnerabilities, preserving
// the canonical display order of each set.
export function splitTags(tags = []) {
  const has = (set) => set.filter((t) => tags.includes(t))
  return { needs: has(HELP_TAGS), vulnerabilities: has(VULNERABILITY_TAGS) }
}

// Build a short, human-readable reason, e.g. "High priority: Injured + Elderly".
// Lists the heaviest contributing tags first; caps length so it stays glanceable.
function buildReason(tags, level) {
  const contributors = tags
    .filter((t) => TAG_WEIGHTS[t])
    .sort((a, b) => TAG_WEIGHTS[b] - TAG_WEIGHTS[a])

  if (contributors.length === 0) {
    return `${level.label} priority: no details given`
  }

  const shown = contributors.slice(0, 3)
  const extra = contributors.length - shown.length
  const list = shown.join(' + ') + (extra > 0 ? ` +${extra} more` : '')
  return `${level.label} priority: ${list}`
}

// Score a report's tags and return the suggested priority plus an explanation.
export function suggestPriority(tags = []) {
  const score = tags.reduce((sum, tag) => sum + tagWeight(tag), 0)
  const level = LEVELS.find((l) => score >= l.min)
  return {
    score,
    level: level.key,
    label: level.label,
    reason: buildReason(tags, level),
  }
}
