-- Seed data: Goa, India emergency services
insert into services (name, service_type, address, city, state, country_code, location, primary_phone, is_24x7, tags) values
(
  'Goa Medical College & Hospital',
  'trauma_centre',
  'Bambolim, Panaji, Goa 403202',
  'Panaji', 'Goa', 'IN',
  ST_MakePoint(73.8278, 15.4567),
  '0832-2458700', true,
  '{"emergency": true, "icu": true}'::jsonb
),
(
  'SMRC Hospital',
  'hospital',
  'Ribandar, Panaji, Goa 403006',
  'Panaji', 'Goa', 'IN',
  ST_MakePoint(73.8436, 15.5007),
  '0832-2225824', false,
  '{}'::jsonb
),
(
  'Apollo Hospital Margao',
  'hospital',
  'Margao, South Goa 403601',
  'Margao', 'Goa', 'IN',
  ST_MakePoint(73.9862, 15.2832),
  '0832-2705000', true,
  '{"emergency": true}'::jsonb
),
(
  'Goa Police Headquarters',
  'police',
  'Panaji, Goa 403001',
  'Panaji', 'Goa', 'IN',
  ST_MakePoint(73.8278, 15.4989),
  '0832-2229350', true,
  '{}'::jsonb
),
(
  '108 Ambulance Service Goa',
  'ambulance',
  'Panaji, Goa',
  'Panaji', 'Goa', 'IN',
  ST_MakePoint(73.8278, 15.4909),
  '108', true,
  '{"emergency": true, "free": true}'::jsonb
),
(
  'Hanuman Towing Services',
  'towing',
  'NH 66, Panaji, Goa 403001',
  'Panaji', 'Goa', 'IN',
  ST_MakePoint(73.8350, 15.4832),
  '+919822134567', true,
  '{}'::jsonb
),
(
  'Panaji Puncture Mart',
  'puncture',
  'Panaji Market Area, Goa 403001',
  'Panaji', 'Goa', 'IN',
  ST_MakePoint(73.8278, 15.4970),
  '+919876123456', false,
  '{}'::jsonb
),
(
  'Margao Traffic Police',
  'police',
  'Margao, South Goa 403601',
  'Margao', 'Goa', 'IN',
  ST_MakePoint(73.9822, 15.2787),
  '0832-2702175', true,
  '{"traffic": true}'::jsonb
),
(
  'Sai Towing & Recovery',
  'towing',
  'Vasco da Gama, Goa 403802',
  'Vasco da Gama', 'Goa', 'IN',
  ST_MakePoint(73.8147, 15.3979),
  '+919767145678', true,
  '{}'::jsonb
),
(
  'Mapusa Sub-District Hospital',
  'hospital',
  'Mapusa, North Goa 403507',
  'Mapusa', 'Goa', 'IN',
  ST_MakePoint(73.8118, 15.5940),
  '0832-2262372', true,
  '{"emergency": true}'::jsonb
);
