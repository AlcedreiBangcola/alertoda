import { useCallback, useEffect, useState } from 'react'
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

// Collapse the stored DB status into the three states the screens reason about:
// 'help' (needs_help), 'rescued' (a dispatcher closed the case), or 'safe'.
function internalStatus(raw) {
  if (raw === 'needs_help') return 'help'
  if (raw === 'rescued') return 'rescued'
  return 'safe'
}

// Map a Supabase `reports` row to the internal shape the screens already use,
// so existing rendering/sorting logic keeps working unchanged.
function normalize(row) {
  return {
    id: row.id,
    name: row.name || 'Resident',
    status: internalStatus(row.status),
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

    // 2. Subscribe to changes so fresh reports — and status changes like a
    //    dispatcher marking someone rescued — appear live on every open device.
    const channel = supabase
      .channel('reports-changes')
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
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'reports' },
        (payload) => {
          if (!active) return
          const row = normalize(payload.new)
          // Replace in place so a status change (e.g. → rescued) reflects live.
          setReports((prev) => prev.map((r) => (r.id === row.id ? row : r)))
        }
      )
      .subscribe()

    return () => {
      active = false
      supabase.removeChannel(channel)
    }
  }, [])

  // Close a case: mark a person rescued. Updates locally at once (optimistic) so
  // the route recalculates instantly, then persists to Supabase — whose realtime
  // UPDATE then mirrors the change to every other open device.
  const markRescued = useCallback(async (id) => {
    setReports((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'rescued' } : r))
    )
    const { error } = await supabase
      .from('reports')
      .update({ status: 'rescued' })
      .eq('id', id)
    if (error) console.error('Failed to mark report rescued in Supabase:', error.message)
  }, [])

  return { reports, loading, markRescued }
}
