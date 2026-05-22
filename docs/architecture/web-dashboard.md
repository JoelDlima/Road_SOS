# Web Dashboard for Emergency Contacts

## Overview
A web app where emergency contacts can view the user's real-time status during an SOS.

## Tech Stack
- Next.js 14 (App Router) or React + Vite
- Supabase Realtime for live updates
- Mapbox / Leaflet for map display
- Deployed on Vercel or Netlify

## Routes
- `/track/:incidentId` — Live tracking page (shared via SOS SMS)
- Shows: User location on map, responder locations, SMS delivery status
- No auth required — access via unique incident ID link

## API
- Supabase Realtime subscription to `incidents` table
- Read-only access via anonymous Supabase key with RLS policies
