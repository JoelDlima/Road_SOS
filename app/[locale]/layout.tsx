'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { LanguageProvider, useLanguage } from '@/lib/i18n/LanguageProvider';
import { LANGUAGES, type Language } from '@/lib/i18n/translations';
import { Menu, X, ChevronDown, Globe } from 'lucide-react';

const NAV_ITEMS = (locale: string) => [
  { href: `/${locale}/dashboard`, key: 'nav.dashboard' },
  { href: `/${locale}/admin/services`, key: 'nav.services' },
  { href: `/${locale}/admin`, key: 'nav.admin' },
] as const;

function useActiveNav(locale: string) {
  const pathname = usePathname();
  return useCallback(
    (href: string) => {
      const dashboardHref = `/${locale}/dashboard`;
      if (href === dashboardHref) return pathname === dashboardHref || pathname?.startsWith(`/${locale}/track/`);
      return pathname?.startsWith(href);
    },
    [pathname, locale]
  );
}

function LocaleContent({ children }: { children: React.ReactNode }) {
  const { t, language, setLanguage } = useLanguage();
  const [langOpen, setLangOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const locale = pathname?.split('/')[1] || 'en';
  const isActive = useActiveNav(locale);
  const navItems = NAV_ITEMS(locale);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (langOpen && !target.closest('[data-lang-dropdown]')) {
        setLangOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [langOpen]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header
        style={{
          background: 'rgba(19, 22, 27, 0.8)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--border)',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: '0 auto',
            padding: '0 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: 64,
          }}
        >
          {/* Logo */}
          <Link href={`/${locale}`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 'var(--radius-sm)',
                background: 'linear-gradient(135deg, #FF3B3B, #FF6B6B)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 14,
                fontWeight: 900,
                color: '#fff',
              }}
            >
              S
            </div>
            <span style={{ color: 'var(--text-primary)', fontSize: 18, fontWeight: 800, letterSpacing: -0.5 }}>
              Road<span style={{ color: '#FF3B3B' }}>SoS</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
            className="desktop-nav"
          >
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 13,
                    fontWeight: 600,
                    color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                    textDecoration: 'none',
                    transition: 'all 0.15s ease',
                    background: active ? 'var(--surface-active)' : 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      e.currentTarget.style.background = 'var(--surface-hover)';
                      e.currentTarget.style.color = 'var(--text-primary)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'var(--text-secondary)';
                    }
                  }}
                >
                  {t(item.key)}
                </Link>
              );
            })}

            {/* Language Switcher */}
            <div style={{ position: 'relative' }} data-lang-dropdown>
              <button
                onClick={() => setLangOpen(!langOpen)}
                style={{
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 13,
                  fontWeight: 600,
                  background: 'var(--surface)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.15s ease',
                  marginLeft: 8,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-strong)';
                  e.currentTarget.style.background = 'var(--surface-hover)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.background = 'var(--surface)';
                }}
                aria-label="Change language"
                aria-expanded={langOpen}
              >
                <Globe size={14} />
                <span>{language}</span>
                <ChevronDown
                  size={14}
                  style={{
                    transition: 'transform 0.15s ease',
                    transform: langOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  }}
                />
              </button>
              {langOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                    minWidth: 180,
                    zIndex: 100,
                    boxShadow: 'var(--shadow-lg)',
                    animation: 'fadeIn 0.15s ease-out',
                  }}
                >
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang}
                      onClick={() => {
                        setLanguage(lang);
                        setLangOpen(false);
                      }}
                      style={{
                        display: 'block',
                        width: '100%',
                        padding: '10px 16px',
                        fontSize: 13,
                        fontWeight: language === lang ? 700 : 500,
                        color: language === lang ? 'var(--text-primary)' : 'var(--text-secondary)',
                        background: language === lang ? 'var(--blue-soft)' : 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'background 0.1s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background =
                          language === lang ? 'var(--blue-soft)' : 'var(--surface-hover)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background =
                          language === lang ? 'var(--blue-soft)' : 'transparent';
                      }}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              display: 'none',
              padding: 8,
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              transition: 'background 0.15s ease',
            }}
            className="mobile-menu-btn"
            aria-label="Toggle menu"
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--surface-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div
            style={{
              borderTop: '1px solid var(--border)',
              padding: '12px 20px 16px',
              background: 'var(--surface)',
              animation: 'fadeIn 0.15s ease-out',
            }}
            className="mobile-menu"
          >
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    display: 'block',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 14,
                    fontWeight: 600,
                    color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                    textDecoration: 'none',
                    background: active ? 'var(--surface-active)' : 'transparent',
                    marginBottom: 4,
                  }}
                >
                  {t(item.key)}
                </Link>
              );
            })}
            <div style={{ borderTop: '1px solid var(--border)', marginTop: 8, paddingTop: 12 }}>
              <p style={{ color: 'var(--text-tertiary)', fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8, paddingLeft: 16 }}>
                Language
              </p>
              {LANGUAGES.map((lang) => (
                <button
                  key={lang}
                  onClick={() => {
                    setLanguage(lang);
                    setMobileMenuOpen(false);
                  }}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '10px 16px',
                    fontSize: 13,
                    fontWeight: language === lang ? 700 : 500,
                    color: language === lang ? 'var(--text-primary)' : 'var(--text-secondary)',
                    background: language === lang ? 'var(--blue-soft)' : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Main */}
      <main
        style={{
          flex: 1,
          maxWidth: 1280,
          margin: '0 auto',
          padding: '24px 20px 40px',
          width: '100%',
        }}
      >
        {children}
      </main>

      {/* Footer */}
      <footer
        style={{
          borderTop: '1px solid var(--border)',
          padding: '20px 20px',
          textAlign: 'center',
          background: 'var(--surface)',
        }}
      >
        <p style={{ color: 'var(--text-faint)', fontSize: 12, fontWeight: 500 }}>
          RoadSoS v1.0 &middot; Emergency Response System &middot; &copy; {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}

export default function LocaleLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const langMap: Record<string, Language> = {
    en: 'English',
    hi: 'Hindi',
    ta: 'Tamil',
    te: 'Telugu',
    kn: 'Kannada',
    ml: 'Malayalam',
    mr: 'Marathi',
  };
  const initialLang = langMap[locale] || 'English';

  return (
    <LanguageProvider initialLang={initialLang}>
      <LocaleContent>{children}</LocaleContent>
    </LanguageProvider>
  );
}
