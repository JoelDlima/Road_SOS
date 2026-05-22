'use client';

import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export default function AppError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
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
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: 'var(--red-soft)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 8,
          border: '1px solid var(--red-border)',
        }}
      >
        <AlertTriangle size={28} color="#FF3B3B" />
      </div>
      <h1 style={{ fontSize: 24, fontWeight: 800 }}>Something went wrong</h1>
      <p
        style={{
          color: 'var(--text-secondary)',
          textAlign: 'center',
          maxWidth: 400,
          fontSize: 14,
          lineHeight: 1.5,
        }}
      >
        {error.message}
      </p>
      <button
        onClick={reset}
        style={{
          background: 'linear-gradient(135deg, #FF3B3B, #E53535)',
          border: 'none',
          borderRadius: 'var(--radius-md)',
          padding: '12px 24px',
          color: '#fff',
          fontWeight: 700,
          cursor: 'pointer',
          fontSize: 15,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginTop: 8,
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
        <RotateCcw size={16} />
        Try Again
      </button>
    </div>
  );
}
