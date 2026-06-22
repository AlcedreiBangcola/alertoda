import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient.js'

// The `tags` column may come back as a real array (jsonb / text[]) or, with the
// current text column, as a JSON-encoded string like '["Trapped","Injured"]'.
// Parse all of these into a clean string array so tags always display.
function parseTags(raw) {
  if (Array.isArray(raw)) return raw
  if (typeof raw !== 'string') return []
  const s = raw.trim()
  if (!s) return []
  // JSON array string: ["Trapped","Injured"]
  if (s.startsWith('[')) {
    try {
      const parsed = JSON.parse(s)
      return Array.isArray(parsed) ? parsed.filter(Boolean) : []
    } catch {
      return []
    }
  }
  // Postgres array literal: {Trapped,Injured}
  if (s.startsWith('{') && s.endsWith('}')) {
    return s
      .slice(1, -1)
      .split(',')
      .map((t) => t.replace(/^"|"$/g, '').trim())
      .filter(Boolean)
  }
  // A bare single value
  return [s]
}

// Map a Supabase `reports` row to the internal shape the screens already use,
// so existing rendering/sorting logic keeps working unchanged.
function normalize(row) {
  return {
    id: row.id,
    name: row.name || 'Resident',
    status: row.status === 'needs_help' ? 'help' : 'safe',
    tags: parseTags(row.tags),
    lat: Number(row.latitude),
    lng: Number(row.longitude),
    at: row.created_at ? new Date(row.created_at) : null,
  }
}

// Load reports from the Supabase `reports` table — real data only, no mock seed.
// Fetches all existing rows on mount, then subscribes to inserts so new reports
// appear live. `loading` lets screens avoid flashing an empty state before the
// first fetch resolves.
export function useReports() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    // 1. Fetch all existing reports on mount.
    supabase
      .from('reports')
      .select('*')
      .then(({ data, error }) => {
        if (!active) return
        if (error) {
          console.error('Failed to load reports from Supabase:', error.message)
        } else if (data) {
          const live = data
            .map(normalize)
            .filter((r) => Number.isFinite(r.lat) && Number.isFinite(r.lng))
          setReports(live)
        }
        setLoading(false)
      })

    // 2. Subscribe to new inserts so fresh reports appear live, no refresh needed.
    const channel = supabase
      .channel('reports-inserts')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'reports' },
        (payload) => {
          if (!active) return
          const row = normalize(payload.new)
          if (!Number.isFinite(row.lat) || !Number.isFinite(row.lng)) return
          // Guard against a row that the initial fetch may have already included.
          setReports((prev) =>
            prev.some((r) => r.id === row.id) ? prev : [...prev, row]
          )
        }
      )
      .subscribe()

    return () => {
      active = false
      supabase.removeChannel(channel)
    }
  }, [])

  return { reports, loading }
}
