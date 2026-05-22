import { Car, Flame, HeartPulse, LucideIcon, MapPin, Shield, Siren, Truck, Wrench } from 'lucide-react-native';

export type Tone = 'red' | 'green' | 'blue' | 'amber' | 'indigo' | 'neutral';

// Icon + colour tone for each emergency-service type, shared by the Home
// "nearby help" list and the Services screen cards.
const SERVICE_VISUAL: Record<string, { Icon: LucideIcon; tone: Tone }> = {
  hospital: { Icon: HeartPulse, tone: 'red' },
  trauma_centre: { Icon: HeartPulse, tone: 'red' },
  ambulance: { Icon: Siren, tone: 'amber' },
  police: { Icon: Shield, tone: 'blue' },
  fire_station: { Icon: Flame, tone: 'amber' },
  towing: { Icon: Truck, tone: 'neutral' },
  puncture: { Icon: Wrench, tone: 'amber' },
  showroom: { Icon: Car, tone: 'blue' },
};

export function serviceVisual(type: string): { Icon: LucideIcon; tone: Tone } {
  return SERVICE_VISUAL[type] ?? { Icon: MapPin, tone: 'neutral' };
}
