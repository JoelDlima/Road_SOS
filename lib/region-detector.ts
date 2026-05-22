export interface RegionInfo {
  key: string;
  name: string;
  latMin: number;
  latMax: number;
  lngMin: number;
  lngMax: number;
}

const REGION_BOUNDARIES: RegionInfo[] = [
  {
    key: 'goa',
    name: 'Goa',
    latMin: 14.5,
    latMax: 15.8,
    lngMin: 73.5,
    lngMax: 74.3,
  },
  {
    key: 'maharashtra',
    name: 'Maharashtra',
    latMin: 15.8,
    latMax: 22.0,
    lngMin: 72.5,
    lngMax: 80.5,
  },
  {
    key: 'karnataka',
    name: 'Karnataka',
    latMin: 11.5,
    latMax: 15.8,
    lngMin: 74.0,
    lngMax: 78.5,
  },
  {
    key: 'kerala',
    name: 'Kerala',
    latMin: 8.5,
    latMax: 13.0,
    lngMin: 74.5,
    lngMax: 77.5,
  },
  {
    key: 'tamil-nadu',
    name: 'Tamil Nadu',
    latMin: 8.5,
    latMax: 14.0,
    lngMin: 76.5,
    lngMax: 80.5,
  },
  {
    key: 'delhi',
    name: 'Delhi',
    latMin: 28.4,
    latMax: 28.9,
    lngMin: 76.8,
    lngMax: 77.4,
  },
  {
    key: 'rajasthan',
    name: 'Rajasthan',
    latMin: 23.5,
    latMax: 30.0,
    lngMin: 69.5,
    lngMax: 78.0,
  },
  {
    key: 'gujarat',
    name: 'Gujarat',
    latMin: 20.0,
    latMax: 24.5,
    lngMin: 68.0,
    lngMax: 74.5,
  },
  {
    key: 'uttar-pradesh',
    name: 'Uttar Pradesh',
    latMin: 23.5,
    latMax: 30.5,
    lngMin: 77.0,
    lngMax: 84.5,
  },
  {
    key: 'west-bengal',
    name: 'West Bengal',
    latMin: 21.5,
    latMax: 27.5,
    lngMin: 85.5,
    lngMax: 89.5,
  },
];

const DEFAULT_REGION: RegionInfo = {
  key: 'india',
  name: 'India',
  latMin: -90,
  latMax: 90,
  lngMin: -180,
  lngMax: 180,
};

export function detectRegion(lat: number, lng: number): RegionInfo {
  for (const region of REGION_BOUNDARIES) {
    if (
      lat >= region.latMin &&
      lat <= region.latMax &&
      lng >= region.lngMin &&
      lng <= region.lngMax
    ) {
      return region;
    }
  }
  return DEFAULT_REGION;
}

export function getRegionByKey(key: string): RegionInfo {
  return REGION_BOUNDARIES.find((r) => r.key === key) ?? DEFAULT_REGION;
}

export const ALL_REGION_KEYS = REGION_BOUNDARIES.map((r) => r.key);
