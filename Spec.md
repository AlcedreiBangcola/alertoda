# AlerToda — Community-Powered Earthquake Detection & Response

AlerToda is a real-time earthquake detection and emergency response platform for the Philippines. It combines crowdsourced phone accelerometer data to detect seismic events, welfare checks for affected users, a live rescue-needs map, and an AI-assisted dispatch dashboard for government responders — with a human-in-the-loop policy: AI recommends, dispatchers confirm.

---

## Product Overview

### Core Flow

1. **Detect** — mobile clients continuously sample accelerometer data; a local signal-processing layer flags potential P-wave or S-wave events and reports to the server
2. **Correlate** — the backend correlates incoming reports across devices/locations to distinguish genuine seismic events from false positives (phone drops, traffic)
3. **Alert** — verified events trigger push notifications to users in the affected radius
4. **Welfare Check** — notified users see a prompt: **I'm Safe** / **I Need Help**; non-responders are escalated after a configurable timeout
5. **Live Map** — a real-time map shows pin clusters: green (safe), red (needs help), grey (no response)
6. **Dispatch Dashboard** — government dispatchers see AI-generated rescue routing recommendations; all routing decisions require dispatcher confirmation before execution

### Human-in-the-Loop Policy

AI may recommend but never autonomously act. Specifically:
- Rescue routing suggestions are advisory only — a dispatcher must confirm each assignment
- Re-routing or priority changes require a new confirmation
- The UI must make the "AI suggested / Human confirmed" distinction visually explicit at all times
- Audit logs must record who confirmed what and when

---

## Users & Roles

| Role | Description |
|---|---|
| `citizen` | General public; installs mobile app; receives alerts; submits welfare check |
| `rescuer` | Field responder assigned by dispatcher; sees own assigned route on mobile |
| `dispatcher` | Government/LGU operator; uses web dashboard; confirms AI routing |
| `admin` | System administrator; manages zones, thresholds, user roles |

---

## Architecture (Target)

```
Mobile App (iOS/Android)
  └── Accelerometer sensor layer → local event candidate
  └── Push notification receiver → welfare check prompt
  └── Rescuer view (assigned route)

Backend API (REST + WebSocket)
  └── Earthquake correlation engine
  └── Welfare check state machine
  └── Event & alert management
  └── AI routing recommendation service
  └── Audit log service

Dispatcher Web Dashboard (SPA)
  └── Live map (WebSocket-driven)
  └── Rescue needs overlay
  └── AI routing panel (recommend → confirm flow)
  └── Incident management

Data Stores
  └── Primary DB (relational — users, events, assignments)
  └── Time-series / cache (welfare check states, sensor reports)
  └── Geospatial index (rescue pins, routing)
```

---

## Domain Vocabulary

Use these terms consistently in code, APIs, and UI copy:

| Term | Meaning |
|---|---|
| `seismic_event` | A confirmed earthquake (post-correlation) |
| `event_candidate` | Unverified device-reported shake |
| `welfare_check` | The I'm Safe / I Need Help prompt sent to a user |
| `welfare_status` | Enum: `safe`, `needs_help`, `no_response` |
| `rescue_pin` | A map marker representing a user who needs help |
| `routing_recommendation` | AI-generated rescue assignment (unconfirmed) |
| `dispatch_assignment` | A routing recommendation that a dispatcher has confirmed |
| `incident` | The full lifecycle of a seismic event: detection → response → closure |
| `LGU` | Local Government Unit — the primary dispatcher entity in PH context |

---

## Key Constraints & Design Rules

### Safety & Correctness (Non-Negotiable)
- Never suppress or delay a welfare check notification for non-critical reasons (e.g., rate limiting, A/B tests)
- `needs_help` status must never be silently dropped; it must persist until a dispatcher acknowledges or the user updates it
- All state transitions for welfare checks must be append-only (event sourced or audit-logged) — no silent overwrites
- Geolocation used for rescue routing must have explicit user consent gated at onboarding

### Human-in-the-Loop (Non-Negotiable)
- No code path may auto-confirm a `routing_recommendation` or auto-create a `dispatch_assignment` without a real dispatcher action
- Dispatcher confirmation endpoints must be authenticated and the actor recorded
- AI routing logic lives in its own bounded service; it produces recommendations only — it has no write access to assignments

### Philippines-Specific Context
- Target network conditions: 3G/LTE patchy in rural areas; mobile clients must queue and retry welfare check submissions offline
- PHIVOLCS (Philippine Institute of Volcanology and Seismology) is the authoritative source for official earthquake data; AlerToda's crowdsourced detection is supplementary, not a replacement
- Alerts and UI copy must support Filipino (Tagalog) and English; use i18n from the start
- Time zone: Asia/Manila (PHT, UTC+8); store all timestamps as UTC, display in PHT

### Privacy
- Precise user location is sensitive; only share coordinates with dispatchers for users who have `welfare_status = needs_help`
- Citizens marked `safe` should only expose region/barangay-level presence on the map, not exact coordinates

---

## Sensor & Detection Notes

- Use accelerometer magnitude threshold + duration heuristics for local P-wave candidate detection
- Server-side correlation: require reports from ≥ N devices within radius R within time window T to declare a `seismic_event` (N, R, T are configurable per zone)
- False-positive suppression: ignore candidates from a single device; weight reports by device quality/calibration score
- Do not rely solely on GPS for location; allow users to set a home barangay as fallback

---

## Development Guidelines

### Coding Conventions
- All timestamps: ISO 8601 UTC strings in APIs; display layer converts to PHT
- All coordinates: GeoJSON-style `[longitude, latitude]` order
- Status enums are lowercase snake_case strings in APIs (not integers)
- Welfare check state transitions must go through a single authoritative function/method — never inline ad-hoc status updates
- Any function that touches `routing_recommendation` or `dispatch_assignment` must have a comment citing the human-in-the-loop rule if it could be confused for an auto-confirm path

### Testing Priorities
1. Welfare check state machine (correctness + edge cases: timeout escalation, late responses)
2. Seismic event correlation logic (true positive / false positive thresholds)
3. Dispatcher confirmation flow (ensure no assignment is created without a confirmed actor)
4. Offline queue behavior on mobile (welfare check submitted while offline, synced on reconnect)

### What NOT to Build (Scope Boundaries)
- AlerToda does not replace PHIVOLCS official alerts; do not present crowdsourced detections as authoritative magnitude readings
- Do not build autonomous resource allocation (AI assigns rescuers without dispatcher) — this is an explicit out-of-scope design decision
- Do not store raw accelerometer streams server-side; only store derived event candidates with metadata

---

## Key Open Questions (Track These)

- Exact correlation thresholds (N, R, T) — needs input from PHIVOLCS or seismology consultant
- Integration path with LGU dispatch systems (NG911 equivalent in PH?)
- Offline-first sync strategy for mobile (decide: optimistic local state vs. server-authoritative)
- AI routing model: rules-based (proximity + capacity) vs. learned — start simple
