'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useLanguage } from '@/lib/i18n/LanguageProvider';
import { createClient } from '@/lib/supabase/client';
import type { Incident, Responder } from '@/lib/types';
import {
  AlertTriangle,
  Activity,
  Users,
  Clock,
  Zap,
  Hand,
  ChevronRight,
  MapPin,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Shield,
} from 'lucide-react';

const MapWithNoSSR = dynamic(() => import('@/components/ResponderMap'), { ssr: false });

const COLORS = {
  red: '#FF3B3B',
  redSoft: 'rgba(255, 59, 59, 0.12)',
  redBorder: 'rgba(255, 59, 59, 0.3)',
  green: '#30D158',
  greenSoft: 'rgba(48, 209, 88, 0.12)',
  greenBorder: 'rgba(48, 209, 88, 0.3)',
  blue: '#0A84FF',
  blueSoft: 'rgba(10, 132, 255, 0.12)',
  blueBorder: 'rgba(10, 132, 255, 0.3)',
  amber: '#FFD60A',
  amberSoft: 'rgba(255, 214, 10, 0.12)',
  amberBorder: 'rgba(255, 214, 10, 0.3)',
  purple: '#BF5AF2',
  purpleSoft: 'rgba(191, 90, 242, 0.12)',
  purpleBorder: 'rgba(191, 90, 242, 0.3)',
  border: 'rgba(255, 255, 255, 0.06)',
  borderStrong: 'rgba(255, 255, 255, 0.12)',
  surface: '#13161B',
  surfaceHover: '#1A1F27',
};

function StatCard({
  label,
  value,
  color,
  sub,
  icon: Icon,
  glowColor,
}: {
  label: string;
  value: string | number;
  color: string;
  sub: string;
  icon: React.ElementType;
  glowColor?: string;
}) {
  return (
    <div
      style={{
        background: 'var(--surface)',
        borderRadius: 'var(--radius-lg)',
        border: `1px solid var(--border)`,
        padding: '20px 24px',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.2s ease',
        cursor: 'default',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-strong)';
        e.currentTarget.style.background = 'var(--surface-hover)';
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = glowColor ? `0 8px 24px ${glowColor}` : 'var(--shadow-lg)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border)';
        e.currentTarget.style.background = 'var(--surface)';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
      role="status"
      aria-label={`${label}: ${value}`}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: color, opacity: 0.6 }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ flex: 1 }}>
          <p
            style={{
              color: 'var(--text-tertiary)',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 1.2,
              textTransform: 'uppercase',
              marginBottom: 8,
            }}
          >
            {label}
          </p>
          <p style={{ color, fontSize: 32, fontWeight: 800, lineHeight: 1, letterSpacing: -1 }}>
            {value}
          </p>
          <p style={{ color: 'var(--text-secondary)', fontSize: 12, marginTop: 8, fontWeight: 500 }}>
            {sub}
          </p>
        </div>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 'var(--radius-md)',
            background: `${color}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Icon size={22} color={color} strokeWidth={2} />
        </div>
      </div>
    </div>
  );
}

function ActivityRow({
  incident,
  index,
  language,
}: {
  incident: Incident;
  index: number;
  language: string;
}) {
  const isAuto = incident.triggerType === 'auto';
  const isActive = incident.status !== 'resolved';
  const shortId = incident.id.slice(0, 8).toUpperCase();
  const timeStr = new Date(incident.createdAt).toLocaleString(language === 'English' ? 'en-IN' : language);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '14px 20px',
        borderBottom: `1px solid var(--border)`,
        gap: 14,
        transition: 'background 0.15s ease',
        animationDelay: `${index * 50}ms`,
      }}
      className="animate-fade-in"
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'var(--surface-hover)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 'var(--radius-md)',
          background: isAuto ? COLORS.amberSoft : COLORS.blueSoft,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {isAuto ? (
          <Zap size={16} color={COLORS.amber} />
        ) : (
          <Hand size={16} color={COLORS.blue} />
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span
            style={{
              color: 'var(--text-primary)',
              fontWeight: 600,
              fontSize: 13,
              fontFamily: 'ui-monospace, SFMono-Regular, monospace',
              letterSpacing: 0.5,
            }}
          >
            {shortId}
          </span>
          {incident.user_name && (
            <span style={{ color: 'var(--text-secondary)', fontSize: 12, fontWeight: 500 }}>
              {incident.user_name}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
          <Clock size={12} color="var(--text-tertiary)" />
          <span style={{ color: 'var(--text-tertiary)', fontSize: 11 }}>{timeStr}</span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <span
          style={{
            padding: '4px 10px',
            borderRadius: 'var(--radius-full)',
            fontSize: 11,
            fontWeight: 700,
            background: isAuto ? COLORS.amberSoft : COLORS.blueSoft,
            color: isAuto ? COLORS.amber : COLORS.blue,
            border: `1px solid ${isAuto ? COLORS.amberBorder : COLORS.blueBorder}`,
            textTransform: 'capitalize',
            whiteSpace: 'nowrap',
          }}
        >
          {isAuto ? 'Auto' : 'Manual'}
        </span>
        <span
          style={{
            padding: '4px 10px',
            borderRadius: 'var(--radius-full)',
            fontSize: 11,
            fontWeight: 700,
            background: isActive ? COLORS.redSoft : COLORS.greenSoft,
            color: isActive ? COLORS.red : COLORS.green,
            border: `1px solid ${isActive ? COLORS.redBorder : COLORS.greenBorder}`,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            whiteSpace: 'nowrap',
          }}
        >
          {isActive ? (
            <AlertCircle size={10} />
          ) : (
            <CheckCircle2 size={10} />
          )}
          {isActive ? 'Active' : 'Resolved'}
        </span>
      </div>

      <a
        href={`/en/track/${incident.id}`}
        style={{
          padding: '8px 14px',
          borderRadius: 'var(--radius-full)',
          fontSize: 12,
          fontWeight: 600,
          background: 'var(--blue)',
          color: '#fff',
          textDecoration: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          transition: 'all 0.15s ease',
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#3399ff';
          e.currentTarget.style.transform = 'translateY(-1px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'var(--blue)';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
        aria-label={`View details for incident ${shortId}`}
      >
        View
        <ChevronRight size={14} />
      </a>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: '60px 24px',
        background: 'var(--surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)',
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: 'var(--green-soft)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
        }}
      >
        <Shield size={28} color={COLORS.green} />
      </div>
      <p style={{ color: 'var(--text-secondary)', fontSize: 15, fontWeight: 500 }}>{message}</p>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-tertiary)' }}>
      <div
        style={{
          width: 40,
          height: 40,
          border: '3px solid var(--border)',
          borderTopColor: 'var(--blue)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
          margin: '0 auto 16px',
        }}
      />
      <p style={{ fontSize: 14, fontWeight: 500 }}>Loading dashboard...</p>
    </div>
  );
}

export default function DashboardPage() {
  const { t, language } = useLanguage();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [responders, setResponders] = useState<Responder[]>([]);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'auto' | 'manual'>('all');

  useEffect(() => {
    const supabase = createClient();
    let channel: any;
    let responderChannel: any;

    async function init() {
      try {
        const { data } = await supabase
          .from('incidents')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20);
        if (data) setIncidents(data.map(mapIncident));
      } catch {
        console.error('Failed to fetch incidents');
      } finally {
        setLoading(false);
      }

      channel = supabase
        .channel('incidents-web')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'incidents' },
          (payload: any) => {
            setIncidents((prev) => [mapIncident(payload.new), ...prev].slice(0, 20));
          }
        )
        .subscribe();

      responderChannel = supabase.channel('responder-locations-web');
      responderChannel.on('broadcast', { event: 'location-update' }, (payload: any) => {
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
        setConnected(true);
      });
      responderChannel.subscribe();
    }
    init();
    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(responderChannel);
    };
  }, []);

  function mapIncident(raw: any): Incident {
    return {
      id: raw.id,
      triggerType: raw.trigger_type || 'manual',
      createdAt: new Date(raw.created_at).getTime(),
      location: raw.lat && raw.lng ? { lat: raw.lat, lng: raw.lng, timestamp: Date.now() } : undefined,
      services: [],
      smsStatuses: [],
      user_name: raw.user_name,
      blood_group: raw.blood_group,
      status: raw.status,
    };
  }

  const filtered = useMemo(
    () => incidents.filter((i) => filter === 'all' || i.triggerType === filter),
    [incidents, filter]
  );
  const activeCount = useMemo(
    () => incidents.filter((i) => i.status !== 'resolved').length,
    [incidents]
  );
  const resolvedCount = useMemo(
    () => incidents.filter((i) => i.status === 'resolved').length,
    [incidents]
  );

  const filters: { key: 'all' | 'auto' | 'manual'; label: string; icon: React.ElementType }[] = [
    { key: 'all', label: t('common.all'), icon: Activity },
    { key: 'auto', label: 'Auto', icon: Zap },
    { key: 'manual', label: 'Manual', icon: Hand },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1
            style={{
              color: 'var(--text-primary)',
              fontSize: 'clamp(22px, 3vw, 28px)',
              fontWeight: 800,
              letterSpacing: -0.5,
              lineHeight: 1.2,
            }}
          >
            {t('dashboard.title')}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4, fontWeight: 400 }}>
            Real-time emergency monitoring and response
          </p>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 12px',
            borderRadius: 'var(--radius-full)',
            background: connected ? 'var(--green-soft)' : 'var(--red-soft)',
            border: `1px solid ${connected ? 'var(--green-border)' : 'var(--red-border)'}`,
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: connected ? COLORS.green : COLORS.red,
              boxShadow: `0 0 8px ${connected ? COLORS.green : COLORS.red}`,
            }}
          />
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: connected ? COLORS.green : COLORS.red,
            }}
          >
            {connected ? 'Live' : 'Offline'}
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
        }}
      >
        <StatCard
          label={t('dashboard.activeIncidents')}
          value={activeCount}
          color={COLORS.red}
          sub={`${incidents.length} total incidents`}
          icon={AlertTriangle}
          glowColor={COLORS.redSoft}
        />
        <StatCard
          label={t('dashboard.totalSOS')}
          value={incidents.length}
          color={COLORS.blue}
          sub={`${resolvedCount} resolved`}
          icon={TrendingUp}
          glowColor={COLORS.blueSoft}
        />
        <StatCard
          label={t('dashboard.respondersActive')}
          value={responders.length}
          color={COLORS.green}
          sub={connected ? t('dashboard.connected') : t('dashboard.disconnected')}
          icon={Users}
          glowColor={COLORS.greenSoft}
        />
        <StatCard
          label="Response Rate"
          value={incidents.length > 0 ? `${Math.round((resolvedCount / incidents.length) * 100)}%` : '—'}
          color={COLORS.purple}
          sub="Resolution rate"
          icon={CheckCircle2}
          glowColor={COLORS.purpleSoft}
        />
      </div>

      {/* Map */}
      <div
        style={{
          height: 450,
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          border: `1px solid var(--border)`,
          position: 'relative',
          background: '#0b1220',
        }}
      >
        <MapWithNoSSR responders={responders} />
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
          Live Map
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <h2
            style={{
              color: 'var(--text-primary)',
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: -0.3,
            }}
          >
            {t('dashboard.recentActivity')}
          </h2>
          <div style={{ display: 'flex', gap: 6 }}>
            {filters.map((f) => {
              const isActive = filter === f.key;
              const Icon = f.icon;
              return (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  style={{
                    padding: '7px 14px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: 12,
                    fontWeight: 600,
                    border: '1px solid',
                    cursor: 'pointer',
                    background: isActive ? 'var(--red-soft)' : 'var(--surface)',
                    color: isActive ? COLORS.red : 'var(--text-secondary)',
                    borderColor: isActive ? 'var(--red-border)' : 'var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'var(--surface-hover)';
                      e.currentTarget.style.borderColor = 'var(--border-strong)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'var(--surface)';
                      e.currentTarget.style.borderColor = 'var(--border)';
                    }
                  }}
                  aria-pressed={isActive}
                >
                  <Icon size={13} />
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>

        {loading ? (
          <LoadingSkeleton />
        ) : filtered.length === 0 ? (
          <EmptyState message={t('dashboard.noIncidents')} />
        ) : (
          <div
            style={{
              background: 'var(--surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border)',
              overflow: 'hidden',
            }}
          >
            {filtered.map((inc, idx) => (
              <ActivityRow
                key={inc.id}
                incident={inc}
                index={idx}
                language={language}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
