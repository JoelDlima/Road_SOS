# Database Query Optimization

## Indexes
| Table | Index | Justification |
|-------|-------|---------------|
| services | `services_location_idx` (GIST) | Geo-spatial queries |
| services | `services_type_idx` | Filter by service type |
| services | `services_type_location` | Composite filter for type + location |
| incidents | `incidents_user_lookup` | Recent incidents by user |

## RPC Optimization
The `nearby_services_optimized` function uses:
- `<->` operator (index-assisted nearest neighbor) instead of full `ST_DWithin` scan
- Early type filtering before spatial calculation
- Stable volatility marker for better planner estimates

## Query Plan Example
```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM nearby_services_optimized(15.49, 73.82, 10, 'hospital');
-- Expect: Index Scan using services_type_location
--         -> Sort by distance (limit 50)
```

## Maintenance
- Run `ANALYZE services` after bulk data loads
- Monitor cache hit ratio: > 99% is healthy
- VACUUM daily for high-write tables
