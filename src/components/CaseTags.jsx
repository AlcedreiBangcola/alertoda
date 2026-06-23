import { splitTags, tagWeight } from '../lib/priority.js'

// Renders a person's reported tags as chips: needs (with critical highlight) and
// vulnerability chips in the indigo "who is at risk" voice. Shared by the
// dispatcher and rescuer views so both read the same. Styling lives in
// Dispatch.css (.case-tag*), which is bundled globally.
export default function CaseTags({ tags }) {
  const { needs, vulnerabilities } = splitTags(tags)

  if (needs.length === 0 && vulnerabilities.length === 0) {
    return (
      <div className="case-tags">
        <span className="case-tag case-tag--none">No details given</span>
      </div>
    )
  }

  return (
    <div className="case-tags">
      {needs.map((tag) => (
        <span
          key={tag}
          className={`case-tag ${tagWeight(tag) >= 70 ? 'case-tag--critical' : ''}`}
        >
          {tag}
        </span>
      ))}
      {vulnerabilities.map((tag) => (
        <span key={tag} className="case-tag case-tag--vuln">
          {tag}
        </span>
      ))}
    </div>
  )
}
