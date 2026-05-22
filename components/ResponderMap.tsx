'use client';

import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { Responder } from '@/lib/types';

// Fix default marker icon paths (CDN fallback)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom responder icon
const responderIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="25" height="41">' +
    '<path fill="#5E5CE6" d="M12.5 0C5.6 0 0 5.6 0 12.5C0 20.4 12.5 41 12.5 41S25 20.4 25 12.5C25 5.6 19.4 0 12.5 0z"/>' +
    '<circle fill="#fff" cx="12.5" cy="12.5" r="6"/>' +
    '</svg>'
  ),
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

/**
 * ResizeMap — ensures Leaflet recalculates dimensions after mount,
 * container resize, and window resize events.
 */
function ResizeMap() {
  const map = useMap();

  useEffect(() => {
    // Staggered invalidateSize calls to handle delayed layout/hydration
    const t1 = setTimeout(() => map.invalidateSize(true), 100);
    const t2 = setTimeout(() => map.invalidateSize(true), 300);
    const t3 = setTimeout(() => map.invalidateSize(true), 600);

    // Observe container dimension changes (sidebar toggle, tab switch, etc.)
    const container = map.getContainer();
    const ro = new ResizeObserver(() => map.invalidateSize(true));
    ro.observe(container);

    // Window resize
    const onResize = () => map.invalidateSize(true);
    window.addEventListener('resize', onResize);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      ro.disconnect();
      window.removeEventListener('resize', onResize);
    };
  }, [map]);

  return null;
}

/**
 * MapMarkers — renders responder markers with popups.
 */
function MapMarkers({ responders }: { responders: Responder[] }) {
  return (
    <>
      {responders.map((r) => (
        <Marker key={r.id} position={[r.lat, r.lng]} icon={responderIcon}>
          <Popup>
            <div style={{ minWidth: 120 }}>
              <strong style={{ fontSize: 14, fontWeight: 700, color: '#F2F2F7' }}>{r.name}</strong>
              <p style={{ fontSize: 12, color: '#8E8E93', marginTop: 4, textTransform: 'capitalize' }}>
                {r.type} responder
              </p>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
}

/**
 * MapContent — inner map children that have access to the map instance.
 */
function MapContent({ responders, center }: { responders: Responder[]; center?: [number, number] }) {
  const map = useMap();

  // Center the map when a specific incident location is provided
  useEffect(() => {
    if (center) {
      map.setView(center, 13, { animate: false });
    }
  }, [map, center]);

  return (
    <>
      <ResizeMap />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
        crossOrigin="anonymous"
        updateWhenIdle={false}
        updateWhenZooming={false}
        keepBuffer={4}
      />
      <MapMarkers responders={responders} />
    </>
  );
}

/**
 * ResponderMap — production-grade Leaflet map component.
 *
 * Key design decisions:
 * - Wrapper uses explicit height; MapContainer fills it with absolute positioning
 * - No CSS transforms on wrapper or parents (prevents GPU compositing bugs)
 * - isolate creates a new stacking context, preventing z-index bleed
 * - preferCanvas=false uses DOM markers (needed for custom icon popups)
 * - fadeAnimation=false prevents tile flicker during zoom
 */
export default function ResponderMap({ responders, center }: { responders: Responder[]; center?: [number, number] }) {
  const [mounted, setMounted] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // External ResizeObserver on wrapper for layout changes before map mounts
  useEffect(() => {
    if (!mounted || !wrapperRef.current) return;
    const el = wrapperRef.current;
    const ro = new ResizeObserver(() => {
      const leafletEl = el.querySelector('.leaflet-container') as any;
      leafletEl?._leaflet_map?.invalidateSize(true);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [mounted]);

  // SSR guard
  if (!mounted) {
    return (
      <div
        ref={wrapperRef}
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          minHeight: 400,
          minWidth: 0,
          overflow: 'hidden',
          background: '#0b1220',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#71717A' }}>
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                width: 32,
                height: 32,
                border: '3px solid rgba(255,255,255,0.06)',
                borderTopColor: '#0A84FF',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
                margin: '0 auto 12px',
              }}
            />
            <p style={{ fontSize: 13, fontWeight: 500 }}>Loading map...</p>
          </div>
        </div>
      </div>
    );
  }

  const defaultCenter: [number, number] = center || [20.5937, 78.9629];
  const defaultZoom = center ? 13 : 5;

  return (
    <div
      ref={wrapperRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: 400,
        minWidth: 0,
        overflow: 'hidden',
        isolation: 'isolate',
      }}
    >
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
        zoomSnap={1}
        zoomDelta={1}
        wheelPxPerZoomLevel={120}
        dragging={true}
        scrollWheelZoom={true}
        doubleClickZoom={true}
        boxZoom={false}
        keyboard={true}
        touchZoom={true}
        zoomAnimation={true}
        fadeAnimation={false}
        markerZoomAnimation={false}
        preferCanvas={false}
        zoomControl={true}
        attributionControl={true}
      >
        <MapContent responders={responders} center={center} />
      </MapContainer>
    </div>
  );
}
