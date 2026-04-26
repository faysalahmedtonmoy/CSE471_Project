'use client';

/**
 * EmergencyMap — Leaflet + OpenStreetMap + Overpass API
 *
 * External APIs used:
 *  1. OpenStreetMap tile server  → https://tile.openstreetmap.org/{z}/{x}/{y}.png  (free, no key)
 *  2. Overpass API               → https://overpass-api.de/api/interpreter         (free, no key)
 *     Used to search for nearby hospitals/clinics within a 3 km radius
 *
 * Must be imported with:  dynamic(() => import('./EmergencyMap'), { ssr: false })
 */

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// ── Fix Leaflet default marker icon paths broken by Webpack/Next.js ──────────
// @ts-expect-error – internal leaflet prop
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// ── Custom coloured icons ────────────────────────────────────────────────────
const blueIcon = new L.Icon({
  iconUrl:       'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize:      [25, 41],
  iconAnchor:    [12, 41],
  popupAnchor:   [1, -34],
  shadowSize:    [41, 41],
});

const redIcon = new L.Icon({
  iconUrl:       'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize:      [25, 41],
  iconAnchor:    [12, 41],
  popupAnchor:   [1, -34],
  shadowSize:    [41, 41],
});

// ── Types ────────────────────────────────────────────────────────────────────
interface EmergencyMapProps {
  onPinLocation?: (lat: number, lng: number, name: string) => void;
}

interface OverpassElement {
  lat: number;
  lon: number;
  tags?: Record<string, string>;
}

// ── Component ────────────────────────────────────────────────────────────────
export default function EmergencyMap({ onPinLocation }: EmergencyMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef          = useRef<L.Map | null>(null);
  const userMarkerRef   = useRef<L.Marker | null>(null);
  const hospitalLayer   = useRef<L.LayerGroup | null>(null);

  const [userCoords, setUserCoords]     = useState<[number, number] | null>(null);
  const [status, setStatus]             = useState('📡 Locating you…');
  const [isSearching, setIsSearching]   = useState(false);
  const [resultCount, setResultCount]   = useState<number | null>(null);
  const [radius, setRadius]             = useState<number>(3000); // Default 3km

  // ── 1. Init Leaflet map ───────────────────────────────────────────────────
  useEffect(() => {
    if (mapRef.current || !mapContainerRef.current) return;

    // Default centre: Dhaka, Bangladesh
    const map = L.map(mapContainerRef.current, {
      center: [23.8103, 90.4125],
      zoom: 13,
      zoomControl: true,
    });

    // External API #1 — OpenStreetMap tile layer (free, no key required)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution:
        '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    hospitalLayer.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    // ── 2. Geolocation (browser API) ──────────────────────────────────────
    if (!navigator.geolocation) {
      setStatus('⚠️ Geolocation not supported. Showing Dhaka default.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        // Guard: if the component unmounted while waiting for GPS, map is gone
        if (!mapRef.current) return;

        const { latitude: lat, longitude: lng } = coords;
        setUserCoords([lat, lng]);
        setStatus('📍 Location found! Click "Search" to find nearby hospitals.');

        // Use mapRef.current — never the stale local `map` closure variable
        mapRef.current.setView([lat, lng], 15);

        userMarkerRef.current = L.marker([lat, lng], { icon: blueIcon })
          .addTo(mapRef.current)
          .bindPopup('<b>📍 You are here</b>')
          .openPopup();
      },
      (err) => {
        setStatus(`⚠️ Location error: ${err.message}. Map centred on Dhaka.`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // ── 3. Search nearby hospitals via Overpass API ───────────────────────────
  const searchNearbyHospitals = async () => {
    if (!mapRef.current) return;

    // Use current map centre as fallback if geolocation wasn't granted
    const mapCenter = mapRef.current.getCenter();
    const [lat, lng] = userCoords ?? [mapCenter.lat, mapCenter.lng];

    setIsSearching(true);
    setStatus(`🔍 Searching Overpass API for nearby hospitals within ${radius / 1000} km…`);
    hospitalLayer.current?.clearLayers();

    // External API #2 — Overpass API (OpenStreetMap query engine, free, no key)
    const query = `
[out:json][timeout:25];
(
  node["amenity"="hospital"](around:${radius},${lat},${lng});
  node["amenity"="clinic"](around:${radius},${lat},${lng});
  node["amenity"="doctors"](around:${radius},${lat},${lng});
);
out body;
    `.trim();

    try {
      const res = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: query,
      });

      if (!res.ok) throw new Error(`Overpass error ${res.status}`);

      const data = await res.json();
      const elements: OverpassElement[] = data.elements ?? [];

      elements.forEach((el) => {
        const name     = el.tags?.name     ?? 'Unnamed Facility';
        const amenity  = el.tags?.amenity  ?? 'hospital';
        const phone    = el.tags?.phone    ?? el.tags?.['contact:phone'] ?? '';
        const address  = el.tags?.['addr:full'] ?? el.tags?.['addr:street'] ?? '';
        const emoji    = amenity === 'hospital' ? '🏥' : amenity === 'clinic' ? '🏨' : '🩺';

        const marker = L.marker([el.lat, el.lon], { icon: redIcon });

        const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(name + ' hospital ' + (address || 'Dhaka'))}`;

        marker.bindPopup(`
          <div style="min-width:180px;font-family:sans-serif;font-size:13px;display:flex;flex-direction:column;gap:6px;">
            <div>
              <p style="font-weight:700;margin:0 0 2px;font-size:14px;">${emoji} ${name}</p>
              <p style="color:#666;margin:0 0 2px;text-transform:capitalize;font-size:12px;">${amenity}</p>
              ${address ? `<p style="margin:0 0 2px;font-size:12px;">📍 ${address}</p>` : ''}
              ${phone   ? `<p style="margin:0;font-weight:600;color:#16a34a;">📞 ${phone}</p>` : ''}
            </div>

            <div style="display:flex;gap:4px;margin-top:4px;">
              ${phone 
                ? `<a href="tel:${phone}" style="flex:1;text-align:center;background:#16a34a;color:#fff;text-decoration:none;padding:6px 0;border-radius:4px;font-weight:bold;font-size:12px;">📞 Call</a>`
                : `<a href="${googleSearchUrl}" target="_blank" rel="noopener noreferrer" style="flex:1;text-align:center;background:#4b5563;color:#fff;text-decoration:none;padding:6px 0;border-radius:4px;font-weight:bold;font-size:12px;">🔍 Google It</a>`
              }
              <button
                onclick="(function(){
                  var e=new CustomEvent('pin-location',{detail:{lat:${el.lat},lng:${el.lon},name:'${name.replace(/'/g, "\\'")}'}});
                  document.dispatchEvent(e);
                })()"
                style="flex:1;background:#1d4ed8;color:#fff;border:none;border-radius:4px;cursor:pointer;font-weight:bold;font-size:12px;padding:6px 0;"
              >📌 Pin</button>
            </div>
          </div>
        `);

        hospitalLayer.current?.addLayer(marker);

        // Fit map bounds to show all results
        if (elements.length > 0) {
          const bounds = L.latLngBounds(
            elements.map((el) => [el.lat, el.lon] as [number, number])
          );
          // Extend bounds to include user location if known
          if (userCoords) bounds.extend(userCoords);
          mapRef.current?.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
        }
      });

      // Listen for pin events from popup buttons
      const handler = (e: Event) => {
        const { lat, lng, name } = (e as CustomEvent).detail;
        onPinLocation?.(lat, lng, name);
      };
      document.addEventListener('pin-location', handler, { once: true });

      setResultCount(elements.length);
      setStatus(
        elements.length > 0
          ? `✅ Found ${elements.length} hospital(s) / clinic(s) within ${radius / 1000} km.`
          : `⚠️ No hospitals found within ${radius / 1000} km radius.`
      );
    } catch (err) {
      console.error('[EmergencyMap] Overpass error:', err);
      setStatus('❌ Failed to reach Overpass API. Check your internet connection.');
    } finally {
      setIsSearching(false);
    }
  };

  // ── 4. Clear markers ─────────────────────────────────────────────────────
  const clearMarkers = () => {
    hospitalLayer.current?.clearLayers();
    setResultCount(null);
    setStatus('📍 Markers cleared. Ready to search again.');
  };

  // ── 5. Render ─────────────────────────────────────────────────────────────
  return (
    <div className="w-full flex flex-col gap-3">
      {/* API attribution badge */}
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
          🗺 OpenStreetMap
        </span>
        <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
          🔍 Overpass API
        </span>
        <span className="text-gray-400">— Free, no API key required</span>
      </div>

      {/* Status */}
      <p className="text-sm text-gray-600">{status}</p>

      {/* Map container */}
      <div
        ref={mapContainerRef}
        className="w-full rounded-xl overflow-hidden shadow-lg border border-gray-200"
        style={{ height: '480px', minHeight: '320px' }}
      />

      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-center">
        <button
          onClick={searchNearbyHospitals}
          disabled={isSearching}
          className="
            flex items-center gap-2 px-5 py-2.5 rounded-lg
            font-semibold text-sm text-white
            bg-red-600 hover:bg-red-700
            active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
            shadow transition-all duration-150
          "
        >
          {isSearching ? (
            <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : '🏥'}
          {isSearching ? 'Searching…' : 'Search Nearby'}
        </button>

        {/* Radius Slider */}
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm">
          <label htmlFor="radius-slider" className="text-sm font-medium text-gray-700 whitespace-nowrap">
            Radius: {radius / 1000} km
          </label>
          <input
            id="radius-slider"
            type="range"
            min="1000"
            max="10000"
            step="1000"
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
            className="w-32 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-red-600"
          />
        </div>

        {resultCount !== null && resultCount > 0 && (
          <button
            onClick={clearMarkers}
            className="
              px-4 py-2.5 rounded-lg font-semibold text-sm
              text-gray-700 bg-gray-100 hover:bg-gray-200
              border border-gray-300 active:scale-95 transition-all duration-150
            "
          >
            Clear Markers
          </button>
        )}
      </div>
    </div>
  );
}
