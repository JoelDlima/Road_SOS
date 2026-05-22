import { ChatMessage } from '../types';
import { ROADSOS_SYSTEM_PROMPT } from './local-llm';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Production model on Groq's catalogue. Confirmed against
// https://console.groq.com/docs/models — Llama 3.3 70B Versatile is the
// strongest production-tier open model Groq currently hosts.
const MODEL = 'llama-3.3-70b-versatile';

export const SYSTEM_PROMPT = ROADSOS_SYSTEM_PROMPT;

/** Hard-coded basic first aid — shown only as a *last resort* when AI is
 * fully unavailable. The chat screen no longer dumps this for cloud failures. */
export const OFFLINE_FIRST_AID = `Basic first-aid checklist:
1. Make sure you and the casualty are clear of traffic.
2. Call 112 (all-emergency) or 108 (ambulance) right now.
3. Apply firm pressure on any bleed with a clean cloth.
4. Don't move someone with a suspected spine injury unless there's fire.
5. If unconscious but breathing, recovery position on the left side.
6. If not breathing, start CPR (centre of chest, hard and fast, 100/min).
7. Keep them warm and talk to them until help arrives.`;

/** Topic-keyed first-aid blurbs, kept around so callers (e.g. tests, very
 * cold-start offline mode) can request them deliberately. The chat ladder
 * itself does NOT auto-paste these on cloud failure — that's intentional. */
export function getFallbackResponse(query: string): string {
  const q = query.toLowerCase();
  if (q.includes('bleed') || q.includes('blood') || q.includes('wound') || q.includes('cut')) {
    return `Bleeding — first aid:\n1. Disposable gloves if you have them.\n2. Firm direct pressure with the cleanest cloth — at least 10 minutes, no peeking.\n3. Soaked through? Add another layer; do NOT remove the first.\n4. Elevate the injured area above the heart if possible.\n5. Call 112 or 108 now.\n6. No tourniquet unless the limb is severed or pressure cannot stop it.`;
  }
  if (q.includes('unconscious') || q.includes('passed out') || q.includes('faint') || q.includes('not breathing') || q.includes('cpr')) {
    return `Unconscious — first aid:\n1. Make the scene safe.\n2. Tap the shoulder firmly and shout — any response?\n3. No response → call 112/108 immediately.\n4. Tilt the head back, lift the chin, check breathing for 10 seconds.\n5. Not breathing or only gasping → start CPR. Centre of chest, hard and fast (100–120/min), 30 compressions then 2 breaths.\n6. Breathing but unresponsive → recovery position on the LEFT side, top knee bent, face slightly down.`;
  }
  if (q.includes('crash') || q.includes('accident') || q.includes('collision') || q.includes('hit')) {
    return `Road accident — immediate steps:\n1. Stop, hazard lights on, parking brake.\n2. Check yourself and passengers for injuries.\n3. Call 112 / 108 / 100.\n4. Don't move injured persons unless there is fire or oncoming traffic.\n5. Warning triangle 50 m behind on a single-lane road, 100 m on an expressway.\n6. Photograph the scene before anything is moved — it matters for FIR + insurance.\n7. NHAI national highway helpline: 1033.`;
  }
  if (q.includes('breakdown') || q.includes('broke') || q.includes('engine') || q.includes('tyre') || q.includes('tire') || q.includes('puncture')) {
    return `Breakdown — what to do:\n1. Drift to the LEFT shoulder. Hazards on, parking brake.\n2. Get everyone OUT and behind the crash barrier — sitting in a stopped car on a shoulder is one of the deadliest highway positions.\n3. Reflective triangle 50 m behind (100 m on expressways).\n4. Call 1033 (NHAI) for towing on a national highway.\n5. Note your kilometre marker before you call — it speeds dispatch.`;
  }
  if (q.includes('fire') || q.includes('flame') || q.includes('smoke') || q.includes('burn')) {
    return `Vehicle fire — emergency response:\n1. Pull over, kill ignition, leave the key in.\n2. Get everyone at least 100 m away.\n3. Call 101 (fire) and 112.\n4. Do NOT open the bonnet — it feeds the fire oxygen.\n5. EV battery fire? Stay upwind; toxic gas.\n6. Wave traffic away with hazards / phone torch from 50 m back.`;
  }
  if (q.includes('hospital') || q.includes('doctor') || q.includes('medical')) {
    return `Find medical help:\n1. Emergency: 112 or 108 (ambulance).\n2. Non-emergency: open the Services tab — RoadSoS lists nearby hospitals ranked by distance.\n3. Tell the doctor your blood group, allergies, and current medications if you have them.\n4. The Good Samaritan Law (SC 2016/2020) protects bystanders who help.`;
  }
  return OFFLINE_FIRST_AID;
}

export interface UserContext {
  name?: string;
  bloodGroup?: string;
  language?: string;
  medicalInfo?: { allergies?: string; medications?: string; conditions?: string };
  location?: { lat: number; lng: number; address?: string };
  nearbyServices?: Array<{ name: string; service_type: string; phone: string; distance_km: number }>;
}

export function buildContextBlock(ctx?: UserContext): string {
  if (!ctx) return '';
  const parts: string[] = ['USER CONTEXT:'];

  if (ctx.name || ctx.bloodGroup) {
    const info = [ctx.name, ctx.bloodGroup ? `Blood ${ctx.bloodGroup}` : ''].filter(Boolean).join(' · ');
    parts.push(`- Profile: ${info}`);
  }

  if (ctx.language && ctx.language !== 'English') {
    parts.push(`- Preferred language: ${ctx.language} - REPLY IN ${ctx.language.toUpperCase()}.`);
  }

  if (ctx.medicalInfo) {
    const med = [];
    if (ctx.medicalInfo.allergies) med.push(`Allergies: ${ctx.medicalInfo.allergies}`);
    if (ctx.medicalInfo.medications) med.push(`Medications: ${ctx.medicalInfo.medications}`);
    if (ctx.medicalInfo.conditions) med.push(`Conditions: ${ctx.medicalInfo.conditions}`);
    if (med.length) parts.push(`- Medical: ${med.join(' | ')}`);
  }

  if (ctx.location) {
    const addr = ctx.location.address || `${ctx.location.lat.toFixed(4)}, ${ctx.location.lng.toFixed(4)}`;
    parts.push(`- Location: ${addr}`);
  }

  if (ctx.nearbyServices && ctx.nearbyServices.length > 0) {
    const services = ctx.nearbyServices.slice(0, 5).map(
      s => `  - ${s.name} - ${s.service_type} - ${s.phone} - ${s.distance_km.toFixed(1)} km`
    );
    parts.push(`- Nearby Services:\n${services.join('\n')}`);
  }

  return parts.join('\n');
}

/**
 * Stream a Groq completion as an async iterator of text chunks.
 *
 * Why this is non-streaming-on-the-wire:
 * - React Native's fetch polyfill returns `response.body == null` for
 *   chunked responses on most builds (RN 0.81 with Hermes included), so
 *   `getReader()` blows up. Switching to `stream:false` and chunking the
 *   final string client-side gives reliable behaviour across RN, with a
 *   typing-effect that's good enough for chat UI.
 * - Failures throw with a precise reason (status code, network message)
 *   instead of yielding canned text. The caller (chat.tsx) decides whether
 *   to fall through to local AI or show a short offline message — which
 *   is what the user wants instead of an automatic first-aid wall of text.
 */
export async function* streamGroqResponse(
  messages: ChatMessage[],
  userContext?: UserContext,
  signal?: AbortSignal,
): AsyncGenerator<string> {
  const apiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('EXPO_PUBLIC_GROQ_API_KEY is not set');
  }

  const contextBlock = buildContextBlock(userContext);
  const systemContent = contextBlock ? `${SYSTEM_PROMPT}\n\n${contextBlock}` : SYSTEM_PROMPT;

  const payload = {
    model: MODEL,
    messages: [
      { role: 'system', content: systemContent },
      ...messages.map((m) => ({ role: m.role === 'tool' ? 'assistant' : m.role, content: m.content })),
    ],
    stream: false,
    temperature: 0.3,
    max_tokens: 1024,
  };

  const controller = new AbortController();
  const onAbort = () => controller.abort();
  signal?.addEventListener('abort', onAbort);

  let response: Response;
  try {
    response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } finally {
    signal?.removeEventListener('abort', onAbort);
  }

  if (!response.ok) {
    let errBody = '';
    try { errBody = await response.text(); } catch { /* ignore */ }
    throw new Error(`Groq HTTP ${response.status}${errBody ? ': ' + errBody.slice(0, 200) : ''}`);
  }

  const json = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    error?: { message?: string };
  };

  if (json.error?.message) {
    throw new Error(`Groq: ${json.error.message}`);
  }

  const content = json.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('Groq returned an empty completion');
  }

  // Simulated streaming — yield small slices with a tiny delay so the chat UI
  // shows a typing effect. With Llama 3.3 70B on Groq the wall-clock latency
  // for the whole completion is ~600–1500 ms, so the chunked yield doesn't
  // perceptibly slow the user's read speed.
  const chunkSize = 10;
  for (let i = 0; i < content.length; i += chunkSize) {
    if (signal?.aborted) return;
    yield content.slice(i, i + chunkSize);
    await new Promise((resolve) => setTimeout(resolve, 18));
  }
}
