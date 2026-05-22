'use client';

import Link from 'next/link';
import { Search, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        gap: 16,
        padding: 24,
        background: 'var(--bg)',
        color: 'var(--text-primary)',
      }}
    >
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: '50%',
          background: 'var(--blue-soft)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 8,
          border: '1px solid var(--blue-border)',
        }}
      >
        <Search size={32} color="#0A84FF" />
      </div>
      <h1 style={{ fontSize: 28, fontWeight: 800 }}>Page not found</h1>
      <p style={{ color: 'var(--text-secondary)', textAlign: 'center', fontSize: 14 }}>
        The page you are looking for does not exist.
      </p>
      <Link
        href="/"
        style={{
          background: 'linear-gradient(135deg, #FF3B3B, #E53535)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 24px',
          color: '#fff',
          fontWeight: 700,
          textDecoration: 'none',
          fontSize: 15,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          marginTop: 8,
          transition: 'all 0.15s ease',
        }}
      >
        <ArrowLeft size={16} />
        Go Home
      </Link>
    </div>
  );
}
