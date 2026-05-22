export type Brand<T, B extends string> = T & { readonly __brand: B };
export type UserId = Brand<string, 'UserId'>;
export type IncidentId = Brand<string, 'IncidentId'>;
export type ServiceId = Brand<string, 'ServiceId'>;
export type PhoneNumber = Brand<string, 'PhoneNumber'>;

export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export type Language =
  | 'English'
  | 'Hindi'
  | 'Tamil'
  | 'Telugu'
  | 'Kannada'
  | 'Malayalam'
  | 'Marathi';

export type ServiceType =
  | 'hospital'
  | 'trauma_centre'
  | 'ambulance'
  | 'police'
  | 'fire_station'
  | 'towing'
  | 'puncture'
  | 'showroom';

export type CrashSensitivity = 'low' | 'medium' | 'high';

// Drive = vehicle (car/bike/auto), Normal = pedestrian/walking
export type AppMode = 'drive' | 'normal';

export interface MedicalInfo {
  allergies: string;
  medications: string;
  conditions: string;
}

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
}

export interface UserProfile {
  name: string;
  bloodGroup: BloodGroup;
  language: Language;
  medicalInfo?: MedicalInfo;
  crashDetectionEnabled: boolean;
  crashSensitivity: CrashSensitivity;
  appMode: AppMode;
  devMode: boolean;
  onboardingComplete: boolean;
  batteryOptimization?: boolean;
}

export interface NearbyService {
  id: string;
  name: string;
  service_type: ServiceType;
  address: string;
  primary_phone: string;
  is_24x7: boolean;
  tags: Record<string, unknown>;
  distance_km: number;
  lat: number;
  lng: number;
}

export interface LocationData {
  lat: number;
  lng: number;
  address?: string;
  accuracy?: number;
  timestamp: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'tool';
  content: string;
  timestamp: number;
  isStreaming?: boolean;
}

export interface SMSStatus {
  contactId: string;
  name: string;
  phone: string;
  deviceSent: boolean;
  backupSent: boolean;
  error?: string;
}

export interface Incident {
  id: string;
  triggerType: 'auto' | 'manual';
  location: LocationData;
  services: NearbyService[];
  smsStatuses: SMSStatus[];
  createdAt: number;
}

export type AppStatus = 'online' | 'offline' | 'ai-offline';
