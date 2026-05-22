# ADR-001: Monorepo Structure with Expo + Node.js + Next.js

## Status
Accepted

## Context
RoadSoS spans multiple runtimes: React Native mobile app (Expo), WebSocket/WebRTC servers (Node.js), and a web dashboard (Next.js). We need a project structure that allows code sharing while keeping each deployable independently.

## Decision
Use a monorepo with three directories at the root: `app/` for Expo, `server/` for Node.js, and `dashboard/` for Next.js. Each has its own `package.json` and can be built/deployed independently.

## Alternatives Considered
- **Separate repos**: Cleaner boundaries but harder to coordinate API changes and share types quickly.
- **Turborepo/Nx**: Better caching but adds tooling complexity for a small team.
- **Single package.json**: Works for small projects but breaks when dependencies conflict.

## Consequences
- Positive: Independent deployability, clear ownership boundaries, shared docs/
- Negative: Duplicated dev tool config, manual cross-project coordination
