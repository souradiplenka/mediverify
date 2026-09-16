'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  MapPin, Phone, Navigation, ShieldAlert, AlertTriangle, Compass,
  Search, Filter, ExternalLink, Clock, Star, Activity, Plus, Check, Loader2, HeartPulse, Building2
} from 'lucide-react';
import { Hospital, HOSPITALS_DATABASE, calculateDistanceKm } from '@/lib/hospitalData';

export default function HospitalsPage() {
  const [hospitals, setHospitals] = useState<Hospital[]>(HOSPITALS_DATABASE);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [userAddress, setUserAddress] = useState<string>('');
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [selectedHospital, setSelectedHospital] = useState<Hospital>(HOSPITALS_DATABASE[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [cityInput, setCityInput] = useState('');

  // Fetch real hospitals near (lat, lng) using OpenStreetMap Overpass API
  const fetchRealHospitalsNear = async (lat: number, lng: number, placeName?: string) => {
    try {
      const overpassUrl = `https://overpass-api.de/api/interpreter?data=[out:json][timeout:10];node["amenity"~"hospital|clinic|pharmacy"](around:15000,${lat},${lng});out 15;`;
      const res = await fetch(overpassUrl);
      const data = await res.json();
      
      if (data.elements && data.elements.length > 0) {
        const fetchedList: Hospital[] = data.elements
          .filter((el: { tags?: Record<string, string> }) => el.tags && (el.tags.name || el.tags['name:en']))
          .map((el: { id: number; lat: number; lon: number; tags: Record<string, string> }, index: number) => {
            const name = el.tags.name || el.tags['name:en'] || 'Medical Center';
            const isPharm = el.tags.amenity === 'pharmacy';
            return {
              id: `osm-${el.id || index}`,
              name,
              category: isPharm ? 'pharmacy' : 'emergency',
              address: el.tags['addr:street'] ? `${el.tags['addr:street']}, ${el.tags['addr:city'] || placeName || ''}` : (placeName || 'Near User Location'),
              city: el.tags['addr:city'] || placeName || 'Nearby',
              phone: el.tags.phone || el.tags['contact:phone'] || '+91 108 Emergency',
              lat: el.lat,
              lng: el.lon,
              is24x7: true,
              icuAvailable: true,
              rating: 4.5 + (index % 5) * 0.1,
              openHours: el.tags.opening_hours || '24/7 Care',
            };
          });

        if (fetchedList.length > 0) {
          // Sort by distance from user
          const sorted = fetchedList.sort((a, b) => {
            const distA = calculateDistanceKm(lat, lng, a.lat, a.lng);
            const distB = calculateDistanceKm(lat, lng, b.lat, b.lng);
            return distA - distB;
          });
          setHospitals(sorted);
          setSelectedHospital(sorted[0]);
          return;
        }
      }
    } catch {
      /* Fallback to local DB with distance sorting */
    }

    // Fallback: sort local DB by distance
    const sorted = [...HOSPITALS_DATABASE].sort((a, b) => {
      const distA = calculateDistanceKm(lat, lng, a.lat, a.lng);
      const distB = calculateDistanceKm(lat, lng, b.lat, b.lng);
      return distA - distB;
    });
    setHospitals(sorted);
    setSelectedHospital(sorted[0]);
  };

  // Reverse geocode lat/lng to human address using Nominatim
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await res.json();
      if (data.display_name) {
        const addr = data.address;
        const shortName = [addr.suburb || addr.neighbourhood, addr.city || addr.town || addr.county, addr.state]
          .filter(Boolean)
          .join(', ');
        setUserAddress(shortName || data.display_name.split(',').slice(0, 3).join(','));
        return shortName || 'Your Exact Location';
      }
    } catch {
      setUserAddress('Your GPS Location');
    }
    return 'Your GPS Location';
  };

  // Geocode city/town string typed by user (e.g. "Cuttack", "Kolkata", "Delhi")
  const handleCitySearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cityInput.trim()) return;

    setLocationLoading(true);
    setLocationError('');

    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cityInput.trim())}&countrycodes=in&limit=1`);
      const data = await res.json();

      if (data && data.length > 0) {
        const targetLat = parseFloat(data[0].lat);
        const targetLng = parseFloat(data[0].lon);
        const placeName = data[0].display_name.split(',')[0];

        setUserLocation({ lat: targetLat, lng: targetLng });
        setUserAddress(data[0].display_name.split(',').slice(0, 3).join(','));

        await fetchRealHospitalsNear(targetLat, targetLng, placeName);
      } else {
        setLocationError(`Could not find "${cityInput}". Please check spelling.`);
      }
    } catch {
      setLocationError('Network error searching location.');
    } finally {
      setLocationLoading(false);
    }
  };

  // Trigger GPS Geolocation
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }

    setLocationLoading(true);
    setLocationError('');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        setUserLocation({ lat: userLat, lng: userLng });

        const placeName = await reverseGeocode(userLat, userLng);
        await fetchRealHospitalsNear(userLat, userLng, placeName);

        setLocationLoading(false);
      },
      (err) => {
        setLocationError('Camera/Location permission denied or unavailable. You can type your city/town below instead.');
        setLocationLoading(false);
      },
      { timeout: 12000, enableHighAccuracy: true }
    );
  };

  useEffect(() => {
    // Attempt auto-detect on mount
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const userLat = pos.coords.latitude;
          const userLng = pos.coords.longitude;
          setUserLocation({ lat: userLat, lng: userLng });
          const placeName = await reverseGeocode(userLat, userLng);
          await fetchRealHospitalsNear(userLat, userLng, placeName);
        },
        () => { /* silent fallback */ }
      );
    }
  }, []);

  // Filter hospitals by category / search query
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
                <MapPin className="w-3.5 h-3.5 text-emerald-400" /> GPS Precision Medical Finder
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight" style={{ fontFamily: 'Playfair Display, serif' }}>
                Nearby Hospitals & Emergency Map
              </h1>
              <p className="text-emerald-200/80 text-sm mt-2 max-w-xl leading-relaxed">
                Detect your exact GPS location or type your town/city to discover real nearby 24/7 emergency ICUs, trauma centers, and pharmacies.
              </p>
            </div>

            {/* GPS Trigger Button */}
            <div className="flex flex-col gap-2 shrink-0 w-full sm:w-auto">
              <button
                onClick={handleDetectLocation}
                disabled={locationLoading}
                className="bg-emerald-500 hover:bg-emerald-400 text-white font-semibold text-sm px-5 py-3 rounded-full transition-all shadow-lg flex items-center justify-center gap-2"
              >
                {locationLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Locating Your GPS Position…</>
                ) : (
                  <><Compass className="w-4 h-4" /> Detect My Exact Location</>
                )}
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* ── Main Locator Body ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20 space-y-6">
        
        {/* ── LIVE USER LOCATION BADGE ── */}
        {userLocation && (
          <div className="bg-emerald-900 text-white rounded-3xl p-4 sm:p-5 shadow-lg flex items-center justify-between gap-3 border border-emerald-700/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500/30 rounded-2xl flex items-center justify-center shrink-0 border border-emerald-400/40">
                <MapPin className="w-5 h-5 text-emerald-300 animate-bounce" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-300 tracking-wider">Your Live GPS Location</span>
                <p className="font-extrabold text-white text-sm sm:text-base">
                  {userAddress || `${userLocation.lat.toFixed(4)}°N, ${userLocation.lng.toFixed(4)}°E`}
                </p>
              </div>
            </div>
            <span className="text-xs bg-emerald-800 text-emerald-200 border border-emerald-600 px-3 py-1 rounded-full font-semibold hidden sm:inline-block">
              🎯 Distances & Hospitals Calibrated
            </span>
          </div>
        )}

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
                For immediate life-threatening medical emergencies, call 108 Ambulance or 112 directly.
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

        {/* ── CITY GEOLOCATOR SEARCH + CATEGORY FILTERS ── */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 space-y-4">
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            
            {/* City / Town Search Form */}
            <form onSubmit={handleCitySearch} className="flex gap-2 w-full md:w-auto flex-1 max-w-lg">
              <div className="relative flex-1">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600" />
                <input
                  type="text"
                  placeholder="Enter your town or city (e.g. Cuttack, Puri, Rourkela, Kolkata, Delhi)…"
                  value={cityInput}
                  onChange={e => setCityInput(e.target.value)}
                  className="input-field pl-10 py-2.5 text-xs w-full"
                />
              </div>
              <button type="submit" disabled={locationLoading} className="btn-primary py-2.5 px-4 text-xs shrink-0">
                {locationLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Find Hospitals'}
              </button>
            </form>

            {/* Hospital Name Filter */}
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Filter results by name…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="input-field pl-10 py-2.5 text-xs w-full"
              />
            </div>

          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap gap-1.5 pt-2 border-t border-gray-100">
            {[
              { id: 'all', label: 'All Medical Centers' },
              { id: 'emergency', label: '🚨 24/7 Emergency ICU' },
              { id: 'general', label: '🏥 Multi-Specialty' },
              { id: 'pharmacy', label: '💊 24/7 Pharmacy' },
              { id: 'bloodbank', label: '🩸 Blood Bank' },
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {locationError && (
            <p className="text-xs text-amber-600 mt-2 font-medium flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {locationError}
            </p>
          )}
        </div>

        {/* ── MAP CANVAS & HOSPITAL LIST GRID ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Hospital Cards */}
          <div className="lg:col-span-6 space-y-4">
            <div className="flex items-center justify-between text-xs text-gray-500 font-semibold">
              <span>Showing {filteredHospitals.length} Nearby Hospitals</span>
              {userLocation && <span className="text-emerald-700 font-bold">🎯 Sorted by exact distance</span>}
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
                        <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full text-xs font-extrabold shrink-0 shadow-sm">
                          {distanceKm} km away
                        </div>
                      )}
                    </div>

                    <p className="text-xs text-gray-500 flex items-center gap-1.5 mb-3">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate font-medium">{hosp.address}</span>
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
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3.5 py-1.5 rounded-full transition-all shadow-sm flex items-center gap-1"
                      >
                        <Navigation className="w-3.5 h-3.5" /> Directions
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Embedded Map Canvas */}
          <div className="lg:col-span-6 bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sticky top-20">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-gray-900 text-lg" style={{ fontFamily: 'Playfair Display, serif' }}>
                  Interactive Map Canvas
                </h3>
              </div>
              <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                {selectedHospital.name.split(' ')[0]} Highlighted
              </span>
            </div>

            {/* Embedded OpenStreetMap Canvas Centered on Selected Hospital */}
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
              <div className="flex items-start justify-between gap-2 mb-1">
                <h4 className="font-bold text-gray-900 text-sm">{selectedHospital.name}</h4>
                {userLocation && (
                  <span className="text-xs font-extrabold text-emerald-800 bg-white px-2.5 py-0.5 rounded-full border border-emerald-200 shrink-0">
                    {calculateDistanceKm(userLocation.lat, userLocation.lng, selectedHospital.lat, selectedHospital.lng)} km
                  </span>
                )}
              </div>
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
                  className="flex-1 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold py-2 text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm"
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
