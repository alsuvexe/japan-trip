import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export interface TripTheme {
  accentColor: string;
  accentGradient: string;
  bgColor: string;
  bgImage: string;
  bgOpacity: number;
  sidebarActive: string;
  sidebarActiveBg: string;
  cardGlow: string;
}

export interface Trip {
  id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  cities: string[];
  status: 'upcoming' | 'in_progress' | 'completed';
  coverImage: string;
  theme: TripTheme;
}

const DEFAULT_THEME: TripTheme = {
  accentColor: '#0e7490',
  accentGradient: 'linear-gradient(135deg, #0e7490 0%, #0284c7 100%)',
  bgColor: '#e2e8f0',
  bgImage: '',
  bgOpacity: 0,
  sidebarActive: '#0e7490',
  sidebarActiveBg: 'rgba(14,116,144,0.07)',
  cardGlow: 'rgba(14, 116, 144, 0.08)',
};

const JAPAN_TRIP: Trip = {
  id: 'japan-2026',
  title: 'Japan Trip',
  destination: 'Japón',
  startDate: '2026-12-04',
  endDate: '2026-12-14',
  cities: ['Osaka', 'Kioto', 'Tokio'],
  status: 'upcoming',
  coverImage: '/image.png',
  theme: {
    accentColor: '#be185d',
    accentGradient: 'linear-gradient(135deg, #0e7490 0%, #be185d 100%)',
    bgColor: '#8ab4cc',
    bgImage: '/image.png',
    bgOpacity: 0.9,
    sidebarActive: '#c94060',
    sidebarActiveBg: 'rgba(190,24,93,0.07)',
    cardGlow: 'rgba(14, 116, 144, 0.08)',
  },
};

const LS_KEY = 'trips_store';

function loadTrips(): Trip[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const stored: Trip[] = JSON.parse(raw);
      const hasJapan = stored.some((t) => t.id === 'japan-2026');
      if (!hasJapan) return [JAPAN_TRIP, ...stored];
      return stored;
    }
  } catch { /* ignore */ }
  return [JAPAN_TRIP];
}

function persistTrips(trips: Trip[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(trips));
}

export { DEFAULT_THEME };

interface TripContextValue {
  trips: Trip[];
  activeTrip: Trip | null;
  setActiveTrip: (trip: Trip | null) => void;
  addTrip: (trip: Omit<Trip, 'id' | 'theme' | 'coverImage'>) => void;
}

const TripContext = createContext<TripContextValue>({
  trips: [],
  activeTrip: null,
  setActiveTrip: () => {},
  addTrip: () => {},
});

export function TripProvider({ children }: { children: ReactNode }) {
  const [trips, setTrips] = useState<Trip[]>(loadTrips);
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);

  const addTrip = useCallback((data: Omit<Trip, 'id' | 'theme' | 'coverImage'>) => {
    const newTrip: Trip = {
      ...data,
      id: `trip-${Date.now()}`,
      coverImage: '',
      theme: DEFAULT_THEME,
    };
    setTrips((prev) => {
      const updated = [...prev, newTrip];
      persistTrips(updated);
      return updated;
    });
  }, []);

  return (
    <TripContext.Provider value={{ trips, activeTrip, setActiveTrip, addTrip }}>
      {children}
    </TripContext.Provider>
  );
}

export function useTrips() {
  return useContext(TripContext);
}
