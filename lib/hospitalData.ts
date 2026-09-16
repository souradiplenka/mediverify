export interface Hospital {
  id: string;
  name: string;
  category: 'emergency' | 'general' | 'pharmacy' | 'bloodbank';
  address: string;
  city: string;
  phone: string;
  lat: number;
  lng: number;
  is24x7: boolean;
  icuAvailable: boolean;
  rating: number;
  openHours: string;
}

/* ── Sample Medical Centers & Hospitals Dataset (India / Odisha / Major Hubs) ── */
export const HOSPITALS_DATABASE: Hospital[] = [
  {
    id: 'hosp-1',
    name: 'AIIMS All India Institute of Medical Sciences',
    category: 'emergency',
    address: 'Sijua, Patrapada, Bhubaneswar, Odisha 751019',
    city: 'Bhubaneswar',
    phone: '+91 674 247 6789',
    lat: 20.2285,
    lng: 85.7779,
    is24x7: true,
    icuAvailable: true,
    rating: 4.8,
    openHours: '24 Hours Emergency & Trauma Care',
  },
  {
    id: 'hosp-2',
    name: 'Apollo Hospitals',
    category: 'emergency',
    address: '351, Sainik School Rd, Gajapati Nagar, Bhubaneswar, Odisha 751005',
    city: 'Bhubaneswar',
    phone: '+91 674 666 1066',
    lat: 20.3045,
    lng: 85.8335,
    is24x7: true,
    icuAvailable: true,
    rating: 4.7,
    openHours: '24/7 Multi-Specialty Care',
  },
  {
    id: 'hosp-3',
    name: 'SUM Ultimate Medicare',
    category: 'emergency',
    address: 'K8 Kalinga Nagar, Ghatikia, Bhubaneswar, Odisha 751003',
    city: 'Bhubaneswar',
    phone: '+91 674 350 0500',
    lat: 20.2789,
    lng: 85.7721,
    is24x7: true,
    icuAvailable: true,
    rating: 4.9,
    openHours: '24/7 Emergency & Critical Care',
  },
  {
    id: 'hosp-4',
    name: 'KIMS Kalinga Institute of Medical Sciences',
    category: 'general',
    address: 'KIIT Campus 5, Patia, Bhubaneswar, Odisha 751024',
    city: 'Bhubaneswar',
    phone: '+91 674 272 5182',
    lat: 20.3541,
    lng: 85.8156,
    is24x7: true,
    icuAvailable: true,
    rating: 4.6,
    openHours: '24 Hours Super Specialty',
  },
  {
    id: 'hosp-5',
    name: 'Capital Hospital (Government Emergency)',
    category: 'emergency',
    address: 'Unit 6, Ganga Nagar, Bhubaneswar, Odisha 751001',
    city: 'Bhubaneswar',
    phone: '+91 674 239 1983',
    lat: 20.2642,
    lng: 85.8239,
    is24x7: true,
    icuAvailable: true,
    rating: 4.2,
    openHours: '24/7 Govt Trauma Center',
  },
  {
    id: 'hosp-6',
    name: 'Apollo Pharmacy 24/7 Medical Store',
    category: 'pharmacy',
    address: 'Plot 12, Janpath Rd, Master Canteen, Bhubaneswar 751001',
    city: 'Bhubaneswar',
    phone: '+91 674 253 4488',
    lat: 20.2681,
    lng: 85.8398,
    is24x7: true,
    icuAvailable: false,
    rating: 4.5,
    openHours: 'Open 24 Hours',
  },
  {
    id: 'hosp-7',
    name: 'Red Cross Blood Bank & Component Center',
    category: 'bloodbank',
    address: 'Red Cross Bhawan, Unit 9, Bhubaneswar, Odisha 751022',
    city: 'Bhubaneswar',
    phone: '+91 674 239 1234',
    lat: 20.2815,
    lng: 85.8370,
    is24x7: true,
    icuAvailable: false,
    rating: 4.6,
    openHours: '24/7 Blood Donation & Supply',
  },
  {
    id: 'hosp-8',
    name: 'MedPlus 24 Hours Pharmacy',
    category: 'pharmacy',
    address: 'Near Railway Station, Cuttack Road, Bhubaneswar 751006',
    city: 'Bhubaneswar',
    phone: '+91 674 257 8899',
    lat: 20.2610,
    lng: 85.8450,
    is24x7: true,
    icuAvailable: false,
    rating: 4.4,
    openHours: 'Open 24 Hours',
  }
];

/* ── Haversine Distance Formula (calculates distance in km between 2 lat/lng points) ── */
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Math.round(distance * 10) / 10; // Round to 1 decimal place
}
