import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { encodeBase64 } from 'https://deno.land/std@0.168.0/encoding/base64.ts';

const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID') ?? '';
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN') ?? '';
const TWILIO_PHONE = Deno.env.get('TWILIO_PHONE_NUMBER') ?? '';

interface SOSPayload {
  incident_id: string;
  contacts: Array<{ name: string; phone: string }>;
  message: string;
  location: { lat: number; lng: number };
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const body: SOSPayload = await req.json();
    const results: Array<{ phone: string; success: boolean; error?: string }> = [];

    for (const contact of body.contacts) {
      try {
        const formData = new URLSearchParams({
          To: contact.phone,
          From: TWILIO_PHONE,
          Body: body.message,
        });

        const twilioRes = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
          {
            method: 'POST',
            headers: {
              Authorization: `Basic ${encodeBase64(new TextEncoder().encode(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`))}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData.toString(),
          }
        );

        results.push({ phone: contact.phone, success: twilioRes.ok });
      } catch (err) {
        results.push({ phone: contact.phone, success: false, error: String(err) });
      }
    }

    return new Response(JSON.stringify({ incident_id: body.incident_id, results }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
});
