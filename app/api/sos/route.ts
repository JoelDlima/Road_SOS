import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Server-side only — service role key never exposed to client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { name, phone, lat, lng } = await req.json();

    if (!name?.trim() || !phone?.trim()) {
      return NextResponse.json({ error: 'Name and phone required' }, { status: 400 });
    }

    // Simple rate limit: max 3 SOS per IP per hour
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
    const { count } = await supabase
      .from('incidents')
      .select('id', { count: 'exact', head: true })
      .eq('address', `web-sos:${ip}`)
      .gte('created_at', oneHourAgo);

    if ((count ?? 0) >= 3) {
      return NextResponse.json({ error: 'Too many requests. Please call emergency services directly.' }, { status: 429 });
    }

    // Build location string for PostGIS if coordinates provided
    const locationValue = lat && lng ? `POINT(${lng} ${lat})` : null;

    const { data, error } = await supabase.from('incidents').insert({
      user_name: name.trim(),
      trigger_type: 'manual',
      status: 'active',
      address: `web-sos:${ip}`,
      ...(locationValue && { location: locationValue }),
      ...(phone.trim() && { sms_status: [{ phone: phone.trim(), name: name.trim(), sent: false }] }),
    }).select('id').single();

    if (error) throw error;

    return NextResponse.json({ id: data.id });
  } catch (err: any) {
    console.error('SOS API error:', err);
    return NextResponse.json({ error: 'Failed to send SOS' }, { status: 500 });
  }
}
