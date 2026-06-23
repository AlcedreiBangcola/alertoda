import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabaseClient.js'

// Community-wide earthquake alert over a Supabase Realtime *broadcast* channel.
// Broadcast needs no database table: any connected client can send a message and
// every other connected client receives it within a second or two. When one
// phone detects shaking (or taps Simulate), it calls broadcast() — that fires
// the alert locally right away and pushes it to all other open apps.
const CHANNEL = 'earthquake-alerts'
const EVENT = 'quake'

export function useEarthquakeAlert() {
  // null when calm; otherwise { at, source } describing the active alert.
  const [alert, setAlert] = useState(null)
  const channelRef = useRef(null)

  useEffect(() => {
    const channel = supabase
      .channel(CHANNEL)
      .on('broadcast', { event: EVENT }, ({ payload }) => {
        // An alert from another device — show it on this app too.
        setAlert({ at: Date.now(), source: 'remote', ...payload })
      })
      .subscribe()

    channelRef.current = channel
    return () => {
      channelRef.current = null
      supabase.removeChannel(channel)
    }
  }, [])

  // Raise an alert for everyone: react locally at once (broadcast doesn't echo
  // to the sender by default) and push it to all other connected clients.
  const broadcast = useCallback(() => {
    const payload = { at: Date.now(), source: 'local' }
    setAlert(payload)
    channelRef.current?.send({ type: 'broadcast', event: EVENT, payload })
  }, [])

  const clearAlert = useCallback(() => setAlert(null), [])

  return { alert, broadcast, clearAlert }
}
