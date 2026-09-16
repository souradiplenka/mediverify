'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  MapPin, Phone, Navigation, ShieldAlert, AlertTriangle, Compass,
  Search, Filter, ExternalLink, Clock, Star, Activity, Plus, Check, Loader2, HeartPulse
} from 'lucide-react';
import { Hospital, HOSPITALS_DATABASE, calculateDistanceKm } from '@/lib/hospitalData';

export default function HospitalsPage() {
  const [hospitals, setHospitals] = useState<Hospital[]>(HOSPITALS_DATABASE);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [selectedHospital, setSelectedHospital] = useState<Hospital>(HOSPITALS_DATABASE[0]);
  const [searchQuery, setSearchQuery] = useState('');

  // Auto-detect location on mount or when user clicks "Find Near Me"
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }

    setLocationLoading(true);
    setLocationError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        setUserLocation({ lat: userLat, lng: userLng });

        // Recalculate distance and sort by proximity
        const sorted = [...HOSPITALS_DATABASE].sort((a, b) => {
          const distA = calculateDistanceKm(userLat, userLng, a.lat, a.lng);
          const distB = calculateDistanceKm(userLat, userLng, b.lat, b.lng);
          return distA - distB;
        });

        setHospitals(sorted);
        setSelectedHospital(sorted[0]);
        setLocationLoading(false);
      },
      (err) => {
        setLocationError('Could not fetch location. Showing default medical centers.');
        setLocationLoading(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  useEffect(() => {
    // Attempt silent geolocation detect on mount
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const userLat = pos.coords.latitude;
          const userLng = pos.coords.longitude;
          setUserLocation({ lat: userLat, lng: userLng });
          const sorted = [...HOSPITALS_DATABASE].sort((a, b) => {
            const distA = calculateDistanceKm(userLat, userLng, a.lat, a.lng);
            const distB = calculateDistanceKm(userLat, userLng, b.lat, b.lng);
            return distA - distB;
          });
          setHospitals(sorted);
          setSelectedHospital(sorted[0]);
        },
        () => { /* silent fallback */ }
      );
    }
  }, []);

  // Filter hospitals
  const filteredHospitals = hospitals.filter(h => {
    const matchesCategory = selectedCategory === 'all' || h.category === selectedCategory;
    const matchesQuery = !searchQuery.trim() || 
      h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.city.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  return (
    <div className="min-h-screen bg-slate-50/70 pb-20">
      
      {/* ── Top Header ── */}
      <section className="bg-emerald-950 text-white pt-10 pb-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 bg-emerald-900/80 border border-emerald-700/60 px-3 py-1 rounded-full text-xs font-semibold text-emerald-300 mb-3">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" /> Nearby Medical Finder & Emergency Map
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight" style={{ fontFamily: 'Playfair Display, serif' }}>
                Nearby Hospitals & Emergency Map
              </h1>
              <p className="text-emerald-200/80 text-sm mt-2 max-w-xl leading-relaxed">
                Locate 24/7 emergency ICUs, government trauma centers, pharmacies, and blood banks near your current location.
              </p>
            </div>

            {/* GPS Trigger Button */}
            <div className="flex flex-wrap gap-2 shrink-0">
              <button
                onClick={handleDetectLocation}
                disabled={locationLoading}
                className="bg-emerald-500 hover:bg-emerald-400 text-white font-semibold text-sm px-5 py-3 rounded-full transition-all shadow-lg flex items-center gap-2"
              >
                {locationLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Detecting GPS…</>
                ) : (
                  <><Compass className="w-4 h-4" /> Use My Current Location</>
                )}
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* ── Main Locator Body ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20 space-y-6">
        
        {/* ── EMERGENCY HOTLINE BANNER (INDIA 108 / 112) ── */}
        <div className="bg-red-600 text-white rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
              <ShieldAlert className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight" style={{ fontFamily: 'Playfair Display, serif' }}>
                🚨 Medical Emergency Hotline
              </h3>
              <p className="text-xs text-red-100 mt-0.5">
                For immediate life-threatening medical emergencies in India, dial ambulance directly.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <a
              href="tel:108"
              className="flex-1 sm:flex-none text-center bg-white text-red-700 hover:bg-red-50 font-extrabold text-sm px-5 py-2.5 rounded-full shadow transition-all flex items-center justify-center gap-2"
            >
              <Phone className="w-4 h-4" /> Dial 108 (Ambulance)
            </a>
            <a
              href="tel:112"
              className="flex-1 sm:flex-none text-center bg-red-800 hover:bg-red-900 text-white font-bold text-sm px-4 py-2.5 rounded-full border border-red-400/40 transition-all flex items-center justify-center gap-2"
            >
              Dial 112 (National Emergency)
            </a>
          </div>
        </div>

        {/* ── SEARCH & CATEGORY FILTERS ── */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search hospital name, area, or city…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="input-field pl-10 py-2.5 text-xs"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
              {[
                { id: 'all', label: 'All Centers' },
                { id: 'emergency', label: '🚨 24/7 Emergency ICU' },
                { id: 'general', label: '🏥 Multi-Specialty' },
                { id: 'pharmacy', label: '💊 24/7 Pharmacy' },
                { id: 'bloodbank', label: '🩸 Blood Bank' },
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3.5 py-2 rounded-full text-xs font-semibold transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-emerald-700 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

          </div>

          {locationError && (
            <p className="text-xs text-amber-600 mt-3 font-medium flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" /> {locationError}
            </p>
          )}
        </div>

        {/* ── MAP CANVAS & HOSPITAL LIST GRID ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Hospital List */}
          <div className="lg:col-span-6 space-y-4">
            <div className="flex items-center justify-between text-xs text-gray-500 font-semibold">
              <span>Showing {filteredHospitals.length} Medical Centers</span>
              {userLocation && <span className="text-emerald-700 font-bold">📍 Distances calculated from GPS</span>}
            </div>

            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
              {filteredHospitals.map(hosp => {
                const distanceKm = userLocation ? calculateDistanceKm(userLocation.lat, userLocation.lng, hosp.lat, hosp.lng) : null;
                const isSelected = selectedHospital.id === hosp.id;

                return (
                  <div
                    key={hosp.id}
                    onClick={() => setSelectedHospital(hosp)}
                    className={`bg-white rounded-3xl border p-5 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
                        : 'border-gray-200/80 hover:border-emerald-300 shadow-sm'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                            hosp.category === 'emergency' ? 'bg-red-100 text-red-700' :
                            hosp.category === 'pharmacy' ? 'bg-blue-100 text-blue-700' :
                            hosp.category === 'bloodbank' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {hosp.category}
                          </span>
                          {hosp.is24x7 && (
                            <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full">
                              24/7 Open
                            </span>
                          )}
                        </div>

                        <h3 className="font-bold text-gray-900 text-base" style={{ fontFamily: 'Playfair Display, serif' }}>
                          {hosp.name}
                        </h3>
                      </div>

                      {distanceKm !== null && (
                        <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full text-xs font-bold shrink-0">
                          {distanceKm} km away
                        </div>
                      )}
                    </div>

                    <p className="text-xs text-gray-500 flex items-center gap-1.5 mb-3">
                      <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="truncate">{hosp.address}</span>
                    </p>

                    <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs">
                      <a
                        href={`tel:${hosp.phone}`}
                        onClick={e => e.stopPropagation()}
                        className="text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1.5"
                      >
                        <Phone className="w-3.5 h-3.5" /> Call {hosp.phone}
                      </a>

                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${hosp.lat},${hosp.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold px-3 py-1.5 rounded-full transition-colors flex items-center gap-1"
                      >
                        <Navigation className="w-3.5 h-3.5" /> Directions
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Interactive OpenStreetMap Embed Canvas */}
          <div className="lg:col-span-6 bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sticky top-20">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-gray-900 text-lg" style={{ fontFamily: 'Playfair Display, serif' }}>
                  Interactive Map View
                </h3>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
                {selectedHospital.name.split(' ')[0]} Selected
              </span>
            </div>

            {/* Embedded OpenStreetMap Canvas */}
            <div className="w-full h-[400px] rounded-2xl overflow-hidden border border-gray-200 shadow-inner relative">
              <iframe
                title="Hospital Map View"
                width="100%"
                height="100%"
                frameBorder="0"
                scrolling="no"
                marginHeight={0}
                marginWidth={0}
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${selectedHospital.lng - 0.03}%2C${selectedHospital.lat - 0.03}%2C${selectedHospital.lng + 0.03}%2C${selectedHospital.lat + 0.03}&layer=mapnik&marker=${selectedHospital.lat}%2C${selectedHospital.lng}`}
              />
            </div>

            {/* Selected Hospital Action Footer */}
            <div className="mt-4 p-4 bg-emerald-50/60 border border-emerald-100 rounded-2xl">
              <h4 className="font-bold text-gray-900 text-sm mb-1">{selectedHospital.name}</h4>
              <p className="text-xs text-gray-600 mb-3">{selectedHospital.address}</p>

              <div className="flex items-center gap-2">
                <a
                  href={`tel:${selectedHospital.phone}`}
                  className="flex-1 btn-primary py-2 text-xs justify-center"
                >
                  <Phone className="w-3.5 h-3.5" /> Call Hospital
                </a>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${selectedHospital.lat},${selectedHospital.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 btn-secondary py-2 text-xs justify-center"
                >
                  <Navigation className="w-3.5 h-3.5" /> Google Maps Directions
                </a>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
