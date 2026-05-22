# RoadSoS SLO Definitions

## Service Level Indicators (SLIs)

### Mobile App
| SLI | Measurement | Target |
|-----|------------|--------|
| SOS Delivery Rate | % of SOS triggers that result in at least one SMS sent | 99.9% |
| App Crash Rate | % of sessions ending in unhandled error | < 0.1% |
| AI Response Time | Time from user message to first token (Groq) | p95 < 3s |
| Crash Detection Latency | Time from impact to countdown display | p99 < 500ms |

### WebSocket Servers
| SLI | Measurement | Target |
|-----|------------|--------|
| Connection Uptime | % of time server accepts connections | 99.9% |
| Message Latency | Time from send to broadcast | p99 < 100ms |
| Connection Capacity | Max concurrent connections | 1000 per instance |

### Web Dashboard
| SLI | Measurement | Target |
|-----|------------|--------|
| Page Load Time | Time to interactive | p95 < 3s |
| Uptime | % of time dashboard responds | 99.5% |

## Error Budgets (30-day window)
- 99.9% → 43.2 minutes downtime/month
- 99.5% → 3.6 hours downtime/month
