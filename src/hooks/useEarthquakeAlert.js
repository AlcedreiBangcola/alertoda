import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabaseClient.js'
import { generateQuake } from '../lib/quake.js'

// Community-wide earthquake alert over a Supabase Realtime *broadcast* channel.
// Broadcast needs no database table: any connected client can send a message and
// every other connected client receives it within a second or two. When one
// phone detects shaking (or taps Simulate), it calls broadcast() — that fires
// the alert locally right away and pushes it to all other open apps.
const CHANNEL = 'earthquake-alerts'
const EVENT = 'quake'

export function useEarthquakeAlert() {
  // null when calm; otherwise { at, source, quake } describing the active alert.
  const [alert, setAlert] = useState(null)
  // The confirmed quake's estimated details (epicenter, magnitude, intensity,
  // radius). Persists past the full-screen takeover so the maps can keep drawing
  // the affected-radius circle while people view the map, community, and dispatch
  // screens. A new quake replaces it.
  const [quake, setQuake] = useState(null)
  const channelRef = useRef(null)

  useEffect(() => {
    const channel = supabase
      .channel(CHANNEL)
      .on('broadcast', { event: EVENT }, ({ payload }) => {
        // An alert from another device — show it (and its quake estimate) here too.
        setAlert({ at: Date.now(), source: 'remote', ...payload })
        if (payload?.quake) setQuake(payload.quake)
      })
      .subscribe()

    channelRef.current = channel
    return () => {
      channelRef.current = null
      supabase.removeChannel(channel)
    }
  }, [])

  // Raise an alert for everyone: react locally at once (broadcast doesn't echo
  // to the sender by default) and push it to all other connected clients. The
  // estimated quake is generated once here so every device shows identical figures.
  const broadcast = useCallback(() => {
    const quakeEstimate = generateQuake()
    const payload = { at: Date.now(), source: 'local', quake: quakeEstimate }
    setAlert(payload)
    setQuake(quakeEstimate)
    channelRef.current?.send({ type: 'broadcast', event: EVENT, payload })
  }, [])

  // End the full-screen takeover only. `quake` stays live so the maps keep
  // showing the affected area as the user moves through the welfare check.
  const clearAlert = useCallback(() => setAlert(null), [])

  return { alert, quake, broadcast, clearAlert }
}
