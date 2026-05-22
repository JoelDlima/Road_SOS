'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageProvider';
import { createClient } from '@/lib/supabase/client';
import type { NearbyService, ServiceType } from '@/lib/types';
import {
  Plus,
  X,
  Edit2,
  Trash2,
  Hospital,
  Phone,
  MapPin,
  Clock,
  AlertTriangle,
  Loader2,
  Building2,
  Car,
  Wrench,
  Shield,
  Stethoscope,
} from 'lucide-react';

const SERVICE_TYPES: ServiceType[] = [
  'hospital',
  'trauma_centre',
  'ambulance',
  'police',
  'towing',
  'puncture',
  'showroom',
];

const SERVICE_ICONS: Record<ServiceType, React.ElementType> = {
  hospital: Building2,
  trauma_centre: Stethoscope,
  ambulance: Car,
  police: Shield,
  towing: Wrench,
  puncture: Wrench,
  showroom: Building2,
};

const SERVICE_COLORS: Record<ServiceType, string> = {
  hospital: '#0A84FF',
  trauma_centre: '#FF3B3B',
  ambulance: '#FF9F0A',
  police: '#5E5CE6',
  towing: '#8E8E93',
  puncture: '#8E8E93',
  showroom: '#30D158',
};

export default function ServicesPage() {
  const { t } = useLanguage();
  const [services, setServices] = useState<NearbyService[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    service_type: 'hospital' as ServiceType,
    primary_phone: '',
    address: '',
    lat: '',
    lng: '',
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const loadServices = useCallback(() => {
    const supabase = createClient();
    setLoading(true);
    supabase
      .from('services')
      .select('*')
      .limit(50)
      .then(({ data, error }) => {
        if (error) {
          console.error('Failed to load services:', error);
        } else if (data) {
          setServices(
            data.map((s: any) => ({
              id: s.id,
              name: s.name,
              service_type: s.service_type,
              address: s.address || '',
              primary_phone: s.primary_phone || '',
              is_24x7: s.is_24x7 || false,
              tags: s.tags || {},
              distance_km: 0,
              lat: s.location?.coordinates?.[1] || 0,
              lng: s.location?.coordinates?.[0] || 0,
            }))
          );
        }
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.primary_phone.trim()) {
      setFormError('Name and phone number are required.');
      return;
    }
    setFormError('');
    setSaving(true);
    const supabase = createClient();
    const payload = {
      name: form.name.trim(),
      service_type: form.service_type,
      primary_phone: form.primary_phone.trim(),
      address: form.address.trim(),
      location: `POINT(${form.lng || 0} ${form.lat || 0})`,
    };

    try {
      if (editingId) {
        const { error } = await supabase.from('services').update(payload).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('services').insert(payload);
        if (error) throw error;
      }
      setSaving(false);
      setShowForm(false);
      setEditingId(null);
      setForm({ name: '', service_type: 'hospital', primary_phone: '', address: '', lat: '', lng: '' });
      loadServices();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Save failed');
      setSaving(false);
    }
  }

  function startEdit(svc: NearbyService) {
    setForm({
      name: svc.name,
      service_type: svc.service_type,
      primary_phone: svc.primary_phone,
      address: svc.address,
      lat: String(svc.lat),
      lng: String(svc.lng),
    });
    setEditingId(svc.id);
    setShowForm(true);
  }

  async function handleDelete(id: string) {
    const supabase = createClient();
    try {
      const { error } = await supabase.from('services').delete().eq('id', id);
      if (error) throw error;
      loadServices();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  }

  const ServiceIcon = SERVICE_ICONS[form.service_type] || Building2;
  const serviceColor = SERVICE_COLORS[form.service_type] || '#0A84FF';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
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
            {t('admin.services')}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>
            {services.length} services registered
          </p>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingId(null);
            setForm({ name: '', service_type: 'hospital', primary_phone: '', address: '', lat: '', lng: '' });
          }}
          style={{
            padding: '10px 20px',
            background: 'linear-gradient(135deg, #FF3B3B, #E53535)',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            color: '#fff',
            fontWeight: 700,
            fontSize: 14,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
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
          <Plus size={16} />
          {t('admin.addService')}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div
          style={{
            background: 'var(--surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border)',
            overflow: 'hidden',
            animation: 'fadeIn 0.2s ease-out',
          }}
        >
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <h2 style={{ color: 'var(--text-primary)', fontSize: 16, fontWeight: 700 }}>
              {editingId ? 'Edit Service' : 'Add New Service'}
            </h2>
            <button
              onClick={() => setShowForm(false)}
              style={{
                padding: 6,
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-tertiary)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--surface-hover)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'var(--text-tertiary)';
              }}
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSave} style={{ padding: 20 }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 14,
                marginBottom: 20,
              }}
            >
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
                  {t('admin.name')}
                </label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder={t('admin.name')}
                  style={{
                    width: '100%',
                    padding: '0 14px',
                    height: 44,
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

              {/* Type */}
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
                  Type
                </label>
                <select
                  value={form.service_type}
                  onChange={(e) =>
                    setForm({ ...form, service_type: e.target.value as ServiceType })
                  }
                  style={{
                    width: '100%',
                    padding: '0 14px',
                    height: 44,
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)',
                    fontSize: 14,
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                >
                  {SERVICE_TYPES.map((st) => (
                    <option key={st} value={st}>
                      {st.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>

              {/* Phone */}
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
                  {t('admin.phone')}
                </label>
                <input
                  value={form.primary_phone}
                  onChange={(e) => setForm({ ...form, primary_phone: e.target.value })}
                  placeholder={t('admin.phone')}
                  style={{
                    width: '100%',
                    padding: '0 14px',
                    height: 44,
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

              {/* Address */}
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
                  {t('admin.address')}
                </label>
                <input
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder={t('admin.address')}
                  style={{
                    width: '100%',
                    padding: '0 14px',
                    height: 44,
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

              {/* Lat */}
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
                  Latitude
                </label>
                <input
                  value={form.lat}
                  onChange={(e) => setForm({ ...form, lat: e.target.value })}
                  placeholder="15.2993"
                  style={{
                    width: '100%',
                    padding: '0 14px',
                    height: 44,
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

              {/* Lng */}
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
                  Longitude
                </label>
                <input
                  value={form.lng}
                  onChange={(e) => setForm({ ...form, lng: e.target.value })}
                  placeholder="74.1240"
                  style={{
                    width: '100%',
                    padding: '0 14px',
                    height: 44,
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

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                style={{
                  padding: '10px 20px',
                  background: 'var(--surface-hover)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-secondary)',
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--surface-active)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--surface-hover)';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}
              >
                {t('admin.cancel')}
              </button>
              <button
                type="submit"
                disabled={saving}
                style={{
                  padding: '10px 24px',
                  background: saving ? '#991b1b' : 'linear-gradient(135deg, #FF3B3B, #E53535)',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.15s ease',
                }}
              >
                {saving ? (
                  <>
                    <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                    Saving...
                  </>
                ) : editingId ? (
                  t('admin.save')
                ) : (
                  t('admin.addService')
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Services List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-tertiary)' }}>
          <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
          <p style={{ fontSize: 14 }}>{t('common.loading')}</p>
        </div>
      ) : services.length === 0 ? (
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
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'var(--blue-soft)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <Hospital size={24} color="#0A84FF" />
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15, fontWeight: 500 }}>
            No services registered yet
          </p>
          <p style={{ color: 'var(--text-tertiary)', fontSize: 13, marginTop: 4 }}>
            Add your first emergency service to get started
          </p>
        </div>
      ) : (
        <div
          style={{
            background: 'var(--surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border)',
            overflow: 'hidden',
          }}
        >
          {services.map((svc, idx) => {
            const SvcIcon = SERVICE_ICONS[svc.service_type] || Hospital;
            const svcColor = SERVICE_COLORS[svc.service_type] || '#0A84FF';
            return (
              <div
                key={svc.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '16px 20px',
                  borderBottom: idx < services.length - 1 ? '1px solid var(--border)' : 'none',
                  gap: 14,
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--surface-hover)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                {/* Icon */}
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 'var(--radius-md)',
                    background: `${svcColor}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <SvcIcon size={18} color={svcColor} />
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 14 }}>
                    {svc.name}
                  </p>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      marginTop: 4,
                      flexWrap: 'wrap',
                    }}
                  >
                    <span
                      style={{
                        color: 'var(--text-tertiary)',
                        fontSize: 12,
                        textTransform: 'capitalize',
                        fontWeight: 500,
                      }}
                    >
                      {svc.service_type.replace('_', ' ')}
                    </span>
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        color: 'var(--text-tertiary)',
                        fontSize: 12,
                      }}
                    >
                      <Phone size={12} />
                      {svc.primary_phone}
                    </span>
                    {svc.address && (
                      <span
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          color: 'var(--text-tertiary)',
                          fontSize: 12,
                        }}
                      >
                        <MapPin size={12} />
                        {svc.address}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <button
                    onClick={() => startEdit(svc)}
                    style={{
                      padding: '8px 14px',
                      background: 'var(--blue-soft)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--blue-border)',
                      color: '#0A84FF',
                      fontWeight: 600,
                      fontSize: 12,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--blue)';
                      e.currentTarget.style.color = '#fff';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'var(--blue-soft)';
                      e.currentTarget.style.color = '#0A84FF';
                    }}
                  >
                    <Edit2 size={12} />
                    {t('admin.editService')}
                  </button>
                  <button
                    onClick={() => handleDelete(svc.id)}
                    style={{
                      padding: '8px 14px',
                      background: 'transparent',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-tertiary)',
                      fontWeight: 600,
                      fontSize: 12,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--red-border)';
                      e.currentTarget.style.background = 'var(--red-soft)';
                      e.currentTarget.style.color = '#FF3B3B';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border)';
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'var(--text-tertiary)';
                    }}
                  >
                    <Trash2 size={12} />
                    {t('admin.deleteService')}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
