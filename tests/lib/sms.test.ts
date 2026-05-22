/// <reference types="jest" />
import { buildSOSMessage } from '../../lib/sms';

describe('buildSOSMessage', () => {
  const mockLocation = { lat: 15.4567, lng: 73.8278, address: 'Panaji, Goa', timestamp: Date.now() };
  const mockMedical = { allergies: 'Penicillin', medications: 'Metformin', conditions: 'Diabetes' };

  it('includes user name and trigger type', () => {
    const msg = buildSOSMessage('Arjun', mockLocation, 'manual');
    expect(msg).toContain('Arjun');
    expect(msg).toContain('manual SOS');
  });

  it('includes location and maps link', () => {
    const msg = buildSOSMessage('Arjun', mockLocation, 'manual');
    expect(msg).toContain('Panaji');
    expect(msg).toContain('maps.google.com');
  });

  it('includes medical info when provided', () => {
    const msg = buildSOSMessage('Arjun', mockLocation, 'auto', mockMedical);
    expect(msg).toContain('Penicillin');
    expect(msg).toContain('Metformin');
    expect(msg).toContain('Diabetes');
  });

  it('handles auto trigger type', () => {
    const msg = buildSOSMessage('Arjun', mockLocation, 'auto');
    expect(msg).toContain('auto crash detection');
  });

  it('handles missing medical info gracefully', () => {
    const msg = buildSOSMessage('Arjun', mockLocation, 'manual', undefined);
    expect(msg).not.toContain('Medical Info');
  });

  it('generates map link with correct coordinates', () => {
    const msg = buildSOSMessage('Test', mockLocation, 'manual');
    expect(msg).toContain('15.4567');
    expect(msg).toContain('73.8278');
  });
});
