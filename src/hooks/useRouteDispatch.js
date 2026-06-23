import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabaseClient.js'

// Shares the dispatcher's *confirmed* rescue route across every open device over
// a Supabase Realtime broadcast channel — the same schema-free pattern used for
// earthquake alerts (see useEarthquakeAlert). The dispatcher confirms a route
// (human-in-the-loop); that confirmation is broadcast so a field rescuer's phone
// can reveal the assigned stops. Nothing appears on the rescuer view until a
// human has confirmed.
//
// We store the confirmed *set of person IDs* (the route at confirm time), not an
// exact ordering. So as the rescuer marks people rescued and the route
// recalculates around who's left, the plan stays "confirmed" — the remaining
// stops are still a subset. A brand-new help request introduces an unconfirmed
// ID, so the dispatcher is prompted to re-confirm the updated plan.
const CHANNEL = 'route-dispatch'

// Is `route` covered by the dispatcher's confirmation? True only when a route
// exists and every one of its stops is in the confirmed set.
export function isRouteConfirmed(route, confirmedIds) {
  if (!confirmedIds || route.length === 0) return false
  return route.every((stop) => confirmedIds.includes(stop.id))
}

export function useRouteDispatch() {
  // null = the dispatcher hasn't confirmed any route yet.
  const [confirmedIds, setConfirmedIds] = useState(null)
  const channelRef = useRef(null)
  // Latest value, so the sync responder's stable closure can read it.
  const confirmedRef = useRef(null)
  confirmedRef.current = confirmedIds

  useEffect(() => {
    const channel = supabase
      .channel(CHANNEL)
      // The dispatcher confirmed (or re-confirmed / cleared) a route.
      .on('broadcast', { event: 'confirm' }, ({ payload }) => {
        setConfirmedIds(payload?.ids ?? null)
      })
      // A device that just joined asks for the current confirmed route…
      .on('broadcast', { event: 'sync-request' }, () => {
        if (confirmedRef.current) {
          channel.send({
            type: 'broadcast',
            event: 'sync-state',
            payload: { ids: confirmedRef.current },
          })
        }
      })
      // …and adopts the answer if it doesn't already hold a confirmation.
      .on('broadcast', { event: 'sync-state' }, ({ payload }) => {
        setConfirmedIds((prev) => prev ?? payload?.ids ?? null)
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          channel.send({ type: 'broadcast', event: 'sync-request', payload: {} })
        }
      })

    channelRef.current = channel
    return () => {
      channelRef.current = null
      supabase.removeChannel(channel)
    }
  }, [])

  // Confirm the current plan: record the route's person IDs locally at once and
  // broadcast them so every rescuer device reveals the assignment.
  const confirmRoute = useCallback((ids) => {
    setConfirmedIds(ids)
    channelRef.current?.send({
      type: 'broadcast',
      event: 'confirm',
      payload: { ids },
    })
  }, [])

  return { confirmedIds, confirmRoute }
}
