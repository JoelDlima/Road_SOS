-- Add composite indexes for common queries
create index if not exists incidents_user_lookup on incidents(user_name, created_at desc);
create index if not exists services_type_location on services(service_type, location);

-- Optimize nearby_services RPC with early filtering
create or replace function nearby_services_optimized(
  lat float, lng float, radius_km float default 10,
  p_service_type text default null
)
returns table (
  id uuid, name text, service_type text, address text,
  primary_phone text, is_24x7 boolean, tags jsonb,
  distance_km float, lat float, lng float
) language sql stable as $$
  select
    s.id, s.name, s.service_type, s.address,
    s.primary_phone, s.is_24x7, s.tags,
    round((ST_Distance(s.location::geography,
      ST_MakePoint(lng, lat)::geography) / 1000)::numeric, 2) as distance_km,
    ST_Y(s.location::geometry) as lat,
    ST_X(s.location::geometry) as lng
  from services s
  where
    (p_service_type is null or s.service_type = p_service_type)
    and ST_DWithin(
      s.location::geography,
      ST_MakePoint(lng, lat)::geography,
      radius_km * 1000
    )
  order by s.location::geography <-> ST_MakePoint(lng, lat)::geography
  limit 50;
$$;

-- Add updated_at trigger for profiles
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at
  before update on profiles
  for each row execute function update_updated_at();

-- Analyzer helper: run after data load
-- analyze services;
