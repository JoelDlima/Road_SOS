# ADR-002: Supabase as Backend Platform

## Status
Accepted

## Context
RoadSoS needs a backend for storing services, incidents, user profiles, and emergency contacts. It also needs auth and real-time capabilities.

## Decision
Use Supabase (PostgreSQL + Auth + Realtime + Edge Functions) as the primary backend platform.

## Alternatives Considered
- **Firebase**: Similar feature set but vendor lock-in, not open source.
- **Custom Node.js API**: Full control but requires building auth, DB, and real-time from scratch.
- **AWS Amplify**: Good integration but complex permission model.

## Consequences
- Positive: PostgreSQL mature tooling, built-in auth, real-time subscriptions, generous free tier
- Negative: Vendor dependency, Geo-distributed latency for non-IN regions
