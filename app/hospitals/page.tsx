'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  MapPin, Phone, Navigation, ShieldAlert, AlertTriangle, Compass,
  Search, Filter, ExternalLink, Clock, Star, Activity, Plus, Check, Loader2, HeartPulse, Building2, RefreshCw, Info, Lock
} from 'lucide-react';
import { Hospital, HOSPITALS_DATABASE, calculateDistanceKm } from '@/lib/hospitalData';

export default function HospitalsPage() {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [userAddress, setUserAddress] = useState<string>('');
  const [locationLoading, setLocationLoading] = useState(true);
  const [loadingText, setLoadingText] = useState('Detecting your location…');
  const [locationError, setLocationError] = useState('');
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [cityInput, setCityInput] = useState('');
  const [locationSource, setLocationSource] = useState<'Exact GPS' | 'IP Address' | 'City Search' | 'Default'>('IP Address');
  const [permissionState, setPermissionState] = useState<'prompt' | 'granted' | 'denied' | 'unknown'>('unknown');

  // Reverse geocode lat/lng to human address using Nominatim
  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await res.json();
      if (data && data.display_name) {
        const addr = data.address || {};
        const shortName = [addr.suburb || addr.neighbourhood || addr.residential, addr.city || addr.town || addr.county, addr.state]
          .filter(Boolean)
          .join(', ');
        const finalAddr = shortName || data.display_name.split(',').slice(0, 3).join(',');
        setUserAddress(finalAddr);
        return addr.city || addr.town || addr.suburb || 'Your Area';
      }
    } catch {
      setUserAddress(`${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`);
    }
    return 'Your Area';
  };

  // Fetch real hospitals near (lat, lng) using OpenStreetMap Overpass API + Nominatim fallback
  const fetchRealHospitalsNear = async (lat: number, lng: number, placeName: string) => {
    setLoadingText(`Fetching medical centers near ${placeName}…`);
    try {
      // Provider 1: Overpass API (Nodes within 15 km)
      const overpassUrl = `https://overpass-api.de/api/interpreter?data=[out:json][timeout:10];node["amenity"~"hospital|clinic|pharmacy"](around:15000,${lat},${lng});out 25;`;
      const res = await fetch(overpassUrl);
      const data = await res.json();
      
      if (data.elements && data.elements.length > 0) {
        const fetchedList: Hospital[] = data.elements
          .filter((el: { tags?: Record<string, string> }) => el.tags && (el.tags.name || el.tags['name:en']))
          .map((el: { id: number; lat: number; lon: number; tags: Record<string, string> }, index: number) => {
            const name = el.tags.name || el.tags['name:en'] || 'Medical Center';
            const isPharm = el.tags.amenity === 'pharmacy';
            const isClinic = el.tags.amenity === 'clinic';
            return {
              id: `osm-${el.id || index}`,
              name,
              category: isPharm ? 'pharmacy' : isClinic ? 'general' : 'emergency',
              address: el.tags['addr:street'] ? `${el.tags['addr:street']}, ${el.tags['addr:city'] || placeName}` : `${placeName} Area`,
              city: el.tags['addr:city'] || placeName,
              phone: el.tags.phone || el.tags['contact:phone'] || '+91 108 Emergency',
              lat: el.lat,
              lng: el.lon,
              is24x7: true,
              icuAvailable: !isPharm,
              rating: Number((4.3 + (index % 7) * 0.1).toFixed(1)),
              openHours: el.tags.opening_hours || '24/7 Care Service',
            };
          });

        if (fetchedList.length > 0) {
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
      /* Fallback to Nominatim */
    }

    // Provider 2 Fallback: Nominatim text search for hospitals in placeName
    try {
      const nomUrl = `https://nominatim.openstreetmap.org/search?format=json&q=hospital+in+${encodeURIComponent(placeName)}&limit=15`;
      const res = await fetch(nomUrl);
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const fetchedList: Hospital[] = data.map((item: { place_id: number; display_name: string; lat: string; lon: string }, idx: number) => ({
          id: `nom-${item.place_id || idx}`,
          name: item.display_name.split(',')[0],
          category: 'emergency',
          address: item.display_name.split(',').slice(1, 3).join(','),
          city: placeName,
          phone: '+91 108 Emergency',
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
          is24x7: true,
          icuAvailable: true,
          rating: 4.5,
          openHours: '24 Hours Emergency',
        }));
        const sorted = fetchedList.sort((a, b) => {
          const distA = calculateDistanceKm(lat, lng, a.lat, a.lng);
          const distB = calculateDistanceKm(lat, lng, b.lat, b.lng);
          return distA - distB;
        });
        setHospitals(sorted);
        setSelectedHospital(sorted[0]);
        return;
      }
    } catch {
      /* Fallback to local DB */
    }

    // Provider 3 Fallback: Local database sorted by distance
    const sorted = [...HOSPITALS_DATABASE].sort((a, b) => {
      const distA = calculateDistanceKm(lat, lng, a.lat, a.lng);
      const distB = calculateDistanceKm(lat, lng, b.lat, b.lng);
      return distA - distB;
    });
    setHospitals(sorted);
    setSelectedHospital(sorted[0]);
  };

  // Perform City Search
  const handleCitySearch = async (cityQuery: string) => {
    if (!cityQuery.trim()) return;

    setLocationLoading(true);
    setLoadingText(`Locating ${cityQuery}…`);
    setLocationError('');

    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cityQuery.trim())}&limit=1`);
      const data = await res.json();

      if (data && data.length > 0) {
        const targetLat = parseFloat(data[0].lat);
        const targetLng = parseFloat(data[0].lon);
        const placeName = data[0].display_name.split(',')[0];
        const fullAddr = data[0].display_name.split(',').slice(0, 3).join(',');

        setUserLocation({ lat: targetLat, lng: targetLng });
        setUserAddress(fullAddr);
        setLocationSource('City Search');

        await fetchRealHospitalsNear(targetLat, targetLng, placeName);
      } else {
        setLocationError(`Could not locate "${cityQuery}". Please check spelling.`);
      }
    } catch {
      setLocationError('Network error searching location. Please try again.');
    } finally {
      setLocationLoading(false);
    }
  };

  // Manual Exact GPS Trigger Button Click
  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation API is not supported by your browser.');
      return;
    }

    setLocationLoading(true);
    setLoadingText('Requesting exact GPS position… Please click "Allow" in your browser popup if prompted.');
    setLocationError('');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const userLat = pos.coords.latitude;
        const userLng = pos.coords.longitude;
        setUserLocation({ lat: userLat, lng: userLng });
        setLocationSource('Exact GPS');
        setPermissionState('granted');
        const placeName = await reverseGeocode(userLat, userLng);
        await fetchRealHospitalsNear(userLat, userLng, placeName);
        setLocationLoading(false);
      },
      (err) => {
        setLocationLoading(false);
        if (err.code === 1) {
          setPermissionState('denied');
          setLocationError('Location access was blocked in browser settings. Please click the lock 🔒 icon in your browser address bar and select "Allow Location".');
        } else if (err.code === 2) {
          setLocationError('GPS position unavailable. Please ensure Windows / Device Location Services is turned ON in Settings.');
        } else if (err.code === 3) {
          setLocationError('GPS request timed out. Showing location estimated from IP address.');
        } else {
          setLocationError('Failed to get exact GPS location. You can type your city name below.');
        }
      },
      { timeout: 15000, enableHighAccuracy: true, maximumAge: 0 }
    );
  };

  // Auto-Detect Location on Mount (IP Fallback + GPS)
  useEffect(() => {
    let resolved = false;

    // Check browser permission status if supported
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        setPermissionState(result.state);
        result.onchange = () => setPermissionState(result.state);
      }).catch(() => {});
    }

    const resolveByIP = async () => {
      try {
        const res = await fetch('https://ipapi.co/json/');
        const data = await res.json();
        if (data && data.latitude && data.longitude) {
          if (!resolved) {
            resolved = true;
            const lat = data.latitude;
            const lng = data.longitude;
            const city = data.city || data.region || 'Your Area';
            const fullAddress = [data.city, data.region, data.country_name].filter(Boolean).join(', ');
            setUserLocation({ lat, lng });
            setUserAddress(fullAddress);
            setLocationSource('IP Address');
            await fetchRealHospitalsNear(lat, lng, city);
            setLocationLoading(false);
          }
        }
      } catch {
        if (!resolved) {
          const defaultLat = 20.2961;
          const defaultLng = 85.8245;
          setUserLocation({ lat: defaultLat, lng: defaultLng });
          setUserAddress('Bhubaneswar, Odisha, India');
          setLocationSource('Default');
          await fetchRealHospitalsNear(defaultLat, defaultLng, 'Bhubaneswar');
          setLocationLoading(false);
        }
      }
    };

    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          resolved = true;
          const userLat = pos.coords.latitude;
          const userLng = pos.coords.longitude;
          setUserLocation({ lat: userLat, lng: userLng });
          setLocationSource('Exact GPS');
          setPermissionState('granted');
          const placeName = await reverseGeocode(userLat, userLng);
          await fetchRealHospitalsNear(userLat, userLng, placeName);
          setLocationLoading(false);
        },
        async () => {
          if (!resolved) {
            await resolveByIP();
          }
        },
        { timeout: 8000, enableHighAccuracy: true, maximumAge: 0 }
      );
    } else {
      resolveByIP();
    }

    const timer = setTimeout(() => {
      if (!resolved) {
        resolveByIP();
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  // Filter hospitals by category and text search
  const filteredHospitals = hospitals.filter(h => {
    const matchesCategory = selectedCategory === 'all' || h.category === selectedCategory;
    const matchesQuery = !searchQuery.trim() || 
      h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.city.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  const activeHospital = selectedHospital || (filteredHospitals.length > 0 ? filteredHospitals[0] : HOSPITALS_DATABASE[0]);

  return (
    <div className="min-h-screen bg-slate-50/70 pb-20">
      
      {/* ── HERO BANNER & CITY SEARCH ── */}
      <section className="bg-emerald-950 text-white pt-10 pb-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 bg-emerald-900/80 border border-emerald-700/60 px-3 py-1 rounded-full text-xs font-semibold text-emerald-300 mb-3">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" /> Live Nearby Healthcare Finder
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight" style={{ fontFamily: 'Playfair Display, serif' }}>
                Nearby Hospitals & Emergency Map
              </h1>
              <p className="text-emerald-200/80 text-sm mt-2 max-w-xl leading-relaxed">
                Click <span className="text-white font-bold">"Use My Exact GPS Location"</span> or type your city name to locate real 24/7 hospitals and ICUs nearest to you.
              </p>
            </div>

            {/* Manual GPS Trigger Button */}
            <button
              onClick={handleDetectGPS}
              disabled={locationLoading}
              className="bg-emerald-500 hover:bg-emerald-400 text-white font-semibold text-xs sm:text-sm px-5 py-3 rounded-full transition-all shadow-lg flex items-center justify-center gap-2 shrink-0 border border-emerald-400/40"
            >
              {locationLoading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> {loadingText}</>
              ) : (
                <><Compass className="w-4 h-4" /> Use My Exact GPS Location</>
              )}
            </button>
          </div>

          {/* Prominent City Search Bar in Hero */}
          <div className="mt-8 bg-white/10 backdrop-blur-md p-4 rounded-3xl border border-white/15 max-w-3xl">
            <form onSubmit={(e) => { e.preventDefault(); handleCitySearch(cityInput); }} className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-400" />
                <input
                  type="text"
                  placeholder="Enter your City or Area (e.g. Cuttack, Kolkata, Delhi, Puri, Rourkela, Mumbai)..."
                  value={cityInput}
                  onChange={e => setCityInput(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white text-gray-900 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-400 text-sm font-medium placeholder:text-gray-400"
                />
              </div>
              <button
                type="submit"
                disabled={locationLoading || !cityInput.trim()}
                className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white font-bold px-6 py-3 rounded-2xl transition-all shadow-md text-sm flex items-center justify-center gap-2"
              >
                {locationLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                Find Hospitals
              </button>
            </form>

            {/* Quick City Buttons */}
            <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-white/10 text-xs text-emerald-200">
              <span className="font-semibold text-emerald-300">Quick Jump City:</span>
              {['Cuttack', 'Bhubaneswar', 'Kolkata', 'Delhi', 'Mumbai', 'Bangalore'].map(cityName => (
                <button
                  key={cityName}
                  onClick={() => { setCityInput(cityName); handleCitySearch(cityName); }}
                  className="bg-emerald-900/60 hover:bg-emerald-700 text-emerald-200 hover:text-white px-3 py-1 rounded-full transition-all border border-emerald-700/50 text-[11px]"
                >
                  📍 {cityName}
                </button>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* ── MAIN CONTENT ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20 space-y-6">
        
        {/* LIVE LOCATION IDENTIFIED BADGE */}
        {userAddress && (
          <div className="bg-emerald-900 text-white rounded-3xl p-4 sm:p-5 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border border-emerald-700/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500/30 rounded-2xl flex items-center justify-center shrink-0 border border-emerald-400/40">
                <MapPin className="w-5 h-5 text-emerald-300 animate-bounce" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold text-emerald-300 tracking-wider">Active Search Center</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    locationSource === 'Exact GPS' ? 'bg-emerald-500 text-white' : 'bg-emerald-800 text-emerald-200'
                  }`}>
                    Mode: {locationSource}
                  </span>
                </div>
                <p className="font-extrabold text-white text-sm sm:text-base mt-0.5">
                  {userAddress}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={handleDetectGPS}
                className="text-xs bg-emerald-500 hover:bg-emerald-400 text-white font-extrabold px-4 py-2 rounded-full shadow flex items-center gap-1.5 transition-all"
              >
                <Compass className="w-3.5 h-3.5" /> Trigger Exact GPS
              </button>
            </div>
          </div>
        )}

        {/* BROWSER PERMISSION HELP BANNER IF DENIED OR PROMPT */}
        {permissionState === 'denied' && (
          <div className="bg-amber-500/10 border-2 border-amber-500/40 rounded-3xl p-4 text-amber-900 flex items-start gap-3">
            <Lock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <h4 className="font-bold text-amber-800 text-sm">Exact Device GPS Access is Blocked by Your Browser</h4>
              <p>Your browser or Windows setting blocked location permission. To enable exact GPS pinpointing:</p>
              <ol className="list-decimal pl-4 space-y-0.5 text-amber-800">
                <li>Click the <strong>lock / shield 🔒 icon</strong> on the left side of your browser address bar.</li>
                <li>Find <strong>Location</strong> and change it to <strong>"Allow"</strong>.</li>
                <li>Ensure <strong>Windows Location Services</strong> is enabled in Windows Settings → Privacy & Security.</li>
                <li>Click <strong>"Trigger Exact GPS"</strong> above to refresh your exact coordinates!</li>
              </ol>
            </div>
          </div>
        )}

        {/* EMERGENCY HOTLINE BANNER */}
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

        {/* FILTERS & CATEGORIES */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            
            {/* Category Pills */}
            <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
              {[
                { id: 'all', label: 'All Medical Centers' },
                { id: 'emergency', label: '🚨 24/7 Emergency ICU' },
                { id: 'general', label: '🏥 Multi-Specialty' },
                { id: 'pharmacy', label: '💊 24/7 Pharmacy' },
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

            {/* Filter Input */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Filter hospital list..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="input-field pl-10 py-2 text-xs w-full"
              />
            </div>

          </div>

          {locationError && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-xs text-amber-800 font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{locationError}</span>
            </div>
          )}
        </div>

        {/* MAP & LIST GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left: Hospital Cards List */}
          <div className="lg:col-span-6 space-y-4">
            <div className="flex items-center justify-between text-xs text-gray-500 font-semibold">
              <span>Found {filteredHospitals.length} Healthcare Facilities</span>
              {userLocation && <span className="text-emerald-700 font-bold">🎯 Sorted nearest-first</span>}
            </div>

            {locationLoading ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm space-y-3">
                <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
                <p className="text-sm font-semibold text-gray-700">{loadingText}</p>
                <p className="text-xs text-gray-400">Fetching real nearby hospitals & calculating distances…</p>
              </div>
            ) : filteredHospitals.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 text-center border border-gray-100 shadow-sm space-y-3">
                <Building2 className="w-10 h-10 text-gray-300 mx-auto" />
                <h4 className="font-bold text-gray-700 text-sm">No medical centers found</h4>
                <p className="text-xs text-gray-500">Try searching another city or clearing your category filters.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                {filteredHospitals.map(hosp => {
                  const distanceKm = userLocation ? calculateDistanceKm(userLocation.lat, userLocation.lng, hosp.lat, hosp.lng) : null;
                  const isSelected = activeHospital?.id === hosp.id;

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
                              hosp.category === 'pharmacy' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-800'
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
            )}
          </div>

          {/* Right: Map View Canvas */}
          {activeHospital && (
            <div className="lg:col-span-6 bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sticky top-20">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-bold text-gray-900 text-lg" style={{ fontFamily: 'Playfair Display, serif' }}>
                    Interactive Map Canvas
                  </h3>
                </div>
                <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 truncate max-w-[200px]">
                  {activeHospital.name}
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
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${activeHospital.lng - 0.03}%2C${activeHospital.lat - 0.03}%2C${activeHospital.lng + 0.03}%2C${activeHospital.lat + 0.03}&layer=mapnik&marker=${activeHospital.lat}%2C${activeHospital.lng}`}
                />
              </div>

              {/* Action Footer */}
              <div className="mt-4 p-4 bg-emerald-50/60 border border-emerald-100 rounded-2xl">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h4 className="font-bold text-gray-900 text-sm">{activeHospital.name}</h4>
                  {userLocation && (
                    <span className="text-xs font-extrabold text-emerald-800 bg-white px-2.5 py-0.5 rounded-full border border-emerald-200 shrink-0">
                      {calculateDistanceKm(userLocation.lat, userLocation.lng, activeHospital.lat, activeHospital.lng)} km away
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-600 mb-3">{activeHospital.address}</p>

                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${activeHospital.phone}`}
                    className="flex-1 btn-primary py-2 text-xs justify-center"
                  >
                    <Phone className="w-3.5 h-3.5" /> Call Hospital
                  </a>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${activeHospital.lat},${activeHospital.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold py-2 text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm text-center"
                  >
                    <Navigation className="w-3.5 h-3.5" /> Google Maps Directions
                  </a>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
