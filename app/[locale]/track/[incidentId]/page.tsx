'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/LanguageProvider';
import { createClient } from '@/lib/supabase/client';
import type { Incident, Responder } from '@/lib/types';
import {
  ArrowLeft,
  MapPin,
  Users,
  MessageSquare,
  Clock,
  AlertCircle,
  CheckCircle2,
  Copy,
  Check,
  Loader2,
  Activity,
} from 'lucide-react';

const MapWithNoSSR = dynamic(() => import('@/components/ResponderMap'), { ssr: false });

export default function TrackPage() {
  const params = useParams();
  const pathname = usePathname();
  const locale = (params?.locale as string) || 'en';
  const incidentId = params?.incidentId as string;
  const { t, language } = useLanguage();
  const [incident, setIncident] = useState<Incident | null>(null);
  const [responders, setResponders] = useState<Responder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!incidentId) return;
    const supabase = createClient();

    async function fetchIncident() {
      try {
        const { data, error: err } = await supabase
          .from('incidents')
          .select('*')
          .eq('id', incidentId)
          .single();
        if (err) throw err;
        setIncident(data);
      } catch {
        setError(t('track.notFound'));
      } finally {
        setLoading(false);
      }
    }
    fetchIncident();

    const channel = supabase
      .channel(`track-${incidentId}`)
      .on('broadcast', { event: 'location-update' }, (payload: any) => {
        setResponders((prev) => {
          const idx = prev.findIndex((r) => r.id === payload.responderId);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = { ...next[idx], lat: payload.lat, lng: payload.lng, updatedAt: Date.now() };
            return next;
          }
          return [
            ...prev,
            {
              id: payload.responderId,
              name: payload.name || 'Responder',
              lat: payload.lat,
              lng: payload.lng,
              type: payload.responderType || 'ambulance',
              updatedAt: Date.now(),
            },
          ];
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [incidentId]);

  async function handleCopyLink() {
    try {
      await navigator.clipboard?.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      console.error('Failed to copy link');
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 80, color: 'var(--text-tertiary)' }}>
        <Loader2
          size={40}
          style={{ animation: 'spin 1s linear infinite', margin: '0 auto 16px' }}
        />
        <p style={{ fontSize: 14, fontWeight: 500 }}>{t('common.loading')}</p>
      </div>
    );
  }

  if (error || !incident) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 24px' }}>
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            background: 'var(--red-soft)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            border: '1px solid var(--red-border)',
          }}
        >
          <AlertCircle size={32} color="#FF3B3B" />
        </div>
        <h2
          style={{
            color: 'var(--text-primary)',
            fontSize: 24,
            fontWeight: 800,
            marginBottom: 8,
          }}
        >
          {t('track.notFound')}
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24, fontSize: 14 }}>
          {error}
        </p>
        <Link
          href={`/${locale}/dashboard`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '12px 24px',
            background: 'linear-gradient(135deg, #FF3B3B, #E53535)',
            borderRadius: 'var(--radius-md)',
            color: '#fff',
            fontWeight: 700,
            textDecoration: 'none',
            fontSize: 14,
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 59, 59, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <ArrowLeft size={16} />
          {t('common.goBack')}
        </Link>
      </div>
    );
  }

  const mapCenter = useMemo<[number, number] | undefined>(() => {
    return incident?.location
      ? [incident.location.lng, incident.location.lat]
      : undefined;
  }, [incident?.location]);

  const isActive = incident.status !== 'resolved';
  const statusLabel = isActive ? t('track.sosActive') : t('track.sosResolved');
  const statusColor = isActive ? '#FF3B3B' : '#30D158';
  const statusSoft = isActive ? 'var(--red-soft)' : 'var(--green-soft)';
  const statusBorder = isActive ? 'var(--red-border)' : 'var(--green-border)';
  const timeStr = new Date(incident.createdAt).toLocaleString(
    language === 'English' ? 'en-IN' : language
  );
  const shortId = incidentId?.slice(0, 8).toUpperCase() || '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Back Link */}
      <Link
        href={`/${locale}/dashboard`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          color: 'var(--text-secondary)',
          fontSize: 13,
          fontWeight: 600,
          textDecoration: 'none',
          transition: 'color 0.15s ease',
          width: 'fit-content',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = 'var(--text-primary)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = 'var(--text-secondary)';
        }}
      >
        <ArrowLeft size={14} />
        Back to Dashboard
      </Link>

      {/* Status Banner */}
      <div
        style={{
          background: statusSoft,
          borderRadius: 'var(--radius-lg)',
          border: `1px solid ${statusBorder}`,
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          animation: 'fadeIn 0.2s ease-out',
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 'var(--radius-md)',
            background: isActive ? 'var(--red-soft)' : 'var(--green-soft)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {isActive ? (
            <AlertCircle size={24} color={statusColor} />
          ) : (
            <CheckCircle2 size={24} color={statusColor} />
          )}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h1
              style={{
                color: statusColor,
                fontSize: 20,
                fontWeight: 800,
                letterSpacing: -0.3,
              }}
            >
              {statusLabel}
            </h1>
            <span
              style={{
                fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--text-tertiary)',
                background: 'var(--surface)',
                padding: '4px 10px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)',
              }}
            >
              {shortId}
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 6 }}>
            {incident.user_name && (
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                {incident.user_name}
              </span>
            )}
            {incident.user_name && incident.blood_group && <span> &middot; </span>}
            {incident.blood_group && <span>Blood: {incident.blood_group} &middot; </span>}
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Clock size={12} />
              {timeStr}
            </span>
          </p>
        </div>
      </div>

      {/* Map */}
      <div
        style={{
          height: 450,
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          border: '1px solid var(--border)',
          position: 'relative',
          background: '#0b1220',
        }}
      >
        <MapWithNoSSR responders={responders} center={mapCenter} />
        <div
          style={{
            position: 'absolute',
            top: 12,
            left: 12,
            zIndex: 1000,
            padding: '6px 12px',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(19, 22, 27, 0.9)',
            border: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--text-secondary)',
            pointerEvents: 'none',
          }}
        >
          <MapPin size={14} color="var(--text-tertiary)" />
          Incident Location
        </div>
      </div>

      {/* Stats Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16,
        }}
      >
        {/* Responders */}
        <div
          style={{
            background: 'var(--surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border)',
            padding: '20px 24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 'var(--radius-md)',
                background: 'var(--green-soft)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Users size={18} color="#30D158" />
            </div>
            <h3
              style={{
                color: 'var(--text-tertiary)',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 1.2,
                textTransform: 'uppercase',
              }}
            >
              {t('track.responders')}
            </h3>
          </div>
          <p style={{ color: '#30D158', fontSize: 28, fontWeight: 800, lineHeight: 1 }}>
            {responders.length}
          </p>
          <p style={{ color: 'var(--text-secondary)', fontSize: 12, marginTop: 6 }}>
            Active nearby
          </p>
        </div>

        {/* SMS Status */}
        <div
          style={{
            background: 'var(--surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border)',
            padding: '20px 24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 'var(--radius-md)',
                background: 'var(--blue-soft)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MessageSquare size={18} color="#0A84FF" />
            </div>
            <h3
              style={{
                color: 'var(--text-tertiary)',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 1.2,
                textTransform: 'uppercase',
              }}
            >
              {t('track.smsStatus')}
            </h3>
          </div>
          {incident.smsStatuses && incident.smsStatuses.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {incident.smsStatuses.map((s, i) => (
                <div
                  key={s.contactId || i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 10px',
                    background: 'var(--bg-elevated)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <span style={{ color: 'var(--text-secondary)', fontSize: 12, fontWeight: 500 }}>
                    {s.name}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: s.deviceSent || s.backupSent ? '#30D158' : '#FF3B3B',
                    }}
                  >
                    {s.deviceSent || s.backupSent ? 'Sent' : 'Failed'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>
              {t('common.noData')}
            </p>
          )}
        </div>
      </div>

      {/* Share Link */}
      <div
        style={{
          background: 'var(--surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border)',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <p
            style={{
              color: 'var(--text-tertiary)',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 1,
              textTransform: 'uppercase',
              marginBottom: 4,
            }}
          >
            {t('track.shareLocation')}
          </p>
          <p style={{ color: 'var(--text-faint)', fontSize: 12 }}>
            Incident ID: {shortId}
          </p>
        </div>
        <button
          onClick={handleCopyLink}
          style={{
            padding: '10px 20px',
            background: copied ? 'var(--green-soft)' : 'var(--blue)',
            borderRadius: 'var(--radius-md)',
            border: copied ? '1px solid var(--green-border)' : 'none',
            color: copied ? '#30D158' : '#fff',
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            if (!copied) {
              e.currentTarget.style.background = '#3399ff';
            }
          }}
          onMouseLeave={(e) => {
            if (!copied) {
              e.currentTarget.style.background = 'var(--blue)';
            }
          }}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? 'Copied!' : 'Copy Link'}
        </button>
      </div>
    </div>
  );
}
