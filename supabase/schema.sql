-- Enable PostGIS
create extension if not exists postgis;

-- Services table
create table services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  service_type text not null check (service_type in (
    'hospital', 'trauma_centre', 'ambulance', 'police',
    'towing', 'puncture', 'showroom'
  )),
  address text,
  city text,
  state text,
  country_code char(2) default 'IN',
  location geometry(Point, 4326) not null,
  primary_phone text,
  alt_phones jsonb default '[]',
  is_24x7 boolean default false,
  tags jsonb default '{}',
  verified_at timestamptz,
  created_at timestamptz default now()
);

create index services_location_idx on services using gist(location);
create index services_type_idx on services(service_type);
create index services_country_idx on services(country_code);

-- RPC for nearby services
create or replace function nearby_services(
  lat float, lng float, radius_km float default 10,
  p_service_type text default null,
  p_country_code char(2) default null
)
returns table (
  id uuid, name text, service_type text, address text,
  primary_phone text, is_24x7 boolean, tags jsonb,
  distance_km float, lat float, lng float
) language sql as $$
  select
    s.id, s.name, s.service_type, s.address,
    s.primary_phone, s.is_24x7, s.tags,
    round((ST_Distance(s.location::geography,
      ST_MakePoint(lng, lat)::geography) / 1000)::numeric, 2) as distance_km,
    ST_Y(s.location::geometry) as lat,
    ST_X(s.location::geometry) as lng
  from services s
  where ST_DWithin(
    s.location::geography,
    ST_MakePoint(lng, lat)::geography,
    radius_km * 1000
  )
  and (p_service_type is null or s.service_type = p_service_type)
  and (p_country_code is null or s.country_code = p_country_code)
  order by distance_km asc
  limit 50;
$$;

-- Incidents table
create table incidents (
  id uuid primary key default gen_random_uuid(),
  user_name text,
  blood_group text,
  trigger_type text check (trigger_type in ('auto', 'manual')),
  location geometry(Point, 4326),
  address text,
  country_code char(2),
  status text default 'active',
  sms_status jsonb default '{}',
  created_at timestamptz default now(),
  resolved_at timestamptz
);
