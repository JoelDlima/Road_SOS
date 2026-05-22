'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/LanguageProvider';
import { createClient } from '@/lib/supabase/client';
import { Mail, Lock, User, AlertCircle, CheckCircle, Loader2, Rocket } from 'lucide-react';

export default function SignupPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError(t('auth.required'));
      return;
    }
    if (password.length < 6) {
      setError(t('auth.weakPassword'));
      return;
    }
    setLoading(true);
    setError('');
    try {
      const supabase = createClient();
      const { error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { full_name: name.trim() } },
      });
      if (signUpError) throw signUpError;
      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 'calc(100vh - 120px)',
          padding: '24px 20px',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 420,
            animation: 'fadeIn 0.3s ease-out',
          }}
        >
          <div
            style={{
              background: 'var(--surface)',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--border)',
              padding: '40px 28px',
              textAlign: 'center',
              boxShadow: 'var(--shadow-lg)',
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
                margin: '0 auto 20px',
                border: '1px solid var(--green-border)',
              }}
            >
              <CheckCircle size={32} color="#30D158" />
            </div>
            <h1
              style={{
                color: 'var(--text-primary)',
                fontSize: 22,
                fontWeight: 800,
                marginBottom: 8,
              }}
            >
              {t('auth.accountCreated')}
            </h1>
            <p
              style={{
                color: 'var(--text-secondary)',
                fontSize: 14,
                marginBottom: 28,
                lineHeight: 1.5,
              }}
            >
              {t('auth.checkEmail')}
            </p>
            <Link
              href="/en/login"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '14px 32px',
                background: 'linear-gradient(135deg, #FF3B3B, #E53535)',
                borderRadius: 'var(--radius-md)',
                color: '#fff',
                fontWeight: 700,
                textDecoration: 'none',
                fontSize: 15,
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
              {t('auth.signIn')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 'calc(100vh - 120px)',
        padding: '24px 20px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          animation: 'fadeIn 0.3s ease-out',
        }}
      >
        <div
          style={{
            background: 'var(--surface)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--border)',
            padding: '32px 28px',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 'var(--radius-lg)',
                background: 'linear-gradient(135deg, rgba(48, 209, 88, 0.15), rgba(48, 209, 88, 0.05))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                border: '1px solid var(--green-border)',
              }}
            >
              <Rocket size={28} color="#30D158" />
            </div>
            <h1
              style={{
                color: 'var(--text-primary)',
                fontSize: 24,
                fontWeight: 800,
                letterSpacing: -0.5,
                marginBottom: 6,
              }}
            >
              {t('auth.signUp')}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
              Create your emergency response account
            </p>
          </div>

          {/* Error */}
          {error && (
            <div
              style={{
                padding: '12px 14px',
                background: 'var(--red-soft)',
                border: '1px solid var(--red-border)',
                borderRadius: 'var(--radius-md)',
                color: '#FF3B3B',
                fontSize: 13,
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 20,
              }}
              role="alert"
            >
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Name */}
            <div>
              <label
                style={{
                  color: 'var(--text-secondary)',
                  fontSize: 12,
                  fontWeight: 600,
                  display: 'block',
                  marginBottom: 6,
                }}
              >
                {t('auth.name')}
              </label>
              <div style={{ position: 'relative' }}>
                <div
                  style={{
                    position: 'absolute',
                    left: 14,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none',
                  }}
                >
                  <User size={16} color="var(--text-tertiary)" />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Arjun Sharma"
                  autoComplete="name"
                  style={{
                    width: '100%',
                    padding: '0 14px 0 42px',
                    height: 48,
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)',
                    fontSize: 14,
                    outline: 'none',
                    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'var(--blue)';
                    e.currentTarget.style.boxShadow = '0 0 0 3px var(--blue-soft)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label
                style={{
                  color: 'var(--text-secondary)',
                  fontSize: 12,
                  fontWeight: 600,
                  display: 'block',
                  marginBottom: 6,
                }}
              >
                {t('auth.email')}
              </label>
              <div style={{ position: 'relative' }}>
                <div
                  style={{
                    position: 'absolute',
                    left: 14,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none',
                  }}
                >
                  <Mail size={16} color="var(--text-tertiary)" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoCapitalize="none"
                  autoComplete="email"
                  style={{
                    width: '100%',
                    padding: '0 14px 0 42px',
                    height: 48,
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)',
                    fontSize: 14,
                    outline: 'none',
                    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'var(--blue)';
                    e.currentTarget.style.boxShadow = '0 0 0 3px var(--blue-soft)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                style={{
                  color: 'var(--text-secondary)',
                  fontSize: 12,
                  fontWeight: 600,
                  display: 'block',
                  marginBottom: 6,
                }}
              >
                {t('auth.password')}
              </label>
              <div style={{ position: 'relative' }}>
                <div
                  style={{
                    position: 'absolute',
                    left: 14,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none',
                  }}
                >
                  <Lock size={16} color="var(--text-tertiary)" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  autoComplete="new-password"
                  style={{
                    width: '100%',
                    padding: '0 14px 0 42px',
                    height: 48,
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)',
                    fontSize: 14,
                    outline: 'none',
                    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'var(--blue)';
                    e.currentTarget.style.boxShadow = '0 0 0 3px var(--blue-soft)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                height: 50,
                background: loading ? '#166534' : 'linear-gradient(135deg, #30D158, #28B84E)',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                color: '#fff',
                fontWeight: 700,
                fontSize: 15,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'all 0.15s ease',
                marginTop: 4,
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(48, 209, 88, 0.3)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                  {t('auth.creatingAccount')}
                </>
              ) : (
                t('auth.signUp')
              )}
            </button>
          </form>
        </div>

        {/* Footer Links */}
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <Link
            href="/en/login"
            style={{
              color: 'var(--text-secondary)',
              fontSize: 14,
              fontWeight: 500,
              textDecoration: 'none',
              transition: 'color 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--blue)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            {t('auth.hasAccount')}{' '}
            <span style={{ color: 'var(--blue)', fontWeight: 600 }}>Sign in</span>
          </Link>
        </div>
        <div style={{ textAlign: 'center', marginTop: 10 }}>
          <Link
            href="/en/dashboard"
            style={{
              color: 'var(--text-tertiary)',
              fontSize: 13,
              textDecoration: 'none',
              transition: 'color 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-tertiary)';
            }}
          >
            {t('auth.skip')}
          </Link>
        </div>
      </div>
    </div>
  );
}
