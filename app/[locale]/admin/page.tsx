'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/LanguageProvider';
import { Hospital, ChevronRight, Settings, Shield, Activity } from 'lucide-react';

export default function AdminPage() {
  const { t } = useLanguage();

  const adminCards = [
    {
      href: '/en/admin/services',
      icon: Hospital,
      title: t('admin.services'),
      description: `${t('admin.addService')}, ${t('admin.editService')}, ${t('admin.deleteService')}`,
      color: '#0A84FF',
      softBg: 'rgba(10, 132, 255, 0.12)',
      borderColor: 'rgba(10, 132, 255, 0.3)',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
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
          {t('admin.title')}
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>
          Manage your emergency response infrastructure
        </p>
      </div>

      {/* Admin Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 16,
        }}
      >
        {adminCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.href} href={card.href} style={{ textDecoration: 'none' }}>
              <div
                style={{
                  background: 'var(--surface)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border)',
                  padding: '24px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = card.borderColor;
                  e.currentTarget.style.background = card.softBg;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = `0 8px 24px ${card.softBg}`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.background = 'var(--surface)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 'var(--radius-md)',
                    background: card.softBg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 16,
                  }}
                >
                  <Icon size={24} color={card.color} />
                </div>
                <h2
                  style={{
                    color: 'var(--text-primary)',
                    fontSize: 18,
                    fontWeight: 700,
                    marginBottom: 6,
                  }}
                >
                  {card.title}
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.5 }}>
                  {card.description}
                </p>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    marginTop: 16,
                    color: card.color,
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  Manage
                  <ChevronRight size={14} />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Quick Stats */}
      <div
        style={{
          background: 'var(--surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border)',
          padding: '24px',
        }}
      >
        <h3
          style={{
            color: 'var(--text-primary)',
            fontSize: 16,
            fontWeight: 700,
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Settings size={18} color="var(--text-secondary)" />
          System Status
        </h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: 16,
          }}
        >
          {[
            { label: 'Database', status: 'Connected', color: '#30D158' },
            { label: 'Supabase', status: 'Online', color: '#30D158' },
            { label: 'Services', status: 'Active', color: '#0A84FF' },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                background: 'var(--bg-elevated)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
              }}
            >
              <span style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500 }}>
                {item.label}
              </span>
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  color: item.color,
                }}
              >
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: item.color,
                  }}
                />
                {item.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
