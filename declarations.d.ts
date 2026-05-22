declare module 'llama.rn' {
  export interface LlamaOptions {
    model: string;
    use_mlock?: boolean;
    n_ctx?: number;
    n_threads?: number;
    n_gpu_layers?: number;
  }

  export interface LlamaContext {
    completion: (
      params: {
        prompt: string;
        n_predict: number;
        temperature: number;
        stop: string[];
      },
      callback: (data: { token: string }) => void,
    ) => Promise<{ text: string }>;
    release: () => Promise<void>;
  }

  export function initLlama(options: LlamaOptions): Promise<LlamaContext>;
}

declare module 'expo-notifications' {
  import { ComponentType } from 'react';

  export enum AndroidImportance {
    NONE = 1,
    MIN = 2,
    LOW = 3,
    DEFAULT = 4,
    HIGH = 5,
    MAX = 6,
  }

  export interface NotificationChannelSettings {
    name: string;
    importance: AndroidImportance;
    sound?: string | boolean;
    vibrationPattern?: number[];
  }

  export interface NotificationContentInput {
    title?: string;
    body?: string;
    data?: Record<string, unknown>;
    sound?: boolean;
  }

  export interface NotificationTriggerInput {
    type?: string;
    seconds?: number;
    date?: Date;
  }

  export interface NotificationPermissionsResponse {
    status: 'granted' | 'denied' | 'undetermined';
  }

  export function setNotificationChannelAsync(
    channelId: string,
    settings: NotificationChannelSettings,
  ): Promise<void>;

  export function setNotificationHandler(handler: {
    handleNotification: () => Promise<{
      shouldShowAlert: boolean;
      shouldPlaySound: boolean;
      shouldSetBadge: boolean;
    }>;
  }): void;

  export function requestPermissionsAsync(): Promise<NotificationPermissionsResponse>;

  export function scheduleNotificationAsync(notification: {
    content: NotificationContentInput;
    trigger: NotificationTriggerInput | null;
  }): Promise<string>;
}

declare module 'react-native-webrtc' {
  import { EventSubscription } from 'react-native';

  export interface MediaStreamTrack {
    id: string;
    kind: string;
    enabled: boolean;
    readyState: string;
    stop(): void;
  }

  export class MediaStream {
    id: string;
    getTracks(): MediaStreamTrack[];
    getAudioTracks(): MediaStreamTrack[];
    getVideoTracks(): MediaStreamTrack[];
  }

  export interface RTCIceCandidateEvent {
    candidate: RTCIceCandidate;
  }

  export interface RTCTrackEvent {
    streams: MediaStream[];
    track: MediaStreamTrack;
  }

  export class RTCPeerConnection {
    constructor(configuration: RTCConfiguration);
    createOffer(options?: RTCOfferOptions): Promise<RTCSessionDescription>;
    createAnswer(options?: RTCAnswerOptions): Promise<RTCSessionDescription>;
    setLocalDescription(description: RTCSessionDescription): Promise<void>;
    setRemoteDescription(description: RTCSessionDescription): Promise<void>;
    addTrack(track: MediaStreamTrack): void;
    addIceCandidate(candidate: RTCIceCandidate): Promise<void>;
    close(): void;
    getLocalStreams(): MediaStream[];
    getRemoteStreams(): MediaStream[];
    onicecandidate?: ((event: RTCIceCandidateEvent) => void) | null;
    ontrack?: ((event: RTCTrackEvent) => void) | null;
    onconnectionstatechange?: (() => void) | null;
    connectionState?: string;
  }

  export class RTCSessionDescription {
    constructor(description: { type: string; sdp: string });
    type: string;
    sdp: string;
  }

  export class RTCIceCandidate {
    constructor(candidate: { candidate: string; sdpMid: string; sdpMLineIndex: number });
    candidate: string;
    sdpMid: string;
    sdpMLineIndex: number;
  }

  export interface MediaDevices {
    getUserMedia(constraints: { video?: boolean | object; audio?: boolean | object }): Promise<MediaStream>;
    getDisplayMedia(constraints: object): Promise<MediaStream>;
    enumerateDevices(): Promise<Array<{ deviceId: string; kind: string; label: string; groupId: string }>>;
    ondevicechange?: (() => void) | null;
  }

  export const mediaDevices: MediaDevices;

  export function registerGlobals(): void;
}

declare module 'lucide-react-native' {
  export interface LucideProps {
    size?: number | string;
    color?: string;
    strokeWidth?: number | string;
    absoluteStrokeWidth?: boolean;
    style?: import('react-native').ViewStyle;
    testID?: string;
    [key: string]: unknown;
  }

  export type LucideIcon = React.ForwardRefExoticComponent<LucideProps & React.RefAttributes<SVGSVGElement>>;

  export const Home: LucideIcon;
  export const MapPin: LucideIcon;
  export const MessageCircle: LucideIcon;
  export const Settings: LucideIcon;
  export const ShieldAlert: LucideIcon;
  export const Shield: LucideIcon;
  export const Wifi: LucideIcon;
  export const WifiOff: LucideIcon;
  export const Cpu: LucideIcon;
  export const ChevronDown: LucideIcon;
  export const ChevronUp: LucideIcon;
  export const ChevronRight: LucideIcon;
  export const Car: LucideIcon;
  export const Stethoscope: LucideIcon;
  export const Wrench: LucideIcon;
  export const Flame: LucideIcon;
  export const Building2: LucideIcon;
  export const HeartPulse: LucideIcon;
  export const Heart: LucideIcon;
  export const Ambulance: LucideIcon;
  export const Siren: LucideIcon;
  export const BadgeAlert: LucideIcon;
  export const Navigation: LucideIcon;
  export const Zap: LucideIcon;
  export const Phone: LucideIcon;
  export const User: LucideIcon;
  export const Activity: LucideIcon;
  export const List: LucideIcon;
  export const Map: LucideIcon;
  export const RefreshCw: LucideIcon;
  export const Search: LucideIcon;
  export const TriangleAlert: LucideIcon;
  export const AlertTriangle: LucideIcon;
  export const Plus: LucideIcon;
  export const Trash2: LucideIcon;
  export const Droplet: LucideIcon;
  export const Languages: LucideIcon;
  export const Pill: LucideIcon;
  export const Bell: LucideIcon;
  export const Check: LucideIcon;
  export const Clock: LucideIcon;
  export const ArrowLeft: LucideIcon;
  export const Video: LucideIcon;
  export const VideoOff: LucideIcon;
  export const Mic: LucideIcon;
  export const MicOff: LucideIcon;
  export const CheckCircle: LucideIcon;
  export const XCircle: LucideIcon;
  export const Share2: LucideIcon;
  export const Download: LucideIcon;
  export const X: LucideIcon;
  export const Database: LucideIcon;
  export const Loader: LucideIcon;
  export const Send: LucideIcon;
  export const Bot: LucideIcon;
  export const Eye: LucideIcon;
  export const EyeOff: LucideIcon;
  export const CirclePause: LucideIcon;
  export const CirclePlay: LucideIcon;
}
