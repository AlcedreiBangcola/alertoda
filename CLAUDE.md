# AlerToda — Earthquake Detection & Response (Prototype)

AlerToda is a community-powered earthquake detection and emergency response web app for the Philippines. This is a prototype for a competition demo, not a production system. Prioritize a clean, working, demo-able app over completeness.

## What it does (core demo flow)
1. Phone detects shaking (accelerometer) and triggers an alert
2. User sees a welfare check: "I'm Safe" or "I Need Help"
3. A live map shows pins: green = safe, red = needs help
4. A dispatcher dashboard lists people who need help, sorted by urgency, with AI-suggested priority that a human dispatcher confirms (AI recommends, human confirms)

## Tech stack
- React + Vite (single-page app)
- Leaflet for the map (free, no API key)
- Mock data first; Supabase later for real persistence
- Mobile-first design, deployable as a PWA

## Design
- Calm, trustworthy look. Not alarming. Avoid aggressive all-red screens.
- Clean and simple. Large, clear buttons for the welfare check.

## Build approach
- Build one screen at a time; keep changes small and reviewable.
- Keep it simple. This is a prototype, so favor working visuals over backend complexity.
- Don't over-engineer: no audit logs, event sourcing, or microservices for now.

## Key context
- Philippine setting (Quezon City for demo data)
- PHIVOLCS is the official earthquake authority; AlerToda is supplementary, not a replacement
- Detailed architecture spec lives in SPEC.md (reference only, don't load unless asked)
