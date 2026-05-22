# RoadSoS Test Plan

## Unit Tests (`npm test`)
Run with Jest + jest-expo. Located in `tests/`.

| Module | File | Coverage |
|--------|------|----------|
| offline-cache | `tests/lib/offline-cache.test.ts` | SEED_SERVICES, REGIONS, haversine |
| sms | `tests/lib/sms.test.ts` | buildSOSMessage (6 cases) |
| alarm | `tests/lib/alarm.test.ts` | Interface exports |
| notifications | `tests/lib/notifications.test.ts` | Interface exports |
| RAG | `tests/lib/rag.test.ts` | Interface exports |
| Hooks | `tests/hooks/useCrashDetector.test.ts` | Interface exports |
| Config | `tests/config.test.ts` | Package.json deps, tsconfig |

## E2E Tests (`cd dashboard && npx playwright test`)
Playwright tests for the web dashboard. Located in `dashboard/tests/`.

| Test | What it verifies |
|-----|-----------------|
| Page renders | Title "RoadSoS" visible |
| Stats cards | All 3 stat cards present |
| Connection | Status indicator visible |
| Map | Leaflet container rendered |
| Empty state | "No Incidents" shown |

## Manual Testing Checklist
- [ ] Onboarding flow (3 steps)
- [ ] SOS trigger (manual)
- [ ] Crash detection (use dev mode simulate)
- [ ] AI chat (Groq + offline modes)
- [ ] Nearby services (list + map view)
- [ ] ICE screen
- [ ] Settings (profile, contacts, region)
- [ ] Incident detail screen
