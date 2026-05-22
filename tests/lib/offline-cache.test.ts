/// <reference types="jest" />
import type { NearbyService } from '../../types';

const MOCK_SERVICES: NearbyService[] = [
  { id: '1', name: 'Test Hospital', service_type: 'hospital', address: 'Test Address', primary_phone: '1234567890', is_24x7: true, tags: {}, distance_km: 0, lat: 15.0, lng: 73.0 },
  { id: '2', name: 'Test Police', service_type: 'police', address: 'Test Address 2', primary_phone: '100', is_24x7: true, tags: {}, distance_km: 0, lat: 16.0, lng: 74.0 },
];

describe('offline-cache', () => {
  it('exports the legacy Goa seed array', () => {
    const mod = require('../../lib/offline-cache');
    expect(Array.isArray(mod.LEGACY_SEED_SERVICES)).toBe(true);
    expect(mod.LEGACY_SEED_SERVICES.length).toBeGreaterThan(0);
  });

  it('getSeedForRegion returns data for known regions', () => {
    const { getSeedForRegion } = require('../../lib/offline-cache');
    expect(Array.isArray(getSeedForRegion('goa'))).toBe(true);
    expect(getSeedForRegion('goa').length).toBeGreaterThan(0);
    expect(getSeedForRegion('maharashtra').length).toBeGreaterThan(0);
    expect(getSeedForRegion('delhi').length).toBeGreaterThan(0);
  });

  it('getSeedForRegion returns empty for unknown regions', () => {
    const { getSeedForRegion } = require('../../lib/offline-cache');
    expect(getSeedForRegion('atlantis')).toEqual([]);
  });

  it('every seed entry has required NearbyService fields', () => {
    const { getSeedForRegion } = require('../../lib/offline-cache');
    const services = getSeedForRegion('goa');
    for (const s of services) {
      expect(typeof s.id).toBe('string');
      expect(typeof s.name).toBe('string');
      expect(typeof s.service_type).toBe('string');
      expect(typeof s.lat).toBe('number');
      expect(typeof s.lng).toBe('number');
      expect(typeof s.primary_phone).toBe('string');
    }
  });

  it('computeDistances returns nearest-first sorted results', () => {
    const { computeDistances } = require('../../lib/offline-cache');
    const result = computeDistances(MOCK_SERVICES, 15.5, 73.5);
    expect(result.length).toBe(2);
    expect(result[0].distance_km).toBeLessThanOrEqual(result[1].distance_km);
  });

  it('computeDistances returns 0 km for the user location itself', () => {
    const { computeDistances } = require('../../lib/offline-cache');
    const result = computeDistances(MOCK_SERVICES, 15.0, 73.0);
    expect(result[0].distance_km).toBe(0);
  });

  it('computeDistances handles undefined / empty input', () => {
    const { computeDistances } = require('../../lib/offline-cache');
    expect(computeDistances(undefined, 15, 73)).toEqual([]);
    expect(computeDistances([], 15, 73)).toEqual([]);
  });
});
