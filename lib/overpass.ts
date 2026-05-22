import { NearbyService } from '../types';

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

interface OverpassNode {
  type: 'node';
  id: number;
  lat: number;
  lon: number;
  tags?: Record<string, string>;
}

interface OverpassResponse {
  elements: OverpassNode[];
}

const SERVICE_TYPE_MAP: Record<string, { serviceType: string; tags: Record<string, unknown> }> = {
  hospital: { serviceType: 'hospital', tags: { emergency: true } },
  clinic: { serviceType: 'hospital', tags: {} },
  doctors: { serviceType: 'hospital', tags: {} },
  police: { serviceType: 'police', tags: { emergency: true } },
  fire_station: { serviceType: 'fire_station', tags: { emergency: true, fire: true } },
  ambulance_station: { serviceType: 'ambulance', tags: { emergency: true } },
  fuel: { serviceType: 'towing', tags: {} },
  car_repair: { serviceType: 'towing', tags: {} },
  tyres: { serviceType: 'puncture', tags: {} },
};

function buildQuery(lat: number, lng: number, radiusKm: number): string {
  const radius = radiusKm * 1000;
  return `
[out:json][timeout:25];
(
  node["amenity"="hospital"](around:${radius},${lat},${lng});
  node["amenity"="clinic"](around:${radius},${lat},${lng});
  node["amenity"="police"](around:${radius},${lat},${lng});
  node["amenity"="fire_station"](around:${radius},${lat},${lng});
  node["amenity"="ambulance_station"](around:${radius},${lat},${lng});
  node["shop"="tyres"](around:${radius},${lat},${lng});
  node["amenity"="car_repair"](around:${radius},${lat},${lng});
  node["amenity"="fuel"](around:${radius},${lat},${lng});
  node["emergency"="fire_station"](around:${radius},${lat},${lng});
  node["emergency"="ambulance_station"](around:${radius},${lat},${lng});
);
out;
`;
}

function mapServiceType(tags: Record<string, string>): { serviceType: string; tags: Record<string, unknown> } {
  const amenity = tags.amenity || '';
  const shop = tags.shop || '';
  const emergency = tags.emergency || '';

  if (emergency === 'fire_station') return SERVICE_TYPE_MAP['fire_station']!;
  if (emergency === 'ambulance_station') return SERVICE_TYPE_MAP['ambulance_station']!;
  if (shop === 'tyres') return SERVICE_TYPE_MAP['tyres']!;
  if (amenity === 'hospital') return SERVICE_TYPE_MAP['hospital']!;
  if (amenity === 'clinic' || amenity === 'doctors') return SERVICE_TYPE_MAP['clinic']!;
  if (amenity === 'police') return SERVICE_TYPE_MAP['police']!;
  if (amenity === 'fire_station') return SERVICE_TYPE_MAP['fire_station']!;
  if (amenity === 'ambulance_station') return SERVICE_TYPE_MAP['ambulance_station']!;
  if (amenity === 'fuel') return SERVICE_TYPE_MAP['fuel']!;
  if (amenity === 'car_repair') return SERVICE_TYPE_MAP['car_repair']!;

  return { serviceType: 'hospital', tags: {} };
}

function toService(node: OverpassNode, index: number): NearbyService | null {
  if (!node.tags) return null;

  const name = node.tags.name || node.tags['name:en'] || node.tags['name:hi'] || `Service #${node.id}`;
  const { serviceType, tags: extraTags } = mapServiceType(node.tags);

  const phone = node.tags.phone || node.tags['contact:phone'] || node.tags['phone:mobile'] || '';
  const website = node.tags.website || node.tags['contact:website'] || '';
  const openingHours = node.tags.opening_hours || '';
  const is24x7 = openingHours === '24/7' || openingHours === 'Mo-Su 00:00-24:00' || node.tags.emergency === 'yes';

  const addressParts = [
    node.tags['addr:street'],
    node.tags['addr:city'],
    node.tags['addr:state'],
    node.tags['addr:postcode'],
  ].filter(Boolean);
  const address = addressParts.length > 0 ? addressParts.join(', ') : '';

  return {
    id: `osm-${node.id}`,
    name,
    service_type: serviceType as NearbyService['service_type'],
    address,
    primary_phone: phone || '',
    is_24x7: is24x7,
    tags: { ...extraTags, source: 'overpass', website },
    distance_km: 0,
    lat: node.lat,
    lng: node.lon,
  };
}

export async function fetchNearbyPOIs(
  lat: number,
  lng: number,
  radiusKm: number = 10
): Promise<NearbyService[]> {
  const query = buildQuery(lat, lng, radiusKm);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(OVERPASS_URL, {
      method: 'POST',
      body: `data=${encodeURIComponent(query)}`,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Overpass API error: ${response.status}`);
    }

    let data: OverpassResponse;
    try {
      data = await response.json();
    } catch {
      throw new Error('Overpass API returned invalid JSON');
    }

    const services = data.elements
      .map((node, i) => toService(node, i))
      .filter((s): s is NearbyService => s !== null);

    return services;
  } finally {
    clearTimeout(timeoutId);
  }
}
